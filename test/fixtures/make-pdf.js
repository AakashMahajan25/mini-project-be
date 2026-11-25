"use strict";
// Writes a small multi-page, text-based PDF (no dependencies): node test/fixtures/make-pdf.js
const fs = require("fs");
const path = require("path");

const PAGES = [
  ["ACME SAMPLE FINANCE LTD", "ANNUAL REPORT FY2025 (TEST FIXTURE)", "",
   "This is a fictional document created to test the Frruit document pipeline.", "All figures are invented.", "",
   "1. Chairman's Letter", "",
   "Acme Sample Finance delivered a resilient year. Total revenue for FY2025 was",
   "Rs 4,820 crore, an increase of 14 percent over FY2024. Net profit rose to Rs 912 crore.", "",
   "The board recommended a final dividend of Rs 18 per share."],
  ["2. Management Discussion and Analysis", "",
   "Loan book grew 19 percent to Rs 38,400 crore. Gross non-performing assets improved",
   "to 2.1 percent from 2.6 percent a year earlier. The cost of funds was 7.4 percent.", "",
   "The company opened 120 new branches, taking the network to 1,050 branches across 14 states."],
  ["3. Risk Factors", "",
   "Key risks include interest rate volatility, rising competition from fintech lenders,",
   "and concentration in vehicle finance, which forms 46 percent of the loan book.", "",
   "Debt to equity stood at 4.8 times at the end of FY2025."],
];

const esc = (t) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const objects = [];
const add = (body) => { objects.push(body); return objects.length; };
const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
const pagesId = objects.length + 1 + PAGES.length * 2;
const kids = [];
for (const lines of PAGES) {
  let y = 780;
  const ops = lines.map(l => { const op = l ? `BT /F1 11 Tf 56 ${y} Td (${esc(l)}) Tj ET` : ""; y -= l ? 16 : 10; return op; }).filter(Boolean).join("\n");
  const content = add(`<< /Length ${Buffer.byteLength(ops)} >>\nstream\n${ops}\nendstream`);
  kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Contents ${content} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`));
}
add(`<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`);
const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((body, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${body}\nendobj\n`; });
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync(path.join(__dirname, "acme_annual_report.pdf"), pdf);
console.log("wrote acme_annual_report.pdf");
