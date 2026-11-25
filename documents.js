"use strict";

// Document upload + library API, and the legacy "content prompt" endpoints the
// Market Content GPT screen uses for chatting with an attached document.

const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const { detectKind, SUPPORTED } = require("./extract");

const UPLOAD_DIR    = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "storage", "documents"));
const MAX_MB        = Number(process.env.UPLOAD_MAX_MB) || 20;
const TOKEN_TTL_MS  = 15 * 60 * 1000;
const FILE_LINK_TTL = "24h";
const secret = () => process.env.JWT_SECRET || "frruit_secret";

// Signed, expiring link to a stored document (citations open it in a new tab, where no auth header is sent)
function fileUrl(documentId, page) {
  const token = jwt.sign({ d: Number(documentId) }, secret(), { expiresIn: FILE_LINK_TTL });
  const base = (process.env.PUBLIC_API_URL || "").replace(/\/$/, "");
  return `${base}/api/documents/${documentId}/file?access=${token}${page ? `#page=${page}` : ""}`;
}

// "Infosys_AR_2025_1732512345678.pdf" → "Infosys AR 2025"
function titleFromFilename(name) {
  return path.basename(String(name || "Document"), path.extname(String(name || "")))
    .replace(/_\d{12,}$/, "")
    .replace(/[_]+/g, " ")
    .trim()
    .slice(0, 200) || "Document";
}

function safeName(name) {
  return path.basename(String(name || "document")).replace(/[^\w.\- ]+/g, "_").slice(0, 180) || "document";
}

function publicBase(req) {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0];
  return `${proto}://${req.get("host")}`;
}

function groupByDate(rows) {
  return rows.reduce((acc, item) => {
    const date = new Date(item.createdAt).toISOString().split("T")[0];
    const group = acc.find(g => g.date === date);
    if (group) group.data.push(item);
    else acc.push({ date, data: [item] });
    return acc;
  }, []);
}

const DOC_COLUMNS = `id, user_id, source_type, title, filename, mime, kind, size_bytes, status, error,
  page_count, chunk_count, uploaded_at, processed_at, published_at, storage_path`;

