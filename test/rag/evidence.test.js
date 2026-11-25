"use strict";
const test = require("node:test");
const assert = require("node:assert");
const createEvidence = require("../../evidence");
const { normaliseMarkers, citedMarkers, stripUnknownMarkers } = createEvidence;

test("normalises grouped markers and drops invented ones", () => {
  const text = normaliseMarkers("Revenue rose 14% [S1, S3]. Debt fell [S9].");
  assert.strictEqual(text, "Revenue rose 14% [S1][S3]. Debt fell [S9].");
  const { text: cleaned, dropped } = stripUnknownMarkers(text, new Set(["S1", "S3"]));
  assert.deepStrictEqual(dropped, ["S9"]);
  assert.deepStrictEqual([...citedMarkers(cleaned)], ["S1", "S3"]);
});

test("answers without any source are UNCERTAIN even when the verifier cannot run", async () => {
  const saved = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const evidence = createEvidence({ openai: null });
  const verdict = await evidence.assess({
    question: "What was revenue?", answer: "Revenue was Rs 4,820 crore in FY2025, up 14 percent.",
    evidence: [], webSources: [], citedInternal: new Set(), retrievalSimilarity: 0,
  });
  if (saved) process.env.OPENAI_API_KEY = saved;
  assert.strictEqual(verdict.status, "UNCERTAIN");
  assert.ok(verdict.reasons.includes("no_sources"));
  assert.ok(verdict.reasons.includes("verification_unavailable"));
  const shown = evidence.decorate("Revenue was Rs 4,820 crore.", verdict, {});
  assert.match(shown, /^> ⚠️ \*\*UNCERTAIN\*\*/);
  assert.match(shown, /Candidate answer for human review, not investment advice/);
});

test("a well-supported answer passes the gate", async () => {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test";
  const fakeOpenai = { chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({
    answers_question: true,
    claims: [{ text: "Revenue was Rs 4,820 crore", citations: ["S1"], verdict: "supported" },
             { text: "Net profit rose to Rs 912 crore", citations: ["S1"], verdict: "supported" }],
  }) } }] }) } } };
  const evidence = createEvidence({ openai: fakeOpenai });
  const verdict = await evidence.assess({
    question: "What was revenue?", answer: "Revenue was Rs 4,820 crore [S1]. Net profit rose to Rs 912 crore [S1].",
    evidence: [{ marker: "S1", label: "Acme AR", text: "Total revenue was Rs 4,820 crore. Net profit rose to Rs 912 crore." }],
    webSources: [], citedInternal: new Set(["S1"]), retrievalSimilarity: 0.62,
  });
  assert.strictEqual(verdict.status, "CANDIDATE");
  assert.ok(verdict.confidence >= 0.9, `confidence ${verdict.confidence}`);
  assert.strictEqual(verdict.supportByMarker.S1, "supported");
});

test("unsupported claims make the answer UNCERTAIN and are listed", async () => {
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test";
  const fakeOpenai = { chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({
    answers_question: true,
    claims: [{ text: "Revenue doubled to Rs 9,000 crore", citations: ["S1"], verdict: "unsupported" },
             { text: "Net profit rose to Rs 912 crore", citations: ["S1"], verdict: "supported" }],
  }) } }] }) } } };
  const evidence = createEvidence({ openai: fakeOpenai });
  const verdict = await evidence.assess({
    question: "q", answer: "Revenue doubled to Rs 9,000 crore [S1]. Net profit rose to Rs 912 crore [S1].",
    evidence: [{ marker: "S1", label: "x", text: "Net profit rose to Rs 912 crore." }],
    webSources: [], citedInternal: new Set(["S1"]), retrievalSimilarity: 0.6,
  });
  assert.strictEqual(verdict.status, "UNCERTAIN");
  assert.ok(verdict.reasons.includes("unsupported_claims"));
  assert.match(evidence.decorate("x", verdict, {}), /Not verified against a source:\*\*\n- Revenue doubled/);
});

test("markers after the full stop move inside the sentence", () => {
  assert.strictEqual(normaliseMarkers("Debt to equity was 4.8 times. [S3] Profit rose.[S1][S2]"), "Debt to equity was 4.8 times [S3]. Profit rose [S1][S2].");
  assert.strictEqual(normaliseMarkers("Revenue grew [S1]."), "Revenue grew [S1].");
});

test("answers that open with a refusal are detected", () => {
  const { opensWithRefusal } = createEvidence;
  for (const t of [
    "The document does not appear to provide information on the tax rate paid by the company [S1].",
    "The document doesn't mention the statutory auditors [S1].",
    "I could not find the CEO's salary in the sources.",
    "No information is available about advertising spend.",
    "The number of employees is not disclosed in the report [S1].",
    "> ⚠️ **UNCERTAIN** — banner\n\nThe document does not specify which states have the most branches; it only states 14 states [S1].",
  ]) assert.ok(opensWithRefusal(t), t);
  for (const t of [
    "Total revenue for FY2025 was Rs 4,820 crore [S1].",
    "The company did not pay an interim dividend in FY2025 [S1].",
    "Debt to equity stood at 4.8 times; the report does not mention a target [S1].",
  ]) assert.ok(!opensWithRefusal(t), t);
});
