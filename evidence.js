"use strict";

const { configured } = require("./ai");

// Evidence safeguard. Every answer is checked against its sources before the user sees it:
//   1. citations are parsed ([S#] = Frruit document store, [P1] = portfolio, links = web search)
//   2. a verifier model splits the answer into claims and judges each one against the cited evidence
//   3. a confidence score is computed in code; low-confidence answers are marked UNCERTAIN, never stated as fact
//   4. banner + footer are added in code, so the model cannot drop them

const VERIFY_MODEL = process.env.VERIFY_MODEL || process.env.RAG_AI_MODEL || "gpt-4.1-mini";
const THRESHOLD = Number(process.env.CONFIDENCE_THRESHOLD) || 0.6;
const MAX_UNSUPPORTED_SHARE = 0.2;

// Credit each claim verdict earns toward the support score
const CLAIM_CREDIT = { supported: 1, general: 0.8, web: 0.75, partial: 0.5, uncited: 0.2, unsupported: 0 };
const WEIGHTS = { support: 0.5, coverage: 0.25, retrieval: 0.25 };

const REASON_TEXT = {
  no_sources: "no source could be found for it",
  insufficient_evidence: "the sources found do not answer the question",
  unsupported_claims: "some statements are not backed by the cited sources",
  low_confidence: "the supporting evidence is weak",
  verification_unavailable: "the automatic source check could not run",
};

const VERIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answers_question", "claims"],
  properties: {
    answers_question: { type: "boolean" },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "citations", "verdict"],
        properties: {
          text: { type: "string" },
          citations: { type: "array", items: { type: "string" } },
          verdict: { type: "string", enum: Object.keys(CLAIM_CREDIT) },
        },
      },
    },
  },
};

const VERIFY_PROMPT = `You audit a financial assistant's answer against its evidence.
Evidence markers: [S#] = excerpts from Frruit's document store (text given below), [P1] = the user's portfolio data (given below), [W#] = web pages found by web search (only title and URL are known; the page text is not available to you). A Markdown link in the answer counts as a citation of the web source with that URL.
Split the answer into its atomic factual claims (at most 12; skip greetings, headings, caveats and the disclaimer). For each claim give:
- text: the claim, quoted or closely paraphrased from the answer
- citations: the markers attached to it, e.g. ["S1"] or ["W2"] (empty if none)
- verdict:
  supported   = the cited [S#]/[P1] evidence states it
  partial     = the cited evidence states only part of it, or a figure differs slightly
  unsupported = the cited evidence does not contain it or contradicts it, or it cites a marker that does not exist
  web         = it is cited only to web sources, so its text cannot be checked here
  uncited     = a specific fact, figure, date or event with no citation
  general     = widely known definitional or textbook knowledge (e.g. what a P/E ratio is) that needs no source
A statement that the sources do NOT contain something (e.g. "the document does not mention the CEO's salary") is not a factual claim: leave it out of claims.
answers_question = false if the answer mainly says the information is not in the sources, could not be found or verified, or does not address the question, even when that statement is accurate. Set it true only if the answer actually provides the requested information.`;

// ─── Citation parsing ─────────────────────────────────────────────────────────
// Normalises "[S1, S3]" / "[S1; S2]" into "[S1][S3]" so every marker is a separate token, and moves
// markers written after the full stop ("… 4.8 times. [S3]") inside the sentence they cite ("… 4.8 times [S3].")
function normaliseMarkers(text) {
  return String(text || "")
    .replace(/\[((?:[SP]\d+)(?:\s*[,;]\s*[SP]\d+)+)\]/g, (_, list) => list.split(/\s*[,;]\s*/).map(m => `[${m}]`).join(""))
    .replace(/([.!?])[ \t]*((?:\[[SP]\d+\])+)/g, " $2$1")
    .replace(/[ \t]+((?:\[[SP]\d+\])+)/g, " $1");
}

function citedMarkers(text) {
  return new Set([...String(text || "").matchAll(/\[([SP]\d+)\]/g)].map(m => m[1]));
}

function markdownLinks(text) {
  return [...String(text || "").matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)].map(m => m[2]);
}

