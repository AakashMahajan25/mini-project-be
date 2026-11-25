"use strict";

// One chat turn, end to end:
//   detect language → translate question to English → rewrite follow-ups as a standalone query
//   → retrieve from the pgvector store → answer in English (web search + retrieved evidence, or the
//   document only for document chats) → verify against the sources → caller translates back → save
//   the answer, its citations and its review status.

const { normaliseMarkers, citedMarkers, stripUnknownMarkers } = require("./evidence");

const CHAT_MODEL    = process.env.CHAT_MODEL || "gpt-5-search-api";
const DOCS_MODEL    = process.env.DOCS_CHAT_MODEL || "gpt-4.1-mini";
const REWRITE_MODEL = process.env.RAG_AI_MODEL || "gpt-4.1-mini";
const TOP_K         = Number(process.env.RAG_TOP_K) || 6;
const DOCS_TOP_K    = Number(process.env.RAG_DOCS_TOP_K) || 8;

const NO_ADVICE = "Do not tell the user to buy, sell or hold any security and give no price targets; frame observations as points to consider.";

const SYSTEM_PROMPTS = {
  fund:      "You are a financial analyst specializing in Indian and US stock markets. Answer questions about company fundamentals, financial ratios, earnings, and valuations. Be concise and accurate.",
  news:      "You are a knowledgeable market analyst. Answer questions about financial markets, company news, economic indicators, and investment topics.",
  news_bing: "You are a knowledgeable market analyst. Answer questions about financial markets, company news, and economic events.",
  youtube:   "You are a financial content analyst. Summarize and explain financial content clearly and concisely.",
  reddit:    "You are a market sentiment analyst. Provide balanced insights on investor sentiment and market discussions.",
  screener:  "You are a stock screening analyst. Help users find and analyze stocks based on financial criteria.",
  portfolio: [
    "You are Frruit's portfolio analyst. The user's holdings, valued at live prices, are given as evidence [P1].",
    "Those figures are authoritative: use them exactly for any value, P&L, return, weight or allocation, never recompute them differently, and never invent holdings the user does not have.",
    "Use web search for recent news, results, guidance or events affecting these holdings when the question calls for it, and cite the sources.",
    "Explain risks factually: concentration, sector exposure, volatility (beta), valuation (P/E), currency exposure, upcoming earnings.",
    "If the data cannot answer the question, say what is missing.",
  ].join(" "),
  docs: [
    "You answer questions about the user's uploaded document using only the excerpts given as evidence.",
    "Cite every factual sentence with its [S#] marker. Quote figures exactly, with their units and reporting period.",
    "If the excerpts do not contain the answer, say clearly that the document does not appear to cover it; do not fill gaps from general knowledge.",
  ].join(" "),
  default:   "You are a helpful financial assistant specializing in stock markets, investment analysis, and financial planning.",
};

const EVIDENCE_RULES = `Grounding rules:
- Base every factual statement on the evidence below or on your web search results.
- End each sentence that states a fact, figure, date or event with its citation: [S#] or [P1] for the evidence below, or a Markdown link for a web page.
- Use only the evidence markers listed below; never invent one.
- If neither the evidence nor web search answers the question, say plainly what could not be verified instead of guessing.
- Give the date or period of time-sensitive figures (e.g. "in Q2 FY26", "as of 24 Nov 2026").
- ${NO_ADVICE}
- Do not add a disclaimer; one is appended automatically.`;

const EMPTY_PORTFOLIO_ANSWER = "Your portfolio is empty, so there is nothing to analyse yet. Add your holdings on the **Portfolio** page (symbol, quantity and average buy price), then ask again.";
const NOT_IN_DOCUMENT = "I could not find anything in this document that answers the question. It may not be covered, or it may be phrased differently. Try asking with the terms the document uses.";

function sysPrompt(flag) {
  return SYSTEM_PROMPTS[flag] || SYSTEM_PROMPTS.default;
}

function fmtDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : null;
}

function hitLabel(hit) {
  const pages = hit.page_from ? (hit.page_to && hit.page_to !== hit.page_from ? `pp.${hit.page_from}-${hit.page_to}` : `p.${hit.page_from}`) : null;
  const kind = hit.source_type === "news" ? "news article" : hit.source_type === "seed" ? "reference document" : "uploaded document";
  const when = hit.source_type === "news" ? `published ${fmtDate(hit.published_at)}` : `uploaded ${fmtDate(hit.uploaded_at)}`;
  return [`"${hit.title}"`, kind, pages, hit.heading ? `section "${hit.heading}"` : null, when].filter(Boolean).join(" · ");
}

function extractWebSources(annotations = []) {
  if (!Array.isArray(annotations)) return [];
  const seen = new Set();
  return annotations
    .filter(a => a.type === "url_citation")
    .map(a => ({ url: a.url_citation?.url || a.url, title: a.url_citation?.title || a.title || "" }))
    .filter(s => s.url && !seen.has(s.url) && seen.add(s.url))
    .map((s, i) => ({ ...s, marker: `W${i + 1}` }));
}

module.exports = function createPipeline({ pool, openai, lang, portfolio, rag, evidence, answers }) {
  // Latest `limit` turns, oldest first, in English (the model always works in English)
  async function getHistory(userId, promptId, limit = 10) {
    const r = await pool.query(
      `SELECT h.person, COALESCE(a.answer_en, h.text_en, h.text) AS text
       FROM ai_prompt_history h LEFT JOIN ai_answers a ON a.history_id = h.id
       WHERE h.user_id=$1 AND h.prompt_id=$2 AND h.active=true AND h.type='text'
       ORDER BY h.id DESC LIMIT $3`,
      [userId, promptId, limit]
    );
    // Drop the review footer / banner from earlier answers so the model doesn't imitate them
    return r.rows.reverse().map(row => ({
      ...row,
      text: row.person === "bot" ? String(row.text || "").replace(/\n+---\n_[^\n]*_\s*$/, "").replace(/^> ⚠️ \*\*UNCERTAIN\*\*[^\n]*\n+/, "") : row.text,
    }));
  }

  async function getPrompt(userId, promptId) {
    const { rows: [p] } = await pool.query(
      `SELECT prompt_id, kind, document_ids FROM ai_prompts WHERE prompt_id=$1 AND user_id=$2 AND active=true`,
      [promptId, userId]
    );
    return p || null;
  }

  // "What about its debt?" → "Infosys debt levels FY2025"
  async function standaloneQuery(history, question) {
    if (!history.length || !process.env.OPENAI_API_KEY) return question;
    try {
      const recent = history.slice(-6).map(h => `${h.person === "bot" ? "Assistant" : "User"}: ${String(h.text).slice(0, 600)}`).join("\n");
      const completion = await openai.chat.completions.create({
        model: REWRITE_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: "Rewrite the user's latest question as one standalone search query in English, resolving pronouns and references from the conversation. Keep company names, tickers, periods and numbers. Output only the query." },
          { role: "user", content: `Conversation:\n${recent}\n\nLatest question: ${question}` },
        ],
      });
      return completion.choices[0].message.content?.trim().replace(/^"|"$/g, "") || question;
    } catch (e) {
      console.error("Query rewrite failed:", e.message);
      return question;
    }
  }

  // Runs everything up to the verified English answer. The caller streams/translates it, then calls finishTurn.
  async function runTurn({ userId, promptId, message, flag, language, onStage = () => {} }) {
    const started = Date.now();
    const prompt = await getPrompt(userId, promptId);
    if (!prompt) throw Object.assign(new Error("Prompt not found"), { code: 404 });
    const docMode = flag === "docs" || prompt.kind === "document";
    if (docMode) flag = "docs";

    onStage("understanding");
    const detected = await lang.detect(message);
    const target = lang.resolveTarget(language, detected);
    const history = await getHistory(userId, promptId);

    const { rows: [userRow] } = await pool.query(
      `INSERT INTO ai_prompt_history(user_id, prompt_id, person, text, type, focus_type, language, text_en)
       VALUES($1,$2,'user',$3,'text',$4,$5,$6) RETURNING id`,
      [userId, promptId, message, flag, detected.code, detected.english !== message ? detected.english : null]
    );
    const base = { userId, promptId, flag, message, detected, target, questionHistoryId: userRow.id, started };

    // Portfolio evidence
    let portfolioCtx = null;
    if (flag === "portfolio") {
      portfolioCtx = await portfolio.buildContext(userId);
      if (portfolioCtx.empty) return { ...base, system: true, englishAnswer: EMPTY_PORTFOLIO_ANSWER, citations: [] };
    }

    // Retrieval
    const query = await standaloneQuery(history, detected.english);
    onStage("retrieving", { query });
    let hits = [];
    let retrievalMs = 0;
    try {
      const found = await rag.search({
        query,
        userId,
        documentIds: docMode ? prompt.document_ids : null,
        k: docMode ? DOCS_TOP_K : TOP_K,
        minSimilarity: docMode ? 0.2 : undefined,
      });
      hits = found.hits;
      retrievalMs = found.ms;
    } catch (e) {
      console.error("Retrieval failed:", e.message);
    }

    if (docMode && !hits.length) {
      const verdict = { status: "UNCERTAIN", confidence: 0, reasons: ["no_sources"], unverified: [], supportByMarker: {}, detail: { retrieval: 0, note: "no matching excerpt in the document" } };
      return { ...base, query, retrievalMs, model: null, verdict, citations: [], englishAnswer: evidence.decorate(NOT_IN_DOCUMENT, verdict, { flag }) };
    }

    const evidenceItems = hits.map((h, i) => ({ marker: `S${i + 1}`, label: hitLabel(h), text: h.content, hit: h }));
    if (portfolioCtx) evidenceItems.push({ marker: "P1", label: `Your portfolio, valued at live prices as of ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`, text: portfolioCtx.text });
    const evidenceText = evidenceItems.length
      ? evidenceItems.map(e => `[${e.marker}] ${e.label}\n${e.text}`).join("\n\n")
      : "No matching documents were found in Frruit's document store. Rely on web search and cite every web source.";

    const system = [
      sysPrompt(flag),
      docMode ? `Rules:\n- ${NO_ADVICE}\n- Use only the [S#] markers listed below.\n- Do not add a disclaimer; one is appended automatically.` : EVIDENCE_RULES,
      detected.code !== "en" ? `The user's message was translated from ${detected.name}. Answer in English; the answer is translated for them afterwards.` : null,
      `EVIDENCE\n${evidenceText}`,
    ].filter(Boolean).join("\n\n");

    onStage("answering", { sources: evidenceItems.length });
    const model = docMode ? DOCS_MODEL : CHAT_MODEL;
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        ...history.map(r => ({ role: r.person === "bot" ? "assistant" : "user", content: r.text || "" })),
        { role: "user", content: detected.english },
      ],
      ...(docMode ? { temperature: 0.1 } : { web_search_options: {} }),
    });
    const msg = completion.choices[0].message;
    const webSources = docMode ? [] : extractWebSources(msg.annotations);
    const known = new Set(evidenceItems.map(e => e.marker));
    const { text: rawAnswer } = stripUnknownMarkers(normaliseMarkers(msg.content || ""), known);
    const cited = citedMarkers(rawAnswer);

    onStage("verifying");
    const citedHits = evidenceItems.filter(e => e.hit && cited.has(e.marker));
    const verdict = await evidence.assess({
      question: detected.english,
      answer: rawAnswer,
      evidence: evidenceItems,
      webSources,
      citedInternal: cited,
      retrievalSimilarity: citedHits.reduce((m, e) => Math.max(m, e.hit.similarity || 0), 0),
    });

    const now = new Date();
    const citations = [
      ...evidenceItems.filter(e => e.hit).map(e => ({
        marker: e.marker,
        source_type: e.hit.source_type,
        document_id: e.hit.document_id,
        chunk_id: e.hit.chunk_id,
        url: e.hit.source_type === "news" ? e.hit.url : null,
        title: e.hit.title,
        section: e.hit.heading,
        page_from: e.hit.page_from,
        page_to: e.hit.page_to,
        snippet: e.hit.content.slice(0, 700),
        similarity: e.hit.similarity,
        cited: cited.has(e.marker),
        supported: verdict.supportByMarker[e.marker] || "unchecked",
        source_timestamp: e.hit.source_type === "news" ? e.hit.published_at : e.hit.uploaded_at,
        retrieved_at: now,
      })),
      ...(portfolioCtx ? [{
        marker: "P1", source_type: "portfolio", title: "Your portfolio (live prices)", snippet: portfolioCtx.text.slice(0, 700),
        cited: cited.has("P1"), supported: verdict.supportByMarker.P1 || "unchecked", source_timestamp: now, retrieved_at: now,
      }] : []),
      ...webSources.map(w => ({
        marker: w.marker, source_type: "web", url: w.url, title: w.title, cited: true,
        supported: verdict.supportByMarker[w.marker] || "web", source_timestamp: null, retrieved_at: now,
      })),
    ];

    return {
      ...base,
      query,
      retrievalMs,
      model,
      verdict,
      citations,
      englishAnswer: evidence.decorate(rawAnswer, verdict, { flag, checkedAt: now }),
    };
  }

  // Saves the bot message (in the user's language) and the structured answer record → meta for the client
  async function finishTurn(turn, answerText) {
    const translated = turn.target.code !== "en";
    const legacyLinks = turn.citations.filter(c => c.cited).map(c => ({
      marker: c.marker, source_type: c.source_type, source_url: c.url, heading: c.title, title: c.title,
      source_date: c.source_timestamp || c.retrieved_at, page_from: c.page_from, document_id: c.document_id,
    }));
    const { rows: [botRow] } = await pool.query(
      `INSERT INTO ai_prompt_history(user_id, prompt_id, person, text, type, focus_type, link, language, text_en)
       VALUES($1,$2,'bot',$3,'text',$4,$5,$6,$7) RETURNING id`,
      [turn.userId, turn.promptId, answerText, turn.flag, JSON.stringify(legacyLinks), turn.target.code, translated ? turn.englishAnswer : null]
    );
    const meta = {
      prompt_history_id: botRow.id,
      language: turn.target.code,
      language_name: turn.target.name,
      detected_language: turn.detected.code,
      translated,
      text_en: translated ? turn.englishAnswer : null,
      answer_id: null,
      status: null,
      confidence: null,
      uncertain_reasons: [],
      citations: [],
    };
    if (turn.system) return meta;

    const answerId = await answers.record({
      historyId: botRow.id,
      questionHistoryId: turn.questionHistoryId,
      userId: turn.userId,
      promptId: turn.promptId,
      flag: turn.flag,
      question: turn.message,
      questionEn: turn.detected.english,
      searchQuery: turn.query,
      answerEn: turn.englishAnswer,
      language: turn.target.code,
      verdict: turn.verdict,
      citations: turn.citations,
      model: turn.model,
      retrievalMs: turn.retrievalMs,
      totalMs: Date.now() - turn.started,
    });
    const presented = (await answers.citationsFor([answerId])).get(answerId) || [];
    return {
      ...meta,
      answer_id: answerId,
      status: turn.verdict.status,
      confidence: turn.verdict.confidence,
      uncertain_reasons: turn.verdict.reasons,
      confidence_detail: turn.verdict.detail,
      citations: presented,
    };
  }

  return { runTurn, finishTurn, getHistory, SYSTEM_PROMPTS, CHAT_MODEL };
};
