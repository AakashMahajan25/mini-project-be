"use strict";

// Voice input fallback for browsers without the Web Speech API (e.g. Firefox):
// the webapp records audio and posts it here; the transcript then goes through the normal chat pipeline.

const express = require("express");
const { configured } = require("./ai");

const MAX_MB = 15;

module.exports = function createVoice({ openai, auth, ok, fail }) {
  const router = express.Router();

  // Raw audio body; optional ?language=hi (ISO-639-1) improves accuracy
  router.post("/transcribe", auth, express.raw({ type: () => true, limit: `${MAX_MB}mb` }), async (req, res) => {
    try {
      if (!req.body?.length) return fail(res, "No audio received");
      if (!configured()) return fail(res, "Voice transcription is not configured (no AI key set)", 503);
      const mime = String(req.get("content-type") || "audio/webm").split(";")[0].trim();
      const language = String(req.query.language || "").toLowerCase().slice(0, 2);
      const result = await openai.transcribe({ buffer: req.body, mime, language: language && language !== "au" ? language : undefined });
      ok(res, result);
    } catch (e) {
      fail(res, `Transcription failed: ${e.message}`, e.status === 429 ? 429 : 500);
    }
  });

  return { router };
};