// Drops markers that point at nothing (the model invented them); returns the cleaned text and what was dropped
function stripUnknownMarkers(text, known) {
  const dropped = [];
  const cleaned = text.replace(/\[([SP]\d+)\]/g, (m, id) => {
    if (known.has(id)) return m;
    dropped.push(id);
    return "";
  });
  return { text: cleaned, dropped };
}

function sentences(text) {
  return String(text || "")
    .split(/\n+/)
    .flatMap(line => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\[*])/))
    .map(s => s.replace(/^[\s>*#\-\d.)]+/, "").trim())
    .filter(s => s.length >= 40 && !/:$/.test(s));
}

// Fallback coverage when the verifier is unavailable: share of long sentences carrying any citation
// Deterministic backstop: does the answer open by saying the information isn't available?
// ("The document does not appear to provide…", "I could not find…", "No information is available…")
const REFUSAL = /\b(?:(?:does|do|did)\s*(?:not|n't)\s+(?:appear\s+to\s+|seem\s+to\s+)?(?:provide|mention|contain|cover|include|specify|disclose|state|say|give|list|report|discuss|address|have)|(?:could|can)\s*(?:not|n't)\s+(?:find|locate|verify|confirm|determine)|unable\s+to\s+(?:find|locate|verify|confirm|determine)|no\s+(?:information|details|data|mention)\b|(?:is|are|was|were)\s+not\s+(?:available|mentioned|disclosed|provided|specified|covered|stated)|not\s+(?:covered|mentioned|disclosed|specified)\s+in)/i;
function opensWithRefusal(text) {
  const body = String(text || "").replace(/\[[SPW]\d+\]/g, "").replace(/^\s*>.*$/gm, "").trim();
  const first = body.split(/(?<=[.!?])\s+|\n+/).find(s => s.trim()) || "";
  // Only the opening clause: "X was 4.8 times; the report does not mention a target" is a real answer
  const opening = first.split(/[;:]|,\s+(?:but|while|although|however|whereas)\b/i)[0];
  return REFUSAL.test(opening);
}

function heuristicCoverage(text) {
  const list = sentences(text);
  if (!list.length) return 0;
  const cited = list.filter(s => /\[[SP]\d+\]/.test(s) || /\]\(https?:\/\//.test(s)).length;
  return cited / list.length;
}

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const round3 = (n) => Math.round(n * 1000) / 1000;

module.exports = function createEvidence({ openai }) {
  async function verify({ question, answer, evidence, webSources }) {
    const evidenceText = [
      ...evidence.map(e => `[${e.marker}] ${e.label}\n${String(e.text || "").slice(0, 1800)}`),
      ...webSources.map(w => `[${w.marker}] ${w.title || "Web page"} — ${w.url}`),
    ].join("\n\n") || "(no evidence)";
    const completion = await openai.chat.completions.create({
      model: VERIFY_MODEL,
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: "answer_audit", strict: true, schema: VERIFY_SCHEMA } },
      messages: [
        { role: "system", content: VERIFY_PROMPT },
        { role: "user", content: `QUESTION:\n${question}\n\nEVIDENCE:\n${evidenceText}\n\nANSWER:\n${answer}` },
      ],
    });
    return JSON.parse(completion.choices[0].message.content);
  }

  // evidence: [{ marker, label, text, similarity? }] for [S#]/[P1]; webSources: [{ marker, url, title }]
  // → { status, confidence, reasons, detail, claims, supportByMarker }
  async function assess({ question, answer, evidence, webSources, citedInternal, retrievalSimilarity }) {
    const linkCount = markdownLinks(answer).length;
    const hasCitations = citedInternal.size > 0 || webSources.length > 0 || linkCount > 0;
    const reasons = [];

    let audit = null;
    try {
      if (!configured()) throw new Error("no AI key configured");
      audit = await verify({ question, answer, evidence, webSources });
    } catch (e) {
      console.error("Answer verification failed:", e.message);
    }

    const claims = audit?.claims || [];
    const checkable = claims.filter(c => c.verdict !== "general");
    let support, coverage;
    if (audit) {
      support = claims.length ? claims.reduce((n, c) => n + (CLAIM_CREDIT[c.verdict] ?? 0), 0) / claims.length : 0;
      coverage = checkable.length ? checkable.filter(c => c.citations.length && c.verdict !== "uncited").length / checkable.length : (claims.length ? 1 : 0);
    } else {
      coverage = heuristicCoverage(answer);
      support = coverage * 0.6;
    }

    // Retrieval strength: best similarity among cited store excerpts, or how many web sources back the answer
    const internal = citedInternal.has("P1") ? 1 : clamp01((retrievalSimilarity - 0.3) / 0.3);
    const webCount = Math.max(webSources.length, linkCount);
    const web = webCount >= 3 ? 0.85 : webCount === 2 ? 0.75 : webCount === 1 ? 0.6 : 0;
    const retrieval = Math.max(citedInternal.size ? internal : 0, web);

    const confidence = round3(WEIGHTS.support * support + WEIGHTS.coverage * coverage + WEIGHTS.retrieval * retrieval);
    const unsupported = checkable.filter(c => c.verdict === "unsupported" || c.verdict === "uncited");

    if (!hasCitations) reasons.push("no_sources");
    if ((audit && audit.answers_question === false) || opensWithRefusal(answer)) reasons.push("insufficient_evidence");
    if (checkable.length && unsupported.length / checkable.length > MAX_UNSUPPORTED_SHARE) reasons.push("unsupported_claims");
    if (!audit) reasons.push("verification_unavailable");
    if (confidence < THRESHOLD) reasons.push("low_confidence");

    // Per-marker verdicts, stored on each citation
    const supportByMarker = {};
    const rank = { supported: 3, partial: 2, web: 1, unsupported: 0 };
    for (const c of claims) {
      for (const m of c.citations) {
        const v = ["supported", "partial", "unsupported", "web"].includes(c.verdict) ? c.verdict : null;
        if (v && (supportByMarker[m] == null || rank[v] > rank[supportByMarker[m]])) supportByMarker[m] = v;
      }
    }

    return {
      status: reasons.length ? "UNCERTAIN" : "CANDIDATE",
      confidence,
      reasons,
      claims,
      supportByMarker,
      unverified: unsupported.map(c => c.text).slice(0, 5),
      detail: {
        support: round3(support),
        coverage: round3(coverage),
        retrieval: round3(retrieval),
        weights: WEIGHTS,
        threshold: THRESHOLD,
        verifier: audit ? VERIFY_MODEL : null,
        claims: claims.length,
        verdicts: claims.reduce((acc, c) => ({ ...acc, [c.verdict]: (acc[c.verdict] || 0) + 1 }), {}),
      },
    };
  }

  // Adds the UNCERTAIN banner / unverified list and the review footer (English; translated afterwards)
  function decorate(answer, verdict, { flag, checkedAt = new Date() } = {}) {
    let out = String(answer || "").trim();
    if (verdict.status === "UNCERTAIN") {
      const why = verdict.reasons.filter(r => r !== "low_confidence" || verdict.reasons.length === 1)
        .map(r => REASON_TEXT[r]).filter(Boolean);
      const banner = `> ⚠️ **UNCERTAIN** — Frruit could not verify this answer against its sources (confidence ${Math.round(verdict.confidence * 100)}%)${why.length ? `: ${why.join("; ")}` : ""}. Treat it as unconfirmed, not as fact.`;
      out = `${banner}\n\n${out}`;
      if (verdict.unverified.length) {
        out += `\n\n**Not verified against a source:**\n${verdict.unverified.map(t => `- ${t.replace(/\s+/g, " ").trim()}`).join("\n")}`;
      }
    }
    const when = checkedAt.toISOString().slice(0, 16).replace("T", " ");
    const scope = flag === "portfolio" ? "Informational analysis of your holdings" : "Candidate answer for human review";
    out += `\n\n---\n_${scope}, not investment advice. Sources checked ${when} UTC._`;
    return out;
  }

  return { assess, decorate, THRESHOLD, VERIFY_MODEL };
};

module.exports.normaliseMarkers = normaliseMarkers;
module.exports.citedMarkers = citedMarkers;
module.exports.markdownLinks = markdownLinks;
module.exports.stripUnknownMarkers = stripUnknownMarkers;
module.exports.opensWithRefusal = opensWithRefusal;
