"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { extractPages, chunkPages, detectKind } = require("../../extract");

const PDF = path.join(__dirname, "..", "fixtures", "acme_annual_report.pdf");
const DOCX = path.join(__dirname, "..", "fixtures", "acme_annual_report.docx");

test("detects file types from magic bytes", () => {
  assert.strictEqual(detectKind(fs.readFileSync(PDF), "x.bin"), "pdf");
  assert.strictEqual(detectKind(fs.readFileSync(DOCX), "x.bin"), "docx");
  assert.strictEqual(detectKind(Buffer.from("hello world"), "notes.txt"), "txt");
  assert.strictEqual(detectKind(Buffer.from("hello world"), "notes.exe"), null);
});

test("PDF extraction keeps page numbers and chunks follow sections", async () => {
  const { kind, pages } = await extractPages(fs.readFileSync(PDF), "acme.pdf");
  assert.strictEqual(kind, "pdf");
  assert.deepStrictEqual(pages.map(p => p.page), [1, 2, 3]);
  const chunks = chunkPages(pages, { size: 300, overlap: 80 });
  const risk = chunks.find(c => c.content.includes("Debt to equity"));
  assert.ok(risk, "risk chunk exists");
  assert.strictEqual(risk.page_from, 3);
  assert.strictEqual(risk.heading, "3. Risk Factors");
  assert.ok(chunks.every(c => c.content.length <= 300 + 200), "chunks stay near the size limit");
});

test("DOCX extraction recovers headings", async () => {
  const { pages } = await extractPages(fs.readFileSync(DOCX), "acme.docx");
  const chunks = chunkPages(pages, { size: 300, overlap: 0 });
  assert.ok(chunks.some(c => c.heading === "3. Risk Factors" && c.content.includes("4.8 times")));
});

test("overlap starts on a word boundary", () => {
  const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
  const chunks = chunkPages([{ page: 1, text: `${long}.\n\n${long}.` }], { size: 500, overlap: 60 });
  for (const c of chunks.slice(1)) assert.match(c.content, /^word\d+/);
});

test("rejects documents without text", async () => {
  await assert.rejects(extractPages(Buffer.from("   \n  "), "empty.txt"), /no readable text/);
});
