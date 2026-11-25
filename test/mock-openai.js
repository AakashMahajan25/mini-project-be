"use strict";

// Offline stand-in for the OpenAI API, for testing without credits.
//   node test/mock-openai.js            (listens on :4010)
//   OPENAI_BASE_URL=http://127.0.0.1:4010/v1 OPENAI_API_KEY=mock npm run dev
// Use a separate database: mock embeddings are not compatible with real ones.
//
// Embeddings are hashed bag-of-words vectors, so lexically similar texts are close.
// Chat answers are assembled from the [S#] evidence in the system prompt. Put "MOCK_NOCITE"
// in a question to get an uncited answer (exercises the UNCERTAIN path).

const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.MOCK_OPENAI_PORT) || 4010;
const DIMS = 1536;
const STOP = new Set("the a an of and or to in on for is are was were be by with as at from that this it its what which how why who about does do did has have had their there".split(" "));

const words = (t) => String(t || "").toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(w => !STOP.has(w)) || [];

function embedText(text) {
  const v = new Float64Array(DIMS);
  for (const w of words(text)) {
    const h = crypto.createHash("md5").update(w).digest();
    v[h.readUInt32LE(0) % DIMS] += 1;
    v[h.readUInt32LE(4) % DIMS] += 0.5;
  }
  const norm = Math.hypot(...v) || 1;
  return Array.from(v, x => x / norm);
}

function overlap(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size) return 0;
  return [...A].filter(w => B.has(w)).length / A.size;
}

function parseEvidence(system) {
  const block = String(system || "").split("EVIDENCE")[1] || "";
  const items = [];
  const re = /\[([SP]\d+)\] ([^\n]*)\n([\s\S]*?)(?=\n\n\[[SP]\d+\] |$)/g;
  let m;
  while ((m = re.exec(block))) items.push({ marker: m[1], label: m[2], text: m[3].trim() });
  return items;
}

// The evidence sentence that best matches the question (returned without its full stop)
function bestSentence(text, question) {
  const list = (String(text).replace(/\s+/g, " ").match(/(?:[^.!?]|\.(?=\d))+[.!?]/g) || []).filter(x => x.trim().length >= 20);
  if (!list.length) list.push(String(text).slice(0, 200));
  return list.map(x => ({ x: x.trim(), score: overlap(question, x) })).sort((a, b) => b.score - a.score)[0].x.replace(/[.!?]$/, "");
}

const HINDI = { "इन्फोसिस का राजस्व कितना था?": "What was Infosys revenue?" };

function chatAnswer(body) {
  const system = body.messages.find(m => m.role === "system")?.content || "";
  const question = [...body.messages].reverse().find(m => m.role === "user")?.content || "";

  if (system.startsWith("Rewrite the user's latest question")) {
    return { content: question.split("Latest question:").pop().trim() };
  }
  if (/MOCK_NOCITE/.test(question)) {
    return { content: "Revenue grew 42% last year and margins expanded to 31%, according to analysts. The company is expected to double its profit next year." };
  }
  const evidence = parseEvidence(system).filter(e => e.marker.startsWith("S") || e.marker === "P1");
  const scored = evidence.map(e => ({ ...e, score: overlap(question, e.text) })).sort((a, b) => b.score - a.score);
  const usable = scored.filter(e => e.score > 0).slice(0, 2);
  const web = body.web_search_options ? { url: "https://example.com/markets/today", title: "Example Markets — Today" } : null;

  if (!usable.length && !web) return { content: "The document does not appear to cover this question." };
  const parts = usable.map(e => `${bestSentence(e.text, question)} [${e.marker}].`);
  let content = parts.join(" ");
  const annotations = [];
  if (web) {
    const sentence = ` Market commentary is available from [${web.title}](${web.url}).`;
    annotations.push({ type: "url_citation", url_citation: { url: web.url, title: web.title, start_index: content.length, end_index: content.length + sentence.length } });
    content += sentence;
  }
  return { content: content.trim(), annotations };
}

