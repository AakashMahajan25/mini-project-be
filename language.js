"use strict";

// Multilingual pipeline: detect language → translate question to English →
// retrieve + answer in English → translate the answer back.

const LANG_AI_MODEL = process.env.LANG_AI_MODEL || "gpt-4.1-mini";

// Languages the user can pick explicitly. Auto-detect also handles any other language.
const SUPPORTED_LANGUAGES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  gu: "Gujarati",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  or: "Odia",
  ur: "Urdu",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
};

const ENGLISH = { code: "en", name: "English", script: "native" };

const DETECT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language_code", "language_name", "script", "english"],
  properties: {
    language_code: { type: "string", description: "ISO 639-1 code of the message language, e.g. en, hi, mr" },
    language_name: { type: "string", description: "English name of the language, e.g. Hindi" },
    script:        { type: "string", enum: ["native", "latin"], description: "latin when a non-Latin-script language is typed in Latin letters (e.g. Hinglish)" },
    english:       { type: "string", description: "Faithful English translation of the message" },
  },
};

const DETECT_PROMPT = `You prepare user messages for an English-language finance research assistant.
Identify the language the message is written in and translate it into English.
- Romanized Hindi / Hinglish ("mera portfolio kaisa hai") is Hindi with script "latin". Apply the same rule to other romanized Indian languages.
- If the message is English, or English with a few borrowed words, return language_code "en", script "native" and copy the message unchanged into "english".
- Keep ticker symbols, company names, numbers, currencies and dates exactly as written.
- Translate only. Never answer the message.`;

// True when every letter in the text is a Latin letter (digits, symbols and emoji are ignored)
function isLatinOnly(text) {
  return !/[^\p{Script=Latin}\P{L}]/u.test(text);
}

module.exports = function createLanguage({ openai }) {
  // → { code, name, script, english }
  async function detect(text) {
    const message = String(text || "").trim();
    if (!message) return { ...ENGLISH, english: message };
    try {
      const completion = await openai.chat.completions.create({
        model: LANG_AI_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: DETECT_PROMPT },
          { role: "user", content: message },
        ],
        response_format: { type: "json_schema", json_schema: { name: "language_detection", strict: true, schema: DETECT_SCHEMA } },
      });
      const out = JSON.parse(completion.choices[0].message.content);
      const code = String(out.language_code || "en").toLowerCase().slice(0, 5);
      if (code === "en") return { ...ENGLISH, english: message };
      return {
        code,
        name: out.language_name || SUPPORTED_LANGUAGES[code] || code,
        // Only a non-Latin language can be "romanized"
        script: out.script === "latin" && isLatinOnly(message) ? "latin" : "native",
        english: out.english?.trim() || message,
      };
    } catch (e) {
      console.error("Language detection failed:", e.message);
      return { ...ENGLISH, english: message };
    }
  }

  // preference: "auto" | ISO code. Returns the language the answer is delivered in.
  function resolveTarget(preference, detected) {
    const pref = String(preference || "auto").toLowerCase();
    if (pref !== "auto" && SUPPORTED_LANGUAGES[pref]) {
      if (pref === "en") return ENGLISH;
      return { code: pref, name: SUPPORTED_LANGUAGES[pref], script: "native" };
    }
    if (!detected || detected.code === "en") return ENGLISH;
    return { code: detected.code, name: detected.name, script: detected.script };
  }

  function translatePrompt(target) {
    const scriptRule = target.script === "latin"
      ? `Write ${target.name} in Latin letters (romanized), the way people commonly type it in chat (for Hindi, natural Hinglish).`
      : `Write in ${target.name} using its native script.`;
    return `Translate the assistant's answer below from English into ${target.name}. ${scriptRule}
Rules:
- Preserve the Markdown structure exactly: headings, lists, bold/italics, tables, links and line breaks.
- Keep numbers, currency symbols, percentages, dates, ticker symbols, company names, URLs and citation markers such as [1] unchanged.
- Keep widely used financial terms (P/E, EBITDA, EPS, NIFTY, Sensex, IPO, ETF) in English where speakers normally do.
- Do not add, drop or soften any information, caveat or disclaimer.
- Output only the translation.`;
  }

  // Streams the translation through onDelta(text) when given; resolves with the full translation.
  // Falls back to the English text if translation fails.
  async function translate(text, target, onDelta) {
    if (!text || !target || target.code === "en") {
      if (onDelta && text) onDelta(text);
      return text;
    }
    let out = "";
    try {
      const stream = await openai.chat.completions.create({
        model: LANG_AI_MODEL,
        temperature: 0.2,
        stream: true,
        messages: [
          { role: "system", content: translatePrompt(target) },
          { role: "user", content: text },
        ],
      });
      for await (const part of stream) {
        const delta = part.choices?.[0]?.delta?.content;
        if (!delta) continue;
        out += delta;
        if (onDelta) onDelta(delta);
      }
      if (!out.trim()) throw new Error("empty translation");
      return out;
    } catch (e) {
      console.error("Translation failed:", e.message);
      // Nothing streamed yet → send the English answer instead of nothing
      if (!out) {
        if (onDelta) onDelta(text);
        return text;
      }
      return out;
    }
  }

  return { SUPPORTED_LANGUAGES, detect, resolveTarget, translate };
};
