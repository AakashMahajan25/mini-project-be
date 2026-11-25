"use strict";

// Loads every PDF / DOCX / DOC / TXT file in seed-docs/ into the shared RAG corpus (visible to all users).
// Usage: npm run seed:docs            (skips files already loaded, by content hash)
//        npm run seed:docs -- --force (re-embeds everything)

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");
const { createAI, configured } = require("../ai");
const createRag = require("../rag");
const { detectKind, SUPPORTED } = require("../extract");
const { titleFromFilename } = require("../documents");

const SEED_DIR = path.join(__dirname, "..", "seed-docs");
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "storage", "documents"));

(async () => {
  const force = process.argv.includes("--force");
  if (!configured()) {
    console.error("No AI key in frruit-be/.env (AI_GATEWAY_API_KEY or OPENAI_API_KEY); seed documents need it for embeddings.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.POSTGRES_URI });
  const rag = createRag({ pool, openai: createAI() });
  await rag.initDB();
  const dest = path.join(UPLOAD_DIR, "seed");
  await fs.mkdir(dest, { recursive: true });

  const files = (await fs.readdir(SEED_DIR)).filter(f => !f.startsWith(".") && f.toLowerCase() !== "readme.md");
  if (!files.length) console.log(`No files in ${SEED_DIR}. Add PDFs (annual reports, regulator guides…) and run again.`);
  for (const name of files) {
    const buffer = await fs.readFile(path.join(SEED_DIR, name));
    const kind = detectKind(buffer, name);
    if (!kind) { console.log(`skip  ${name} (unsupported type)`); continue; }
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const existing = await pool.query(`SELECT id, status FROM rag_documents WHERE source_type='seed' AND sha256=$1`, [sha256]);
    let id = existing.rows[0]?.id;
    if (id && existing.rows[0].status === "ready" && !force) { console.log(`ok    ${name} (already loaded as #${id})`); continue; }
    if (!id) {
      const storagePath = path.join(dest, `${sha256.slice(0, 16)}.${kind}`);
      await fs.writeFile(storagePath, buffer);
      const r = await pool.query(
        `INSERT INTO rag_documents(user_id, source_type, title, filename, mime, kind, storage_path, size_bytes, sha256, status)
         VALUES(NULL,'seed',$1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id`,
        [titleFromFilename(name), name, SUPPORTED[kind], kind, storagePath, buffer.length, sha256]
      );
      id = r.rows[0].id;
    }
    const result = await rag.processDocument(id);
    console.log(`${result.status === "ready" ? "ready" : "FAIL "} ${name} → #${id}${result.chunk_count ? ` (${result.chunk_count} chunks)` : ""}${result.error ? `: ${result.error}` : ""}`);
  }
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
