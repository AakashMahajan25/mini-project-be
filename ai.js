"use strict";

// One AI client for the whole backend.
//   AI_GATEWAY_API_KEY set → Vercel AI Gateway (OpenAI-compatible, https://ai-gateway.vercel.sh/v1)
//   otherwise             → OpenAI directly with OPENAI_API_KEY (OPENAI_BASE_URL works, e.g. the offline mock)
// AI_PROVIDER=gateway|openai forces one of them.
//
// Modules keep calling the OpenAI SDK shape (chat.completions / embeddings), with plain model ids
// like "gpt-4.1-mini"; on the gateway they become "openai/gpt-4.1-mini". Ids that already contain
// a "/" (e.g. "anthropic/claude-sonnet-4.5") are passed through unchanged.

const OpenAI = require("openai");
const { toFile } = require("openai");

const GATEWAY_ORIGIN = (process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh").replace(/\/$/, "");

function provider() {
  const forced = String(process.env.AI_PROVIDER || "").toLowerCase();
  if (forced === "gateway" || forced === "openai") return forced;
  return process.env.AI_GATEWAY_API_KEY ? "gateway" : "openai";
}
const isGateway = () => provider() === "gateway";
const apiKey = () => (isGateway() ? process.env.AI_GATEWAY_API_KEY : process.env.OPENAI_API_KEY);
const configured = () => Boolean(apiKey());

function modelId(id) {
  if (!id) return id;
  return isGateway() && !id.includes("/") ? `openai/${id}` : id;
}

// Default web-search chat model: OpenAI's search model directly, a web-search-capable model on the gateway
const defaultChatModel = () => (isGateway() ? "gpt-4.1-mini" : "gpt-5-search-api");

// "…?utm_source=openai" → "…"
function cleanUrl(url) {
  return String(url || "")
    .replace(/\?utm_source=openai&/, "?")
    .replace(/[?&]utm_source=openai(?=$|[)\s#])/, "");
}
const cleanText = (text) => String(text || "").replace(/(https?:\/\/[^\s)]+)/g, (u) => cleanUrl(u));

function createAI() {
  const gateway = isGateway();
  const client = new OpenAI({
    apiKey: apiKey() || "not-configured",
    ...(gateway ? { baseURL: `${GATEWAY_ORIGIN}/v1` } : {}),
  });

  const withModel = (body) => ({ ...body, model: modelId(body.model) });

  // Chat answer grounded in live web search → { content, annotations: [{ type: "url_citation", url_citation: { url, title } }] }
  async function webSearchChat({ model, messages }) {
    const id = modelId(model);

    // OpenAI search models (gpt-5-search-api, gpt-4o-search-preview) search through Chat Completions
    if (/search/.test(id) && !gateway) {
      const r = await client.chat.completions.create({ model: id, messages, web_search_options: {} });
      return { content: r.choices[0].message.content || "", annotations: r.choices[0].message.annotations || [] };
    }

    // OpenAI models (directly or on the gateway): Responses API with the native web_search tool
    if (!gateway || id.startsWith("openai/")) {
      const r = await client.responses.create({
        model: id,
        instructions: messages.filter(m => m.role === "system").map(m => m.content).join("\n\n"),
        input: messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content || "" })),
        tools: [{ type: "web_search", search_context_size: process.env.WEB_SEARCH_CONTEXT || "medium" }],
      });
      const parts = (r.output || []).filter(o => o.type === "message").flatMap(o => o.content || []).filter(c => c.type === "output_text");
      return {
        content: cleanText(parts.map(c => c.text).join("")),
        annotations: parts.flatMap(c => c.annotations || [])
          .filter(a => a.type === "url_citation")
          .map(a => ({ type: "url_citation", url_citation: { url: cleanUrl(a.url), title: a.title || "" } })),
      };
    }

    // Other gateway models: the gateway runs a Perplexity search server-side; sources come back as Markdown links
    const r = await client.chat.completions.create({
      model: id,
      messages,
      tools: [{ type: "vercel:perplexity_search", config: { max_results: 5 } }],
      tool_choice: "auto",
    });
    return { content: r.choices[0].message.content || "", annotations: [] };
  }

  // Speech-to-text → { text }
  async function transcribe({ buffer, mime, language, model = process.env.VOICE_MODEL || "gpt-4o-mini-transcribe" }) {
    if (gateway) {
      const res = await fetch(`${GATEWAY_ORIGIN}/v4/ai/transcription-model`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          "ai-gateway-protocol-version": "0.0.1",
          "ai-transcription-model-specification-version": "4",
          "ai-model-id": modelId(model),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: buffer.toString("base64"),
          mediaType: mime,
          ...(language ? { providerOptions: { openai: { language } } } : {}),
        }),
        signal: AbortSignal.timeout(60000),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(body.error?.message || body.message || `HTTP ${res.status}`), { status: res.status });
      return { text: String(body.text || "").trim(), model: modelId(model) };
    }
    const ext = (mime.split("/")[1] || "webm").replace("mpeg", "mp3").replace("x-wav", "wav");
    const result = await client.audio.transcriptions.create({
      file: await toFile(buffer, `speech.${ext}`, { type: mime }),
      model,
      ...(language ? { language } : {}),
    });
    return { text: String(result.text || "").trim(), model };
  }

  // Remaining balance (gateway only) → { balance, total_used } in USD, or null
  async function credits() {
    if (!gateway || !configured()) return null;
    const res = await fetch(`${GATEWAY_ORIGIN}/v1/credits`, { headers: { Authorization: `Bearer ${apiKey()}` }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const body = await res.json();
    return { balance: Number(body.balance), total_used: Number(body.total_used) };
  }

  return {
    provider: gateway ? "gateway" : "openai",
    chat: { completions: { create: (body, opts) => client.chat.completions.create(withModel(body), opts) } },
    embeddings: { create: (body, opts) => client.embeddings.create(withModel(body), opts) },
    webSearchChat,
    transcribe,
    credits,
  };
}

module.exports = { createAI, provider, isGateway, configured, modelId, defaultChatModel };
