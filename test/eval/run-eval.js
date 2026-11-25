"use strict";

// Evaluation of retrieval, citations and the evidence safeguard, through the real HTTP API.
//   1. start the backend (npm run dev), 2. npm run eval  [-- --api http://localhost:4000]
// Creates/uses the user eval@frruit.local, uploads the fixture document, asks every question in
// questions.json and writes a Markdown + JSON report to test/eval/results/.
//
// Metrics
//   retrieval hit@k     share of document questions whose answer page is among the retrieved excerpts
//   citation accuracy   share of document questions whose *cited* excerpts include the answer page
//   answer accuracy     share of document questions whose answer contains the expected figure
//   gate pass rate      share of answerable document questions marked CANDIDATE (not UNCERTAIN)
//   UNCERTAIN rate      share of unanswerable questions correctly marked UNCERTAIN (target ≥ 90%)
//   chat citation rate  share of chat answers with at least one cited source (store or web)

require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const API = (arg("api", process.env.EVAL_API_URL || `http://localhost:${process.env.PORT || 4000}`)).replace(/\/$/, "");
const EMAIL = "eval@frruit.local";
const SET = JSON.parse(fs.readFileSync(path.join(__dirname, "questions.json"), "utf8"));
const ROOT = path.join(__dirname, "..", "..");

const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "–");
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

(async () => {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URI });
  const { rows: [user] } = await pool.query(
    `INSERT INTO ai_users(name, email) VALUES('Eval', $1) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING user_id`, [EMAIL]);
  await pool.query(`INSERT INTO ai_user_plans(user_id) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM ai_user_plans WHERE user_id=$1)`, [user.user_id]);
  await pool.end();
  const token = jwt.sign({ user_id: user.user_id, email: EMAIL }, process.env.JWT_SECRET || "frruit_secret", { expiresIn: "2h" });

  const call = async (method, url, body, headers = {}) => {
    const started = Date.now();
    const res = await fetch(API + url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body && !Buffer.isBuffer(body) ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? (Buffer.isBuffer(body) ? body : JSON.stringify(body)) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === false) throw new Error(`${method} ${url} → ${res.status} ${json.message || ""}`);
    return { ...json, ms: Date.now() - started };
  };

  // Upload the fixture and wait for processing
  const file = fs.readFileSync(path.join(ROOT, SET.document));
  const up = await call("POST", "/api/documents", file, { "Content-Type": "application/pdf", "X-File-Name": path.basename(SET.document) });
  let doc = up.data;
  for (let i = 0; i < 120 && ["pending", "processing"].includes(doc.status); i++) {
    await new Promise(r => setTimeout(r, 1000));
    doc = (await call("GET", `/api/documents/${doc.id}`)).data;
  }
  if (doc.status !== "ready") throw new Error(`Fixture document not ready: ${doc.status} ${doc.error || ""}`);
  const { data: { prompt_id: docPrompt } } = await call("POST", `/api/documents/${doc.id}/chat`);
  console.log(`Document #${doc.id} ready (${doc.chunk_count} chunks). Asking ${SET.document_questions.length + SET.unanswerable_document_questions.length + SET.chat_questions.length} questions against ${API}…`);

  const docRows = [];
  for (const item of SET.document_questions) {
    const r = await call("POST", "/api/contentPrompt/triggerDocumentChat", { prompt_id: docPrompt, message: item.q });
    const cites = r.meta.citations || [];
    const onPage = (c) => c.page_from != null && c.page_from <= item.page && (c.page_to ?? c.page_from) >= item.page;
    docRows.push({
      q: item.q, page: item.page, status: r.meta.status, confidence: r.meta.confidence, ms: r.ms,
      retrieved: cites.some(onPage), cited: cites.some(c => c.cited && onPage(c)), correct: r.data.includes(item.expect),
    });
    process.stdout.write(".");
  }
  const unRows = [];
  for (const q of SET.unanswerable_document_questions) {
    const r = await call("POST", "/api/contentPrompt/triggerDocumentChat", { prompt_id: docPrompt, message: q });
    unRows.push({ q, status: r.meta.status, confidence: r.meta.confidence, reasons: r.meta.uncertain_reasons, ms: r.ms });
    process.stdout.write(".");
  }
  const chatRows = [];
  const { data: { prompt_id: chatPrompt } } = await call("POST", "/api/prompts/addPrompts", { prompt_text: `Eval run ${new Date().toISOString()}` });
  for (const q of SET.chat_questions) {
    const r = await call("POST", "/api/prompts/triggerChat", { prompt_id: chatPrompt, message: q, flag: "news" });
    const cited = (r.data.citations || []).filter(c => c.cited);
    chatRows.push({ q, status: r.data.status, confidence: r.data.confidence, store: cited.filter(c => c.source_type !== "web").length, web: cited.filter(c => c.source_type === "web").length, ms: r.ms });
    process.stdout.write(".");
  }
  console.log("");

  const answerable = docRows.length;
  const summary = {
    api: API,
    at: new Date().toISOString(),
    retrieval_hit_at_k: pct(docRows.filter(r => r.retrieved).length, answerable),
    citation_accuracy: pct(docRows.filter(r => r.cited).length, answerable),
    answer_accuracy: pct(docRows.filter(r => r.correct).length, answerable),
    gate_pass_rate: pct(docRows.filter(r => r.status === "CANDIDATE").length, answerable),
    uncertain_rate_unanswerable: pct(unRows.filter(r => r.status === "UNCERTAIN").length, unRows.length),
    chat_citation_rate: pct(chatRows.filter(r => r.store + r.web > 0).length, chatRows.length),
    avg_confidence_answerable: avg(docRows.map(r => r.confidence || 0)).toFixed(2),
    avg_confidence_unanswerable: avg(unRows.map(r => r.confidence || 0)).toFixed(2),
    avg_latency_ms: Math.round(avg([...docRows, ...unRows, ...chatRows].map(r => r.ms))),
  };

  const table = (rows, cols) => [
    `| ${cols.join(" | ")} |`, `| ${cols.map(() => "---").join(" | ")} |`,
    ...rows.map(r => `| ${cols.map(c => String(r[c] ?? "").replace(/\|/g, "/")).join(" | ")} |`),
  ].join("\n");
  const md = `# Frruit evaluation — ${summary.at}\n\nAPI: ${API}\n\n${table(Object.entries(summary).filter(([k]) => !["api", "at"].includes(k)).map(([metric, value]) => ({ metric, value })), ["metric", "value"])}\n\n` +
    `## Document questions (answer page known)\n\n${table(docRows, ["q", "page", "retrieved", "cited", "correct", "status", "confidence", "ms"])}\n\n` +
    `## Unanswerable document questions (should be UNCERTAIN)\n\n${table(unRows, ["q", "status", "confidence", "reasons", "ms"])}\n\n` +
    `## Chat questions (store + web)\n\n${table(chatRows, ["q", "status", "confidence", "store", "web", "ms"])}\n`;

  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = summary.at.replace(/[:.]/g, "-");
  fs.writeFileSync(path.join(outDir, `eval-${stamp}.md`), md);
  fs.writeFileSync(path.join(outDir, `eval-${stamp}.json`), JSON.stringify({ summary, docRows, unRows, chatRows }, null, 2));
  console.table(summary);
  console.log(`Report: test/eval/results/eval-${stamp}.md`);
})().catch(e => { console.error("Eval failed:", e.message); process.exit(1); });