function jsonAnswer(name, body) {
  const user = body.messages.find(m => m.role === "user")?.content || "";
  if (name === "language_detection") {
    if (/[ऀ-ॿ]/.test(user)) return { language_code: "hi", language_name: "Hindi", script: "native", english: HINDI[user.trim()] || user };
    return { language_code: "en", language_name: "English", script: "native", english: user };
  }
  if (name === "news_tags") {
    const items = JSON.parse(user);
    return { items: items.map(i => ({ id: i.id, sentiment: ["Bullish", "Neutral", "Bearish"][i.id % 3], companies: [] })) };
  }
  if (name === "market_summary") {
    const { headlines } = JSON.parse(user);
    return {
      drivers: `Markets are reacting to ${headlines.length} recent headlines (mock summary).`,
      points: headlines.slice(0, 4).map(h => ({ title: h.title.slice(0, 60), summary: h.summary || h.title, article_ids: [h.id] })),
    };
  }
  if (name === "answer_audit") {
    const evidence = (user.split("EVIDENCE:\n")[1] || "").split("\n\nANSWER:\n")[0];
    const answer = user.split("\n\nANSWER:\n")[1] || "";
    const byMarker = {};
    for (const block of evidence.split(/\n\n(?=\[)/)) {
      const m = block.match(/^\[([SPW]\d+)\]/);
      if (m) byMarker[m[1]] = block;
    }
    const sentences = answer.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 20 && !s.startsWith(">") && !s.startsWith("_"));
    const claims = sentences.map(text => {
      const markers = [...text.matchAll(/\[([SP]\d+)\]/g)].map(m => m[1]);
      if (/\]\(https?:/.test(text)) return { text, citations: ["W1"], verdict: "web" };
      if (!markers.length) return { text, citations: [], verdict: /\d/.test(text) ? "uncited" : "general" };
      const support = Math.max(...markers.map(mk => overlap(text.replace(/\[[SP]\d+\]/g, ""), byMarker[mk] || "")));
      return { text, citations: markers, verdict: support >= 0.6 ? "supported" : support >= 0.3 ? "partial" : "unsupported" };
    });
    return { answers_question: !/does not appear to cover|could not find/i.test(answer), claims };
  }
  return {};
}

function send(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    const raw = Buffer.concat(chunks);
    const url = req.url.replace(/^\/v1/, "");
    try {
      if (url.startsWith("/embeddings")) {
        const body = JSON.parse(raw);
        const input = [].concat(body.input);
        // The SDK asks for base64 (little-endian float32) unless encoding_format is "float"
        const encode = (v) => body.encoding_format === "base64" ? Buffer.from(new Float32Array(v).buffer).toString("base64") : v;
        return send(res, 200, { object: "list", model: body.model, data: input.map((t, index) => ({ object: "embedding", index, embedding: encode(embedText(t)) })), usage: { prompt_tokens: 0, total_tokens: 0 } });
      }
      if (url.startsWith("/audio/transcriptions")) {
        return send(res, 200, { text: "What is the latest news on Reliance Industries?" });
      }
      if (url.startsWith("/chat/completions")) {
        const body = JSON.parse(raw);
        const schemaName = body.response_format?.json_schema?.name;
        const base = { id: "mock", object: "chat.completion", created: Math.floor(Date.now() / 1000), model: body.model };
        if (body.stream) {
          const system = body.messages.find(m => m.role === "system")?.content || "";
          const text = body.messages.find(m => m.role === "user")?.content || "";
          const lang = (system.match(/into (\w+)/) || [])[1] || "translated";
          const out = `[${lang}] ${text}`;
          res.writeHead(200, { "Content-Type": "text/event-stream" });
          for (let i = 0; i < out.length; i += 40) {
            res.write(`data: ${JSON.stringify({ ...base, object: "chat.completion.chunk", choices: [{ index: 0, delta: { content: out.slice(i, i + 40) } }] })}\n\n`);
          }
          res.write("data: [DONE]\n\n");
          return res.end();
        }
        const message = schemaName
          ? { role: "assistant", content: JSON.stringify(jsonAnswer(schemaName, body)) }
          : { role: "assistant", ...chatAnswer(body) };
        return send(res, 200, { ...base, choices: [{ index: 0, message, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
      }
      send(res, 404, { error: { message: `mock: no route for ${req.method} ${req.url}` } });
    } catch (e) {
      send(res, 500, { error: { message: `mock: ${e.message}` } });
    }
  });
}).listen(PORT, "127.0.0.1", () => console.log(`Mock OpenAI listening on http://127.0.0.1:${PORT}/v1`));
