"use strict";

// Voice input fallback for browsers without the Web Speech API (e.g. Firefox):
// the webapp records audio and posts it here; the transcript then goes through the normal chat pipeline.

const express = require("express");
const { toFile } = require("openai");

const VOICE_MODEL = process.env.VOICE_MODEL || "gpt-4o-mini-transcribe";
const MAX_MB = 15;
const EXT = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/m4a": "m4a" };

module.exports = function createVoice({ openai, auth, ok, fail }) {
  const router = express.Router();

  // Raw audio body; optional ?language=hi (ISO-639-1) improves accuracy
  router.post("/transcribe", auth, express.raw({ type: () => true, limit: `${MAX_MB}mb` }), async (req, res) => {
    try {
      if (!req.body?.length) return fail(res, "No audio received");
      if (!process.env.OPENAI_API_KEY) return fail(res, "Voice transcription is not configured (OPENAI_API_KEY missing)", 503);
      const mime = String(req.get("content-type") || "audio/webm").split(";")[0].trim();
      const ext = EXT[mime] || "webm";
      const language = String(req.query.language || "").toLowerCase().slice(0, 2);
      const result = await openai.audio.transcriptions.create({
        file: await toFile(req.body, `speech.${ext}`, { type: mime }),
        model: VOICE_MODEL,
        ...(language && language !== "au" ? { language } : {}),
      });
      ok(res, { text: String(result.text || "").trim(), model: VOICE_MODEL });
    } catch (e) {
      fail(res, `Transcription failed: ${e.message}`, e.status === 429 ? 429 : 500);
    }
  });

  return { router };
};
