"use strict";

// Embedding pipeline + pgvector store.
// Corpus: user uploads (private to the uploader), news articles and seed documents (shared).
// Search is hybrid: pgvector cosine similarity + Postgres full-text, merged by reciprocal rank fusion.

const fs = require("fs/promises");
const { extractPages, chunkPages } = require("./extract");

const EMBED_MODEL    = process.env.EMBED_MODEL || "text-embedding-3-small";
const EMBED_DIMS     = 1536; // fixed by the rag_chunks.embedding column
const EMBED_BATCH    = 64;
const MIN_SIMILARITY = Number(process.env.RAG_MIN_SIMILARITY) || 0.3;
const CANDIDATES     = 24;
const RRF_K          = 60;
const NEWS_SYNC_BATCH = 200;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const toVector = (arr) => `[${arr.join(",")}]`;

module.exports = function createRag({ pool, openai }) {
  const hasKey = () => Boolean(process.env.OPENAI_API_KEY);
  let syncingNews = false;
  let queue = Promise.resolve(); // uploads are processed one at a time

  async function initDB() {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
      CREATE TABLE IF NOT EXISTS rag_documents (
        id              SERIAL PRIMARY KEY,
        user_id         INT REFERENCES ai_users(user_id) ON DELETE CASCADE, -- NULL = shared corpus
        source_type     TEXT NOT NULL CHECK (source_type IN ('upload','news','seed')),
        news_article_id INT UNIQUE REFERENCES news_articles(id) ON DELETE CASCADE,
        title           TEXT NOT NULL,
        filename        TEXT,
        mime            TEXT,
        kind            TEXT,
        storage_path    TEXT,
        size_bytes      INT,
        sha256          TEXT,
        url             TEXT,
        market          TEXT,
        published_at    TIMESTAMPTZ,
        uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
        status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
        error           TEXT,
        page_count      INT,
        chunk_count     INT DEFAULT 0,
        processed_at    TIMESTAMPTZ,
        "createdAt"     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS rag_documents_user_idx ON rag_documents(user_id, source_type);
      CREATE TABLE IF NOT EXISTS rag_chunks (
        id           SERIAL PRIMARY KEY,
        document_id  INT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
        chunk_index  INT NOT NULL,
        page_from    INT,
        page_to      INT,
        heading      TEXT,
        content      TEXT NOT NULL,
        token_count  INT,
        embedding    vector(${EMBED_DIMS}),
        tsv          tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(heading, '') || ' ' || content)) STORED,
        UNIQUE (document_id, chunk_index)
      );
      CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx ON rag_chunks USING hnsw (embedding vector_cosine_ops);
      CREATE INDEX IF NOT EXISTS rag_chunks_tsv_idx ON rag_chunks USING gin (tsv);
      CREATE INDEX IF NOT EXISTS rag_chunks_document_idx ON rag_chunks(document_id);
    `);
    // Uploads interrupted by a restart go back to the queue
    await pool.query(`UPDATE rag_documents SET status='pending' WHERE status='processing'`);
    console.log("✅ RAG tables ready");
  }

  // ─── Embeddings ─────────────────────────────────────────────────────────────
  async function embed(texts) {
    const out = [];
    for (const batch of chunk(texts, EMBED_BATCH)) {
      const r = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: batch.map(t => String(t || " ").slice(0, 24000)),
        ...(EMBED_MODEL.startsWith("text-embedding-3") ? { dimensions: EMBED_DIMS } : {}),
      });
      const vectors = [...r.data].sort((a, b) => a.index - b.index).map(d => d.embedding);
      if (vectors.some(v => v.length !== EMBED_DIMS)) {
        throw new Error(`Embedding model returned ${vectors[0]?.length} dimensions; the store expects ${EMBED_DIMS}.`);
      }
      out.push(...vectors);
    }
    return out;
  }

  async function insertChunks(client, documentId, chunks, vectors) {
    if (!chunks.length) return;
    await client.query(
      `INSERT INTO rag_chunks(document_id, chunk_index, page_from, page_to, heading, content, token_count, embedding)
       SELECT $1, u.ci, u.pf, u.pt, u.h, u.c, u.tc, u.e::vector
       FROM unnest($2::int[], $3::int[], $4::int[], $5::text[], $6::text[], $7::int[], $8::text[]) AS u(ci, pf, pt, h, c, tc, e)`,
      [
        documentId,
        chunks.map(c => c.chunk_index),
        chunks.map(c => c.page_from),
        chunks.map(c => c.page_to),
        chunks.map(c => c.heading),
        chunks.map(c => c.content),
        chunks.map(c => c.token_count),
        vectors.map(toVector),
      ]
    );
  }

  // ─── Uploaded / seed documents ──────────────────────────────────────────────
  async function processDocument(documentId) {
    const { rows: [doc] } = await pool.query(`SELECT * FROM rag_documents WHERE id=$1`, [documentId]);
    if (!doc) throw new Error("Document not found");
    await pool.query(`UPDATE rag_documents SET status='processing', error=NULL WHERE id=$1`, [documentId]);
    try {
      if (!hasKey()) throw new Error("OPENAI_API_KEY is not set, so the document cannot be embedded yet. Add the key and press Retry.");
      const buffer = await fs.readFile(doc.storage_path);
      const { kind, pages } = await extractPages(buffer, doc.filename);
      const chunks = chunkPages(pages);
      if (!chunks.length) throw new Error("No text chunks could be produced from this document.");
      // Each chunk is embedded with its document title and section so short chunks keep their context
      const vectors = await embed(chunks.map(c => [doc.title, c.heading, c.content].filter(Boolean).join("\n")));

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM rag_chunks WHERE document_id=$1`, [documentId]);
        await insertChunks(client, documentId, chunks, vectors);
        await client.query(
          `UPDATE rag_documents SET status='ready', kind=$2, page_count=$3, chunk_count=$4, processed_at=NOW(), error=NULL WHERE id=$1`,
          [documentId, kind, pages.some(p => p.page != null) ? pages.length : null, chunks.length]
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      console.log(`📄  Document ${documentId} ready: ${chunks.length} chunks`);
      return { status: "ready", chunk_count: chunks.length };
    } catch (e) {
      const message = e.status === 429 ? `OpenAI rejected the request: ${e.message}` : e.message;
      await pool.query(`UPDATE rag_documents SET status='failed', error=$2 WHERE id=$1`, [documentId, message.slice(0, 500)]);
      console.error(`Document ${documentId} failed:`, message);
      return { status: "failed", error: message };
    }
  }

  // Serialises processing so several uploads don't embed in parallel
  function enqueue(documentId) {
    const run = queue.then(() => processDocument(documentId));
    queue = run.catch(() => {});
    return run;
  }

  async function resumePending() {
    const { rows } = await pool.query(
      `SELECT id FROM rag_documents WHERE status='pending' AND source_type IN ('upload','seed') ORDER BY id`
    );
    rows.forEach(r => enqueue(r.id));
  }

  // ─── News → store ───────────────────────────────────────────────────────────
  async function syncNews() {
    if (syncingNews || !hasKey()) return 0;
    syncingNews = true;
    let total = 0;
    try {
      for (;;) {
        const { rows } = await pool.query(
          `SELECT n.id, n.market, n.source, n.category, n.title, n.summary, n.link, n.published_at, n.tickers
           FROM news_articles n LEFT JOIN rag_documents d ON d.news_article_id = n.id
           WHERE d.id IS NULL ORDER BY n.published_at DESC LIMIT $1`,
          [NEWS_SYNC_BATCH]
        );
        if (!rows.length) break;
        const contents = rows.map(a => [
          a.title,
          a.summary,
          `Source: ${a.source}${a.category ? ` (${a.category})` : ""}. Published ${new Date(a.published_at).toISOString().slice(0, 16).replace("T", " ")} UTC.`,
          a.tickers?.length ? `Companies: ${a.tickers.join(", ")}.` : null,
        ].filter(Boolean).join("\n"));
        const vectors = await embed(contents);

        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const docs = await client.query(
            `INSERT INTO rag_documents(user_id, source_type, news_article_id, title, url, market, published_at, status, chunk_count, processed_at)
             SELECT NULL, 'news', u.id, u.title, u.link, u.market, u.pub, 'ready', 1, NOW()
             FROM unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::timestamptz[]) AS u(id, title, link, market, pub)
             ON CONFLICT (news_article_id) DO NOTHING
             RETURNING id, news_article_id`,
            [rows.map(a => a.id), rows.map(a => a.title), rows.map(a => a.link), rows.map(a => a.market), rows.map(a => a.published_at)]
          );
          const docByArticle = new Map(docs.rows.map(d => [d.news_article_id, d.id]));
          const keep = rows.map((a, i) => ({ docId: docByArticle.get(a.id), content: contents[i], vector: vectors[i] })).filter(x => x.docId);
          if (keep.length) {
            await client.query(
              `INSERT INTO rag_chunks(document_id, chunk_index, content, token_count, embedding)
               SELECT u.d, 0, u.c, u.tc, u.e::vector
               FROM unnest($1::int[], $2::text[], $3::int[], $4::text[]) AS u(d, c, tc, e)`,
              [keep.map(k => k.docId), keep.map(k => k.content), keep.map(k => Math.ceil(k.content.length / 4)), keep.map(k => toVector(k.vector))]
            );
          }
          await client.query("COMMIT");
          total += keep.length;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
        if (rows.length < NEWS_SYNC_BATCH) break;
      }
      if (total) console.log(`🧠  Embedded ${total} news articles`);
    } catch (e) {
      console.error("News embedding failed:", e.message);
    } finally {
      syncingNews = false;
    }
    return total;
  }

  // ─── Search ─────────────────────────────────────────────────────────────────
  // → { hits: [{ chunk_id, document_id, similarity, score, content, page_from, page_to, heading,
  //              title, source_type, url, filename, published_at, uploaded_at, market }], ms }
  async function search({ query, userId, documentIds = null, sourceTypes = null, k = 6, minSimilarity = MIN_SIMILARITY }) {
    const started = Date.now();
    const text = String(query || "").trim();
    if (!text || !hasKey()) return { hits: [], ms: 0 };
    const [vector] = await embed([text]);

    const params = [toVector(vector), userId];
    const filters = [`d.status = 'ready'`, `(d.user_id IS NULL OR d.user_id = $2)`];
    if (documentIds?.length) { params.push(documentIds); filters.push(`d.id = ANY($${params.length}::int[])`); }
    if (sourceTypes?.length) { params.push(sourceTypes); filters.push(`d.source_type = ANY($${params.length}::text[])`); }
    const where = filters.join(" AND ");

    const client = await pool.connect();
    let vectorRows, textRows;
    try {
      await client.query("BEGIN");
      // Keeps scanning the HNSW index until enough rows pass the filters
      await client.query("SET LOCAL hnsw.iterative_scan = relaxed_order");
      await client.query("SET LOCAL hnsw.ef_search = 100");
      vectorRows = (await client.query(
        `SELECT c.id, 1 - (c.embedding <=> $1::vector) AS similarity
         FROM rag_chunks c JOIN rag_documents d ON d.id = c.document_id
         WHERE ${where} AND c.embedding IS NOT NULL
         ORDER BY c.embedding <=> $1::vector LIMIT ${CANDIDATES}`,
        params
      )).rows;
      // Keyword match on any of the query's terms (OR), ranked by cover density
      textRows = (await client.query(
        `SELECT c.id, 1 - (c.embedding <=> $1::vector) AS similarity, ts_rank_cd(c.tsv, q.q) AS rank
         FROM rag_chunks c JOIN rag_documents d ON d.id = c.document_id,
              (SELECT to_tsquery('simple', string_agg(quote_literal(l), ' | ')) AS q
               FROM unnest(tsvector_to_array(to_tsvector('english', $${params.length + 1}))) AS l) q
         WHERE ${where} AND q.q IS NOT NULL AND c.tsv @@ q.q
         ORDER BY rank DESC LIMIT ${CANDIDATES}`,
        [...params, text]
      )).rows;
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    const fused = new Map();
    const add = (rows) => rows.forEach((r, rank) => {
      const cur = fused.get(r.id) || { id: r.id, similarity: Number(r.similarity), score: 0 };
      cur.score += 1 / (RRF_K + rank + 1);
      fused.set(r.id, cur);
    });
    add(vectorRows);
    add(textRows);
    const ranked = [...fused.values()]
      .filter(r => r.similarity >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    if (!ranked.length) return { hits: [], ms: Date.now() - started };

    const { rows } = await pool.query(
      `SELECT c.id AS chunk_id, c.document_id, c.content, c.page_from, c.page_to, c.heading,
              d.title, d.source_type, d.url, d.filename, d.published_at, d.uploaded_at, d.market
       FROM rag_chunks c JOIN rag_documents d ON d.id = c.document_id
       WHERE c.id = ANY($1::int[])`,
      [ranked.map(r => r.id)]
    );
    const byId = new Map(rows.map(r => [r.chunk_id, r]));
    const hits = ranked
      .map(r => byId.get(r.id) && { ...byId.get(r.id), similarity: Math.round(r.similarity * 1000) / 1000, score: r.score })
      .filter(Boolean);
    return { hits, ms: Date.now() - started };
  }

  async function stats() {
    const { rows } = await pool.query(
      `SELECT d.source_type, d.status, COUNT(DISTINCT d.id)::int AS documents, COUNT(c.id)::int AS chunks
       FROM rag_documents d LEFT JOIN rag_chunks c ON c.document_id = d.id
       GROUP BY d.source_type, d.status ORDER BY 1, 2`
    );
    return rows;
  }

  return { initDB, embed, enqueue, processDocument, resumePending, syncNews, search, stats, EMBED_MODEL };
};
