"use strict";

// Text extraction (PDF / DOCX / DOC / TXT) and chunking for the RAG store.
// extractPages(buffer, filename) → { kind, pages: [{ page, text }] }   (page is null when the format has no pages)
// chunkPages(pages) → [{ content, page_from, page_to, heading, token_count }]

const path = require("path");

const CHUNK_CHARS   = Number(process.env.RAG_CHUNK_CHARS)   || 3200; // ≈ 800 tokens
const OVERLAP_CHARS = Number(process.env.RAG_OVERLAP_CHARS) || 480;  // ≈ 120 tokens
const MIN_CHARS     = 40;
const HEADING_MARK  = "\u0001H:";

const SUPPORTED = {
  pdf:  "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc:  "application/msword",
  txt:  "text/plain",
  md:   "text/markdown",
};

// Detects the format from magic bytes, falling back to the file extension for plain text
function detectKind(buffer, filename = "") {
  const head = buffer.subarray(0, 8);
  if (head.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (head[0] === 0x50 && head[1] === 0x4b) return "docx"; // ZIP container
  if (head.readUInt32BE(0) === 0xd0cf11e0) return "doc";   // OLE2 container
  const ext = path.extname(filename).slice(1).toLowerCase();
  if ((ext === "txt" || ext === "md") && !buffer.subarray(0, 4096).includes(0)) return ext;
  return null;
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

async function extractPdf(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;
  const pages = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let text = "";
      let lastY = null;
      let lastH = 0;
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        const y = item.transform[5];
        const h = item.height || Math.abs(item.transform[3]) || 10;
        if (lastY !== null && Math.abs(y - lastY) > 1) {
          // A gap of well over one line height starts a new paragraph
          const gap = Math.abs(y - lastY) > Math.max(h, lastH) * 1.8;
          text = text.replace(/[ \t]+$/, "");
          if (gap) { if (!text.endsWith("\n\n")) text += text.endsWith("\n") ? "\n" : "\n\n"; }
          else if (!text.endsWith("\n")) text += "\n";
        }
        text += item.str;
        if (item.hasEOL && !text.endsWith("\n")) text += "\n";
        lastY = y;
        lastH = h;
      }
      pages.push({ page: p, text });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}

async function extractDocx(buffer) {
  const mammoth = require("mammoth");
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const text = decodeEntities(
    html
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, t) => `\n\n${HEADING_MARK}${t.replace(/<[^>]+>/g, "").trim()}\n\n`)
      .replace(/<\/(p|li|tr|table|ul|ol)>/gi, "\n\n")
      .replace(/<\/t[dh]>/gi, " | ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
  return [{ page: null, text }];
}

async function extractDoc(buffer) {
  const WordExtractor = require("word-extractor");
  const doc = await new WordExtractor().extract(buffer);
  return [{ page: null, text: doc.getBody() }];
}

async function extractPages(buffer, filename) {
  const kind = detectKind(buffer, filename);
  if (!kind) throw new Error("Unsupported file type. Upload a PDF, DOCX, DOC or TXT file.");
  let pages;
  if (kind === "pdf") pages = await extractPdf(buffer);
  else if (kind === "docx") pages = await extractDocx(buffer);
  else if (kind === "doc") pages = await extractDoc(buffer);
  else pages = [{ page: null, text: buffer.toString("utf8") }];

  const chars = pages.reduce((n, p) => n + p.text.replace(/\s/g, "").length, 0);
  if (chars < 50) {
    throw new Error(kind === "pdf"
      ? "No extractable text found. The PDF looks scanned (image-only); upload a text-based PDF."
      : "The document contains no readable text.");
  }
  return { kind, pages };
}

// ─── Chunking ─────────────────────────────────────────────────────────────────
function looksLikeHeading(text) {
  const t = text.trim();
  if (t.startsWith(HEADING_MARK)) return true;
  if (t.length < 3 || t.length > 90 || t.includes("\n")) return false;
  if (/[.,;:!?]$/.test(t)) return false;
  if (/^(\d+(\.\d+)*\.?|[IVXLC]+\.|[A-Z]\.)\s+[A-Za-z]/.test(t)) return true; // "2.1 Revenue", "IV. Risks"
  const letters = t.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();          // "MANAGEMENT DISCUSSION"
}

// Splits text longer than the chunk size on sentence boundaries
function splitLong(text, max) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text];
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > max) { out.push(cur.trim()); cur = ""; }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Last ~max chars of a text, starting at a sentence boundary if possible, else at a word boundary
function tail(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(-max);
  const sentence = cut.search(/[.!?]\s+\S/);
  if (sentence >= 0 && sentence < max * 0.6) return cut.slice(sentence + 1).trim();
  const space = cut.indexOf(" ");
  return (space >= 0 ? cut.slice(space + 1) : cut).trim();
}

function chunkPages(pages, { size = CHUNK_CHARS, overlap = OVERLAP_CHARS } = {}) {
  // 1. Paragraph units, each tagged with its page and the section heading it falls under
  const units = [];
  let heading = null;
  for (const { page, text } of pages) {
    const paragraphs = String(text || "")
      .replace(/\r\n?/g, "\n")
      .split(/\n[ \t]*\n/)
      .map(p => p.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean);
    for (const para of paragraphs) {
      // PDFs often have no blank line around headings: split heading-like lines out of the block
      let body = [];
      const flushBody = () => {
        const flat = body.join(" ").trim();
        body = [];
        if (!flat) return;
        for (const piece of flat.length > size ? splitLong(flat, size) : [flat]) units.push({ page, text: piece, heading });
      };
      for (const line of para.split("\n").map(l => l.trim()).filter(Boolean)) {
        if (looksLikeHeading(line)) {
          flushBody();
          heading = line.replace(HEADING_MARK, "").trim().slice(0, 200);
          units.push({ page, text: heading, heading, isHeading: true });
        } else {
          body.push(line);
        }
      }
      flushBody();
    }
  }

  // 2. Pack units into chunks of ~size chars, carrying ~overlap chars into the next chunk
  const chunks = [];
  let cur = [];
  let len = 0;
  const flush = () => {
    const body = cur.filter(u => !u.isHeading || cur.length === 1);
    const content = cur.map(u => u.text).join("\n\n").trim();
    if (content.length >= MIN_CHARS && body.length) {
      const pagesIn = cur.map(u => u.page).filter(p => p != null);
      chunks.push({
        content,
        page_from: pagesIn.length ? Math.min(...pagesIn) : null,
        page_to: pagesIn.length ? Math.max(...pagesIn) : null,
        heading: (cur.find(u => !u.isHeading) || cur[0]).heading || null,
        token_count: Math.ceil(content.length / 4),
      });
    }
    // Overlap: the last unit's tail (headings are not repeated)
    const last = [...cur].reverse().find(u => !u.isHeading);
    cur = last && overlap > 0 ? [{ ...last, text: tail(last.text, overlap), carried: true }] : [];
    len = cur.reduce((n, u) => n + u.text.length, 0);
  };

  for (const unit of units) {
    const onlyCarried = cur.every(u => u.carried);
    // A new section starts a new chunk once the current one has real content
    if (unit.isHeading && !onlyCarried && len > size * 0.4) flush();
    if (unit.isHeading && cur.every(u => u.carried)) { cur = []; len = 0; }
    if (len + unit.text.length > size && !cur.every(u => u.carried)) flush();
    cur.push(unit);
    len += unit.text.length + 2;
  }
  if (cur.some(u => !u.carried)) flush();
  return chunks.map((c, i) => ({ ...c, chunk_index: i }));
}

module.exports = { SUPPORTED, detectKind, extractPages, chunkPages };
