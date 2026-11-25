"use strict";

// Structured answer store: every bot answer becomes an ai_answers row with its confidence,
// its citations (with source timestamps), user feedback and a status history for human review.

const express = require("express");
const { fileUrl } = require("./documents");

const STATUSES = ["CANDIDATE", "UNCERTAIN", "UNDER_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION"];
const REVIEW_STATUSES = ["UNDER_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION"];
const FEEDBACK_REASONS = ["incorrect", "outdated", "missing_source", "wrong_source", "unclear", "not_relevant", "other"];

function reviewerEmails() {
  return String(process.env.REVIEWER_EMAILS || "")
    .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

// Citation row → the object the webapp renders (also keeps the legacy source fields)
function presentCitation(c) {
  const file = c.document_id && (c.source_type === "upload" || c.source_type === "seed")
    ? fileUrl(c.document_id, c.page_from) : null;
  return {
    marker: c.marker,
    source_type: c.source_type,
    title: c.title,
    heading: c.title,
    source_url: c.url || file,
    file_url: file,
    document_id: c.document_id,
    chunk_id: c.chunk_id,
    page_from: c.page_from,
    page_to: c.page_to,
    section: c.section || null,
    snippet: c.snippet,
    similarity: c.similarity != null ? Number(c.similarity) : null,
    supported: c.supported,
    cited: c.cited,
    source_timestamp: c.source_timestamp,
    source_date: c.source_timestamp || c.retrieved_at,
    retrieved_at: c.retrieved_at,
  };
}

module.exports = function createAnswers({ pool, auth, ok, fail }) {
  async function initDB() {
    await pool.query(`
      ALTER TABLE ai_users   ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
      ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'chat';
      ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS document_ids INT[] NOT NULL DEFAULT '{}';

      CREATE TABLE IF NOT EXISTS ai_answers (
        id                  SERIAL PRIMARY KEY,
        history_id          INT UNIQUE REFERENCES ai_prompt_history(id) ON DELETE CASCADE,
        question_history_id INT REFERENCES ai_prompt_history(id) ON DELETE SET NULL,
        user_id             INT REFERENCES ai_users(user_id) ON DELETE CASCADE,
        prompt_id           INT REFERENCES ai_prompts(prompt_id) ON DELETE CASCADE,
        flag                TEXT,
        question            TEXT,
        question_en         TEXT,
        search_query        TEXT,
        answer_en           TEXT NOT NULL,
        language            TEXT,
        status              TEXT NOT NULL CHECK (status IN (${STATUSES.map(s => `'${s}'`).join(",")})),
        confidence          NUMERIC(4,3),
        confidence_detail   JSONB,
        uncertain_reasons   TEXT[] NOT NULL DEFAULT '{}',
        model               TEXT,
        retrieval_ms        INT,
        total_ms            INT,
        reviewed_by         INT REFERENCES ai_users(user_id) ON DELETE SET NULL,
        reviewed_at         TIMESTAMPTZ,
        review_note         TEXT,
        "createdAt"         TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt"         TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ai_answers_status_idx ON ai_answers(status, "createdAt" DESC);
      CREATE INDEX IF NOT EXISTS ai_answers_user_idx ON ai_answers(user_id, "createdAt" DESC);

      CREATE TABLE IF NOT EXISTS ai_answer_citations (
        id               SERIAL PRIMARY KEY,
        answer_id        INT NOT NULL REFERENCES ai_answers(id) ON DELETE CASCADE,
        marker           TEXT NOT NULL,
        source_type      TEXT NOT NULL CHECK (source_type IN ('upload','news','seed','web','portfolio')),
        document_id      INT REFERENCES rag_documents(id) ON DELETE SET NULL,
        chunk_id         INT REFERENCES rag_chunks(id) ON DELETE SET NULL,
        url              TEXT,
        title            TEXT,
        section          TEXT,
        page_from        INT,
        page_to          INT,
        snippet          TEXT,
        similarity       NUMERIC(4,3),
        cited            BOOLEAN NOT NULL DEFAULT true,
        supported        TEXT NOT NULL DEFAULT 'unchecked',
        source_timestamp TIMESTAMPTZ,
        retrieved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ai_answer_citations_answer_idx ON ai_answer_citations(answer_id);

      CREATE TABLE IF NOT EXISTS ai_answer_feedback (
        id          SERIAL PRIMARY KEY,
        answer_id   INT NOT NULL REFERENCES ai_answers(id) ON DELETE CASCADE,
        user_id     INT REFERENCES ai_users(user_id) ON DELETE CASCADE,
        rating      TEXT NOT NULL CHECK (rating IN ('up','down')),
        reason      TEXT,
        comment     TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (answer_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS ai_answer_status_log (
        id          SERIAL PRIMARY KEY,
        answer_id   INT NOT NULL REFERENCES ai_answers(id) ON DELETE CASCADE,
        from_status TEXT,
        to_status   TEXT NOT NULL,
        actor_id    INT REFERENCES ai_users(user_id) ON DELETE SET NULL,
        actor_type  TEXT NOT NULL CHECK (actor_type IN ('system','user','reviewer')),
        note        TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ai_answer_status_log_answer_idx ON ai_answer_status_log(answer_id, id);
    `);
    await syncReviewers();
    console.log("✅ Answer tables ready");
  }

  // Users listed in REVIEWER_EMAILS get the reviewer role (on boot and on each reviewer check)
  async function syncReviewers() {
    const emails = reviewerEmails();
    if (emails.length) {
      await pool.query(`UPDATE ai_users SET role='reviewer' WHERE lower(email) = ANY($1::text[]) AND role <> 'reviewer'`, [emails]);
    }
  }

  async function roleOf(userId) {
    const { rows: [u] } = await pool.query(`SELECT email, role FROM ai_users WHERE user_id=$1`, [userId]);
    if (!u) return null;
    if (u.role !== "reviewer" && reviewerEmails().includes(String(u.email).toLowerCase())) {
      await pool.query(`UPDATE ai_users SET role='reviewer' WHERE user_id=$1`, [userId]);
      return "reviewer";
    }
    return u.role;
  }

  async function requireReviewer(req, res, next) {
    try {
      if ((await roleOf(req.user.user_id)) !== "reviewer") return fail(res, "Reviewer access required", 403);
      next();
    } catch (e) {
      fail(res, e.message, 500);
    }
  }

  // Saves the answer, its citations and the initial status entry. Returns the answer id.
  async function record({ historyId, questionHistoryId, userId, promptId, flag, question, questionEn, searchQuery,
    answerEn, language, verdict, citations, model, retrievalMs, totalMs }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: [answer] } = await client.query(
        `INSERT INTO ai_answers(history_id, question_history_id, user_id, prompt_id, flag, question, question_en, search_query,
           answer_en, language, status, confidence, confidence_detail, uncertain_reasons, model, retrieval_ms, total_ms)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
        [historyId, questionHistoryId, userId, promptId, flag, question, questionEn, searchQuery, answerEn, language,
          verdict.status, verdict.confidence, JSON.stringify(verdict.detail), verdict.reasons, model, retrievalMs, totalMs]
      );
      if (citations.length) {
        const col = (f) => citations.map(f);
        await client.query(
          `INSERT INTO ai_answer_citations(answer_id, marker, source_type, document_id, chunk_id, url, title, section, page_from, page_to,
             snippet, similarity, cited, supported, source_timestamp, retrieved_at)
           SELECT $1, u.* FROM unnest($2::text[], $3::text[], $4::int[], $5::int[], $6::text[], $7::text[], $8::text[], $9::int[], $10::int[],
             $11::text[], $12::numeric[], $13::bool[], $14::text[], $15::timestamptz[], $16::timestamptz[]) AS u`,
          [answer.id, col(c => c.marker), col(c => c.source_type), col(c => c.document_id || null), col(c => c.chunk_id || null),
            col(c => c.url || null), col(c => c.title || null), col(c => c.section || null), col(c => c.page_from ?? null), col(c => c.page_to ?? null),
            col(c => c.snippet || null), col(c => c.similarity ?? null), col(c => c.cited !== false), col(c => c.supported || "unchecked"),
            col(c => c.source_timestamp || null), col(c => c.retrieved_at || new Date())]
        );
      }
      await client.query(
        `INSERT INTO ai_answer_status_log(answer_id, from_status, to_status, actor_type, note) VALUES($1, NULL, $2, 'system', $3)`,
        [answer.id, verdict.status, verdict.reasons.length ? `Evidence gate: ${verdict.reasons.join(", ")}` : "Passed evidence gate"]
      );
      await client.query("COMMIT");
      return answer.id;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async function citationsFor(answerIds) {
    if (!answerIds.length) return new Map();
    const { rows } = await pool.query(
      `SELECT * FROM ai_answer_citations WHERE answer_id = ANY($1::int[]) ORDER BY answer_id, cited DESC, id`,
      [answerIds]
    );
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.answer_id)) map.set(r.answer_id, []);
      map.get(r.answer_id).push(presentCitation(r));
    }
    return map;
  }

  // Chat history rows with each bot answer's review status, confidence, citations and the user's own feedback
  async function historyWithAnswers(userId, promptId) {
    const { rows } = await pool.query(
      `SELECT h.id AS prompt_history_id, h.prompt_id, h.user_id, h.person, h.text, h.type, h.focus_type, h.link, h.active,
              h."createdAt", h.language, h.text_en,
              a.id AS answer_id, a.status, a.confidence, a.uncertain_reasons, f.rating AS my_rating
       FROM ai_prompt_history h
       LEFT JOIN ai_answers a ON a.history_id = h.id
       LEFT JOIN ai_answer_feedback f ON f.answer_id = a.id AND f.user_id = h.user_id
       WHERE h.user_id=$1 AND h.prompt_id=$2 AND h.active=true
       ORDER BY h.id ASC`,
      [userId, promptId]
    );
    const cites = await citationsFor(rows.filter(r => r.answer_id).map(r => r.answer_id));
    return rows.map(r => {
      if (!r.answer_id) return r;
      const citations = cites.get(r.answer_id) || [];
      return {
        ...r,
        confidence: r.confidence != null ? Number(r.confidence) : null,
        citations,
        // Legacy source list keeps working, now with refreshed file links
        link: JSON.stringify(citations.filter(c => c.cited)),
      };
    });
  }

  async function getAnswer(answerId) {
    const { rows: [answer] } = await pool.query(
      `SELECT a.*, u.email AS user_email, u.name AS user_name, r.email AS reviewer_email,
              qh.text AS question_original, bh.text AS answer_shown
       FROM ai_answers a
       LEFT JOIN ai_users u ON u.user_id = a.user_id
       LEFT JOIN ai_users r ON r.user_id = a.reviewed_by
       LEFT JOIN ai_prompt_history qh ON qh.id = a.question_history_id
       LEFT JOIN ai_prompt_history bh ON bh.id = a.history_id
       WHERE a.id=$1`,
      [answerId]
    );
    if (!answer) return null;
    const [cites, feedback, log] = await Promise.all([
      citationsFor([answer.id]),
      pool.query(`SELECT f.id, f.rating, f.reason, f.comment, f."createdAt", u.email FROM ai_answer_feedback f LEFT JOIN ai_users u ON u.user_id=f.user_id WHERE f.answer_id=$1 ORDER BY f.id`, [answer.id]),
      pool.query(`SELECT l.id, l.from_status, l.to_status, l.actor_type, l.note, l."createdAt", u.email AS actor_email FROM ai_answer_status_log l LEFT JOIN ai_users u ON u.user_id=l.actor_id WHERE l.answer_id=$1 ORDER BY l.id`, [answer.id]),
    ]);
    return {
      ...answer,
      confidence: answer.confidence != null ? Number(answer.confidence) : null,
      citations: cites.get(answer.id) || [],
      feedback: feedback.rows,
      status_log: log.rows,
    };
  }

  async function changeStatus(answerId, toStatus, { actorId, actorType, note }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: [cur] } = await client.query(`SELECT status FROM ai_answers WHERE id=$1 FOR UPDATE`, [answerId]);
      if (!cur) throw Object.assign(new Error("Answer not found"), { code: 404 });
      if (cur.status !== toStatus) {
        const reviewer = actorType === "reviewer";
        await client.query(
          `UPDATE ai_answers SET status=$2, "updatedAt"=NOW()
             ${reviewer ? `, reviewed_by=$3, reviewed_at=NOW(), review_note=$4` : ""}
           WHERE id=$1`,
          reviewer ? [answerId, toStatus, actorId, note || null] : [answerId, toStatus]
        );
        await client.query(
          `INSERT INTO ai_answer_status_log(answer_id, from_status, to_status, actor_id, actor_type, note) VALUES($1,$2,$3,$4,$5,$6)`,
          [answerId, cur.status, toStatus, actorId, actorType, note || null]
        );
      }
      await client.query("COMMIT");
      return { from: cur.status, to: toStatus };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  // ─── Routes ─────────────────────────────────────────────────────────────────
  const router = express.Router();

  router.get("/:id(\\d+)", auth, async (req, res) => {
    try {
      const answer = await getAnswer(Number(req.params.id));
      if (!answer) return fail(res, "Answer not found", 404);
      if (answer.user_id !== req.user.user_id && (await roleOf(req.user.user_id)) !== "reviewer") return fail(res, "Answer not found", 404);
      ok(res, answer);
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  // { rating: "up" | "down", reason?, comment? } — a thumbs-down sends the answer back for revision
  router.post("/:id(\\d+)/feedback", auth, async (req, res) => {
    try {
      const answerId = Number(req.params.id);
      const { rating, reason, comment } = req.body || {};
      if (!["up", "down"].includes(rating)) return fail(res, "rating must be 'up' or 'down'");
      if (reason && !FEEDBACK_REASONS.includes(reason)) return fail(res, `reason must be one of: ${FEEDBACK_REASONS.join(", ")}`);
      const { rows: [answer] } = await pool.query(`SELECT user_id, status FROM ai_answers WHERE id=$1`, [answerId]);
      if (!answer || answer.user_id !== req.user.user_id) return fail(res, "Answer not found", 404);

      await pool.query(
        `INSERT INTO ai_answer_feedback(answer_id, user_id, rating, reason, comment) VALUES($1,$2,$3,$4,$5)
         ON CONFLICT (answer_id, user_id) DO UPDATE SET rating=EXCLUDED.rating, reason=EXCLUDED.reason, comment=EXCLUDED.comment, "updatedAt"=NOW()`,
        [answerId, req.user.user_id, rating, reason || null, comment ? String(comment).slice(0, 2000) : null]
      );
      let status = answer.status;
      if (rating === "down" && !["REJECTED", "NEEDS_REVISION"].includes(answer.status)) {
        const note = `User marked unhelpful${reason ? ` (${reason})` : ""}${comment ? `: ${String(comment).slice(0, 300)}` : ""}`;
        status = (await changeStatus(answerId, "NEEDS_REVISION", { actorId: req.user.user_id, actorType: "user", note })).to;
      }
      ok(res, { answer_id: answerId, rating, status }, "Thanks for the feedback");
    } catch (e) {
      fail(res, e.message, e.code === 404 ? 404 : 500);
    }
  });

  const reviewRouter = express.Router();
  reviewRouter.use(auth, requireReviewer);

  reviewRouter.get("/stats", async (req, res) => {
    const [byStatus, feedback] = await Promise.all([
      pool.query(`SELECT status, COUNT(*)::int AS count, ROUND(AVG(confidence)::numeric, 3) AS avg_confidence FROM ai_answers GROUP BY status`),
      pool.query(`SELECT rating, COUNT(*)::int AS count FROM ai_answer_feedback GROUP BY rating`),
    ]);
    ok(res, {
      by_status: Object.fromEntries(STATUSES.map(s => [s, byStatus.rows.find(r => r.status === s)?.count || 0])),
      avg_confidence: Object.fromEntries(byStatus.rows.map(r => [r.status, r.avg_confidence != null ? Number(r.avg_confidence) : null])),
      feedback: Object.fromEntries(["up", "down"].map(r => [r, feedback.rows.find(f => f.rating === r)?.count || 0])),
    });
  });

  // ?status=UNCERTAIN,NEEDS_REVISION&flag=&q=&page=1&limit=20  (default: everything still awaiting a decision)
  reviewRouter.get("/queue", async (req, res) => {
    try {
      const statuses = String(req.query.status || "UNCERTAIN,NEEDS_REVISION,UNDER_REVIEW,CANDIDATE")
        .split(",").map(s => s.trim().toUpperCase()).filter(s => STATUSES.includes(s));
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const page = Math.max(Number(req.query.page) || 1, 1);
      const params = [statuses, limit, (page - 1) * limit];
      let extra = "";
      if (req.query.flag) { params.push(String(req.query.flag)); extra += ` AND a.flag = $${params.length}`; }
      if (req.query.q) { params.push(`%${req.query.q}%`); extra += ` AND (a.question ILIKE $${params.length} OR a.answer_en ILIKE $${params.length})`; }
      const { rows } = await pool.query(
        `SELECT a.id, a.flag, a.question, a.question_en, LEFT(a.answer_en, 400) AS answer_preview, a.language, a.status,
                a.confidence, a.uncertain_reasons, a.model, a."createdAt", a.reviewed_at, u.email AS user_email,
                (SELECT COUNT(*)::int FROM ai_answer_citations c WHERE c.answer_id=a.id AND c.cited) AS citation_count,
                (SELECT rating FROM ai_answer_feedback f WHERE f.answer_id=a.id ORDER BY f."updatedAt" DESC LIMIT 1) AS last_rating,
                COUNT(*) OVER()::int AS total
         FROM ai_answers a LEFT JOIN ai_users u ON u.user_id=a.user_id
         WHERE a.status = ANY($1::text[]) ${extra}
         ORDER BY CASE a.status WHEN 'NEEDS_REVISION' THEN 0 WHEN 'UNCERTAIN' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 ELSE 3 END, a."createdAt" DESC
         LIMIT $2 OFFSET $3`,
        params
      );
      ok(res, {
        items: rows.map(({ total, ...r }) => ({ ...r, confidence: r.confidence != null ? Number(r.confidence) : null })),
        total: rows[0]?.total || 0,
        page,
        limit,
      });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  reviewRouter.get("/:id(\\d+)", async (req, res) => {
    const answer = await getAnswer(Number(req.params.id));
    if (!answer) return fail(res, "Answer not found", 404);
    ok(res, answer);
  });

  // { status: UNDER_REVIEW | APPROVED | REJECTED | NEEDS_REVISION, note? }
  reviewRouter.post("/:id(\\d+)/status", async (req, res) => {
    try {
      const status = String(req.body?.status || "").toUpperCase();
      if (!REVIEW_STATUSES.includes(status)) return fail(res, `status must be one of: ${REVIEW_STATUSES.join(", ")}`);
      const change = await changeStatus(Number(req.params.id), status, { actorId: req.user.user_id, actorType: "reviewer", note: req.body?.note });
      ok(res, { answer_id: Number(req.params.id), ...change }, `Marked ${status}`);
    } catch (e) {
      fail(res, e.message, e.code === 404 ? 404 : 500);
    }
  });

  return { initDB, record, historyWithAnswers, citationsFor, getAnswer, changeStatus, roleOf, router, reviewRouter, presentCitation, STATUSES };
};