function createDocuments({ pool, rag, answers, auth, ok, fail }) {
  const uploadTokens = new Map(); // token → { userId, fileName, fileType, expiresAt }
  const uploadedFiles = new Map(); // `${userId}:${fileName}` → { storagePath, size, sha256, mime, expiresAt }

  async function initStorage() {
    await fsp.mkdir(UPLOAD_DIR, { recursive: true });
  }

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of uploadTokens) if (v.expiresAt < now) uploadTokens.delete(k);
    for (const [k, v] of uploadedFiles) if (v.expiresAt < now) uploadedFiles.delete(k);
  }, 5 * 60 * 1000).unref();

  async function saveFile(userId, fileName, buffer) {
    if (!buffer?.length) throw new Error("The uploaded file is empty.");
    const kind = detectKind(buffer, fileName);
    if (!kind) throw new Error("Unsupported file type. Upload a PDF, DOCX, DOC or TXT file.");
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const dir = path.join(UPLOAD_DIR, String(userId));
    await fsp.mkdir(dir, { recursive: true });
    const storagePath = path.join(dir, `${crypto.randomUUID()}.${kind}`);
    await fsp.writeFile(storagePath, buffer);
    return { storagePath, size: buffer.length, sha256, kind, mime: SUPPORTED[kind] };
  }

  // Creates the document row (or reuses an identical upload of the same user) and queues processing
  async function createDocument(userId, fileName, file) {
    const existing = await pool.query(
      `SELECT ${DOC_COLUMNS} FROM rag_documents WHERE user_id=$1 AND sha256=$2 AND source_type='upload' AND status <> 'failed' LIMIT 1`,
      [userId, file.sha256]
    );
    if (existing.rowCount) {
      await fsp.unlink(file.storagePath).catch(() => {});
      return { document: existing.rows[0], duplicate: true };
    }
    const { rows: [document] } = await pool.query(
      `INSERT INTO rag_documents(user_id, source_type, title, filename, mime, kind, storage_path, size_bytes, sha256, status)
       VALUES($1,'upload',$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING ${DOC_COLUMNS}`,
      [userId, titleFromFilename(fileName), safeName(fileName), file.mime, file.kind, file.storagePath, file.size, file.sha256]
    );
    return { document, duplicate: false };
  }

  async function getDocument(userId, id) {
    const { rows: [doc] } = await pool.query(
      `SELECT ${DOC_COLUMNS} FROM rag_documents WHERE id=$1 AND (user_id=$2 OR (user_id IS NULL AND source_type='seed'))`,
      [id, userId]
    );
    return doc || null;
  }

  async function createDocumentChat(userId, document) {
    const { rows: [prompt] } = await pool.query(
      `INSERT INTO ai_prompts(user_id, prompt_text, kind, document_ids) VALUES($1,$2,'document',$3) RETURNING prompt_id`,
      [userId, document.title.slice(0, 320), [document.id]]
    );
    return prompt.prompt_id;
  }

  const publicDoc = ({ storage_path, ...doc }) => ({ ...doc, file_url: storage_path ? fileUrl(doc.id) : null });

  const router = express.Router();
  const rawBody = express.raw({ type: () => true, limit: `${MAX_MB}mb` });

  // ── Direct upload (Documents page): raw body, file name in X-File-Name ───────
  router.post("/", auth, rawBody, async (req, res) => {
    try {
      const fileName = decodeURIComponent(req.get("x-file-name") || "document");
      const file = await saveFile(req.user.user_id, fileName, req.body);
      const { document, duplicate } = await createDocument(req.user.user_id, fileName, file);
      if (!duplicate) rag.enqueue(document.id);
      ok(res, { ...publicDoc(document), duplicate }, duplicate ? "This file is already in your library" : "Upload received, processing started");
    } catch (e) {
      fail(res, e.message, e.type === "entity.too.large" ? 413 : 400);
    }
  });

  // Presigned-style upload used by the existing Market Content GPT flow (no auth header; the token is the credential)
  router.put("/upload/:token", rawBody, async (req, res) => {
    const entry = uploadTokens.get(req.params.token);
    if (!entry || entry.expiresAt < Date.now()) return fail(res, "Upload link expired", 403);
    uploadTokens.delete(req.params.token);
    try {
      const file = await saveFile(entry.userId, entry.fileName, req.body);
      uploadedFiles.set(`${entry.userId}:${entry.fileName}`, { ...file, expiresAt: Date.now() + TOKEN_TTL_MS });
      res.status(200).json({ status: true, message: "Uploaded" });
    } catch (e) {
      fail(res, e.message);
    }
  });

  router.get("/", auth, async (req, res) => {
    try {
      const [mine, shared] = await Promise.all([
        pool.query(`SELECT ${DOC_COLUMNS} FROM rag_documents WHERE user_id=$1 AND source_type='upload' ORDER BY id DESC`, [req.user.user_id]),
        pool.query(`SELECT source_type, COUNT(*)::int AS count FROM rag_documents WHERE user_id IS NULL AND status='ready' GROUP BY source_type`),
      ]);
      const seed = await pool.query(`SELECT ${DOC_COLUMNS} FROM rag_documents WHERE user_id IS NULL AND source_type='seed' ORDER BY title`);
      ok(res, {
        documents: mine.rows.map(publicDoc),
        seed_documents: seed.rows.map(publicDoc),
        shared: Object.fromEntries(shared.rows.map(r => [r.source_type, r.count])),
        max_mb: MAX_MB,
      });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  router.get("/:id(\\d+)", auth, async (req, res) => {
    const doc = await getDocument(req.user.user_id, req.params.id);
    if (!doc) return fail(res, "Document not found", 404);
    ok(res, publicDoc(doc));
  });

  router.get("/:id(\\d+)/file", async (req, res) => {
    const id = Number(req.params.id);
    let allowed = false;
    try {
      if (req.query.access) {
        allowed = jwt.verify(String(req.query.access), secret()).d === id;
      } else if (req.headers.authorization) {
        const user = jwt.verify(req.headers.authorization.split(" ")[1], secret());
        allowed = Boolean(await getDocument(user.user_id, id));
      }
    } catch { allowed = false; }
    if (!allowed) return fail(res, "This link has expired. Reopen it from the answer.", 403);

    const { rows: [doc] } = await pool.query(`SELECT filename, mime, storage_path FROM rag_documents WHERE id=$1`, [id]);
    if (!doc?.storage_path || !fs.existsSync(doc.storage_path)) return fail(res, "File not found", 404);
    res.setHeader("Content-Type", doc.mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${safeName(doc.filename)}"`);
    res.setHeader("Cache-Control", "private, max-age=300");
    fs.createReadStream(doc.storage_path).pipe(res);
  });

  router.post("/:id(\\d+)/reprocess", auth, async (req, res) => {
    const doc = await getDocument(req.user.user_id, req.params.id);
    if (!doc || doc.user_id !== req.user.user_id) return fail(res, "Document not found", 404);
    if (doc.status === "processing") return fail(res, "Already processing");
    await pool.query(`UPDATE rag_documents SET status='pending', error=NULL WHERE id=$1`, [doc.id]);
    rag.enqueue(doc.id);
    ok(res, { ...publicDoc(doc), status: "pending", error: null }, "Processing restarted");
  });

  // Opens a document chat session; ask questions with flag "docs" and the returned prompt_id
  router.post("/:id(\\d+)/chat", auth, async (req, res) => {
    const doc = await getDocument(req.user.user_id, req.params.id);
    if (!doc) return fail(res, "Document not found", 404);
    ok(res, { prompt_id: await createDocumentChat(req.user.user_id, doc), document: publicDoc(doc) });
  });

  router.delete("/:id(\\d+)", auth, async (req, res) => {
    const doc = await getDocument(req.user.user_id, req.params.id);
    if (!doc || doc.user_id !== req.user.user_id) return fail(res, "Document not found", 404);
    await pool.query(`DELETE FROM rag_documents WHERE id=$1`, [doc.id]);
    if (doc.storage_path) await fsp.unlink(doc.storage_path).catch(() => {});
    ok(res, null, "Document deleted");
  });

  // ── Legacy content-prompt endpoints (Market Content GPT → attachment) ────────
  const contentRouter = express.Router();

  contentRouter.get("/getSignedUrl", auth, (req, res) => {
    const fileName = String(req.query.fileName || "").trim();
    if (!fileName) return fail(res, "fileName required");
    const token = crypto.randomBytes(24).toString("hex");
    uploadTokens.set(token, { userId: req.user.user_id, fileName, fileType: req.query.fileType, expiresAt: Date.now() + TOKEN_TTL_MS });
    ok(res, `${publicBase(req)}/api/documents/upload/${token}`);
  });

  // Waits for processing so the screen can ask its first question right away
  contentRouter.post("/addDocument", auth, async (req, res) => {
    try {
      const fileName = String(req.body.object_key || "");
      const file = uploadedFiles.get(`${req.user.user_id}:${fileName}`);
      if (!file) return fail(res, "Upload not found. Please attach the file again.", 404);
      uploadedFiles.delete(`${req.user.user_id}:${fileName}`);

      const { document, duplicate } = await createDocument(req.user.user_id, fileName, file);
      const result = duplicate && document.status === "ready" ? { status: "ready" } : await rag.enqueue(document.id);
      const promptId = await createDocumentChat(req.user.user_id, document);
      if (result.status !== "ready") {
        return res.status(422).json({ status: false, message: `Could not process the document: ${result.error}`, data: { prompt_id: promptId, document_id: document.id } });
      }
      ok(res, { prompt_id: promptId, document_id: document.id, status: "ready", title: document.title });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  async function listDocumentChats(userId, search) {
    const { rows } = await pool.query(
      `SELECT p.prompt_id AS content_prompt_id, p.prompt_text AS link_title, p."createdAt",
              d.id AS document_id, d.filename AS "contentS3Path", d.status
       FROM ai_prompts p LEFT JOIN rag_documents d ON d.id = p.document_ids[1]
       WHERE p.user_id=$1 AND p.active=true AND p.kind='document' AND ($2::text IS NULL OR p.prompt_text ILIKE $2)
       ORDER BY p."createdAt" DESC`,
      [userId, search ? `%${search}%` : null]
    );
    return groupByDate(rows.map(r => ({ ...r, contentS3Path: r.link_title })));
  }

  contentRouter.get("/getContentPromptHistory", auth, async (req, res) => {
    if (req.query.type && req.query.type !== "attachment") return ok(res, []);
    ok(res, await listDocumentChats(req.user.user_id));
  });

  contentRouter.get("/searchContentPrompts", auth, async (req, res) => {
    if (req.query.type && req.query.type !== "attachment") return ok(res, []);
    ok(res, await listDocumentChats(req.user.user_id, req.query.prompt || ""));
  });

  contentRouter.get("/getContentPromptHistoryByContentPromptId", auth, async (req, res) => {
    const promptId = Number(req.query.content_prompt_id);
    if (!promptId) return fail(res, "content_prompt_id required");
    const rows = await answers.historyWithAnswers(req.user.user_id, promptId);
    ok(res, rows.map(r => ({ ...r, type: r.person === "bot" ? "attachment" : "text" })));
  });

  contentRouter.delete("/deleteContentPrompt", auth, async (req, res) => {
    await pool.query(`UPDATE ai_prompts SET active=false WHERE prompt_id=$1 AND user_id=$2`, [req.query.promptId, req.user.user_id]);
    await pool.query(`UPDATE ai_prompt_history SET active=false WHERE prompt_id=$1 AND user_id=$2`, [req.query.promptId, req.user.user_id]);
    ok(res, null, "Deleted");
  });

  return { initStorage, router, contentRouter, createDocument, saveFile, UPLOAD_DIR };
}

module.exports = createDocuments;
module.exports.fileUrl = fileUrl;
module.exports.titleFromFilename = titleFromFilename;
