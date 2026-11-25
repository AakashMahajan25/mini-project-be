"use strict";

const express = require("express");

const PORTFOLIO_AI_MODEL = process.env.PORTFOLIO_AI_MODEL || "gpt-4.1-mini";
const MAX_HOLDINGS = 100;
const MARKETS = {
  IN: { currency: "INR", locale: "en-IN", symbol: "₹", exchange: "NSE" },
  US: { currency: "USD", locale: "en-US", symbol: "$", exchange: "NYSE/NASDAQ" },
};
const FX_SYMBOL = "INR="; // CNBC USD/INR spot

const SECTORS = [
  "Banking & Financials",
  "IT & Software",
  "Energy, Oil & Gas",
  "FMCG & Consumer Staples",
  "Consumer Discretionary & Retail",
  "Automobiles",
  "Pharma & Healthcare",
  "Metals & Mining",
  "Industrials & Capital Goods",
  "Telecom & Media",
  "Real Estate",
  "Power & Utilities",
  "Chemicals & Materials",
  "ETF / Index Fund",
  "Other",
];

const SYMBOL_RE = /^[A-Z0-9&.\-]{1,20}$/;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round(n, dp = 2) {
  if (n == null || !Number.isFinite(n)) return null;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function pct(part, whole) {
  return whole ? (part / whole) * 100 : null;
}

function money(value, market) {
  if (value == null) return "n/a";
  const m = MARKETS[market];
  const abs = Math.abs(value).toLocaleString(m.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${value < 0 ? "-" : ""}${m.symbol}${abs}`;
}

function signed(value, suffix = "") {
  if (value == null) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}${suffix}`;
}

function summarize(items, currency) {
  const invested = items.reduce((s, h) => s + h.invested, 0);
  const value = items.reduce((s, h) => s + h.value, 0);
  const dayChange = items.reduce((s, h) => s + h.dayChange, 0);
  const pnl = value - invested;
  return {
    currency,
    count: items.length,
    invested: round(invested),
    value: round(value),
    pnl: round(pnl),
    pnlPct: round(pct(pnl, invested)),
    dayChange: round(dayChange),
    dayChangePct: round(pct(dayChange, value - dayChange)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
module.exports = function createPortfolio({ pool, openai, auth, ok, fail, quotes }) {
  async function initDB() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_portfolio_holdings (
        holding_id  SERIAL PRIMARY KEY,
        user_id     INT NOT NULL REFERENCES ai_users(user_id),
        market      TEXT NOT NULL CHECK (market IN ('IN','US')),
        symbol      TEXT NOT NULL,
        name        TEXT,
        sector      TEXT,
        quantity    NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
        avg_price   NUMERIC(20,6) NOT NULL CHECK (avg_price > 0),
        notes       TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, market, symbol)
      );
      CREATE INDEX IF NOT EXISTS ai_portfolio_holdings_user_idx ON ai_portfolio_holdings(user_id);
    `);
    console.log("✅ Portfolio table ready");
  }

  async function classifySector(name, symbol, market) {
    try {
      const completion = await openai.chat.completions.create({
        model: PORTFOLIO_AI_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: "Classify the listed security into exactly one sector from the allowed list. Index funds and ETFs are \"ETF / Index Fund\"." },
          { role: "user", content: `${name} (${symbol}, ${MARKETS[market].exchange})` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sector",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["sector"],
              properties: { sector: { type: "string", enum: SECTORS } },
            },
          },
        },
      });
      return JSON.parse(completion.choices[0].message.content).sector;
    } catch (e) {
      console.error("Sector classification failed:", e.message);
      return null; // left unclassified; retried later by backfillSectors
    }
  }

  // Retries sector tagging for holdings saved while the model was unavailable (at most every 10 min per user)
  const backfillAttempts = new Map();
  function backfillSectors(userId, rows) {
    const pending = rows.filter(r => !r.sector);
    const last = backfillAttempts.get(userId) || 0;
    if (!pending.length || Date.now() - last < 10 * 60 * 1000) return;
    backfillAttempts.set(userId, Date.now());
    (async () => {
      for (const r of pending) {
        const sector = await classifySector(r.name || r.symbol, r.symbol, r.market);
        if (!sector) break;
        await pool.query(
          `UPDATE ai_portfolio_holdings SET sector=$1 WHERE holding_id=$2 AND sector IS NULL`,
          [sector, r.holding_id]
        );
      }
    })().catch(e => console.error("Sector backfill failed:", e.message));
  }

  async function getRows(userId) {
    const r = await pool.query(
      `SELECT holding_id, market, symbol, name, sector, quantity, avg_price, notes, "createdAt", "updatedAt"
       FROM ai_portfolio_holdings WHERE user_id=$1 ORDER BY market, symbol`,
      [userId]
    );
    return r.rows;
  }

  // Holdings valued at live prices, plus per-market, combined (INR) and sector totals
  async function getSnapshot(userId) {
    const rows = await getRows(userId);
    backfillSectors(userId, rows);
    const symbols = rows.map(r => quotes.cnbcSymbol(r.market, r.symbol));
    const hasUS = rows.some(r => r.market === "US");
    if (hasUS) symbols.push(FX_SYMBOL);

    let quoteMap = new Map();
    let quoteError = null;
    if (symbols.length) {
      try {
        quoteMap = await quotes.fetchQuotes(symbols);
      } catch (e) {
        quoteError = e.message;
        console.error("Portfolio quotes failed:", e.message);
      }
    }
    const usdInr = quoteMap.get(FX_SYMBOL)?.price || null;

    const holdings = rows.map(r => {
      const q = quoteMap.get(quotes.cnbcSymbol(r.market, r.symbol));
      const quantity = num(r.quantity);
      const avgPrice = num(r.avg_price);
      const invested = quantity * avgPrice;
      const price = q?.price ?? null;
      // Without a live price the holding is valued at cost so totals stay meaningful
      const value = price != null ? quantity * price : invested;
      const dayChange = price != null ? quantity * (q.change || 0) : 0;
      const pnl = value - invested;
      return {
        holding_id: r.holding_id,
        market: r.market,
        symbol: r.symbol,
        name: q?.name || r.name || r.symbol,
        sector: r.sector || "Unclassified",
        notes: r.notes || "",
        currency: MARKETS[r.market].currency,
        quantity,
        avg_price: avgPrice,
        price,
        priceAvailable: price != null,
        change: q ? round(q.change) : null,
        changePct: q ? round(q.changePct) : null,
        invested: round(invested),
        value: round(value),
        pnl: round(pnl),
        pnlPct: round(pct(pnl, invested)),
        dayChange: round(dayChange),
        pe: q?.pe || null,
        beta: q?.beta || null,
        marketCap: q?.marketCap || null,
        dividendYield: q?.dividendYield ?? null,
        yearHigh: q?.yearHigh || null,
        yearLow: q?.yearLow || null,
        nextEarningsDate: q?.nextEarningsDate || null,
        priceAsOf: q?.asOf || null,
      };
    });

    const markets = {};
    for (const code of Object.keys(MARKETS)) {
      const items = holdings.filter(h => h.market === code);
      if (!items.length) continue;
      markets[code] = summarize(items, MARKETS[code].currency);
      for (const h of items) h.weight = round(pct(h.value, markets[code].value));
    }

    // Combined view in INR (US holdings converted at the live USD/INR rate)
    let combined = null;
    if (holdings.length && (!hasUS || usdInr)) {
      const toInr = h => (h.market === "US" ? usdInr : 1);
      const inInr = holdings.map(h => ({
        invested: h.invested * toInr(h),
        value: h.value * toInr(h),
        dayChange: h.dayChange * toInr(h),
      }));
      combined = summarize(inInr, "INR");
      holdings.forEach((h, i) => { h.weightTotal = round(pct(inInr[i].value, combined.value)); });
    }

    let sectors = [];
    if (combined) {
      const bySector = new Map();
      holdings.forEach(h => {
        const v = h.value * (h.market === "US" ? usdInr : 1);
        bySector.set(h.sector, (bySector.get(h.sector) || 0) + v);
      });
      sectors = [...bySector.entries()]
        .map(([sector, value]) => ({ sector, value: round(value), weight: round(pct(value, combined.value)) }))
        .sort((a, b) => b.value - a.value);
    }

    return {
      updatedAt: new Date().toISOString(),
      fx: { USDINR: usdInr },
      quoteError,
      holdings,
      markets,
      combined,
      sectors,
    };
  }

  // English context block for the chat model. Numbers are computed here so the model never does the maths.
  async function buildContext(userId) {
    const snap = await getSnapshot(userId);
    if (!snap.holdings.length) return { empty: true, text: "", snapshot: snap };

    const asOf = new Date(snap.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    const lines = [
      `## The user's portfolio (live prices from CNBC, as of ${asOf} IST)`,
    ];
    if (snap.fx.USDINR) lines.push(`USD/INR rate used for conversion: ${snap.fx.USDINR}`);
    if (snap.quoteError) lines.push(`Warning: live quotes could not be fetched (${snap.quoteError}); holdings are valued at cost.`);

    for (const code of Object.keys(snap.markets)) {
      const m = snap.markets[code];
      lines.push("", `### ${code === "IN" ? "India (NSE, INR)" : "US (NYSE/NASDAQ, USD)"}`);
      lines.push("| Symbol | Name | Sector | Qty | Avg cost | Last price | Day % | Invested | Current value | P&L | P&L % | Weight in market % | P/E | Beta | 52w low–high | Next earnings |");
      lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
      for (const h of snap.holdings.filter(x => x.market === code)) {
        lines.push(`| ${h.symbol} | ${h.name} | ${h.sector} | ${h.quantity} | ${money(h.avg_price, code)} | ${h.priceAvailable ? money(h.price, code) : "unavailable (valued at cost)"} | ${signed(h.changePct, "%")} | ${money(h.invested, code)} | ${money(h.value, code)} | ${money(h.pnl, code)} | ${signed(h.pnlPct, "%")} | ${h.weight ?? "n/a"} | ${h.pe ?? "n/a"} | ${h.beta ?? "n/a"} | ${h.yearLow && h.yearHigh ? `${h.yearLow}–${h.yearHigh}` : "n/a"} | ${h.nextEarningsDate || "n/a"} |`);
      }
      lines.push(`Totals: invested ${money(m.invested, code)}, current value ${money(m.value, code)}, P&L ${money(m.pnl, code)} (${signed(m.pnlPct, "%")}), today ${money(m.dayChange, code)} (${signed(m.dayChangePct, "%")}), ${m.count} holdings.`);
    }

    if (snap.combined) {
      const c = snap.combined;
      lines.push("", "### Whole portfolio in INR");
      lines.push(`Invested ${money(c.invested, "IN")}, current value ${money(c.value, "IN")}, P&L ${money(c.pnl, "IN")} (${signed(c.pnlPct, "%")}), today ${money(c.dayChange, "IN")} (${signed(c.dayChangePct, "%")}).`);
      const byWeight = [...snap.holdings].sort((a, b) => (b.weightTotal || 0) - (a.weightTotal || 0));
      const top3 = byWeight.slice(0, 3).reduce((s, h) => s + (h.weightTotal || 0), 0);
      lines.push(`Largest holding: ${byWeight[0].symbol} at ${byWeight[0].weightTotal}% of the portfolio; top 3 holdings: ${round(top3)}%.`);
      lines.push(`Sector allocation by value: ${snap.sectors.map(s => `${s.sector} ${s.weight}%`).join(", ")}.`);
    }

    const notes = snap.holdings.filter(h => h.notes);
    if (notes.length) {
      lines.push("", "User notes on holdings:");
      notes.forEach(h => lines.push(`- ${h.symbol}: ${h.notes}`));
    }

    return { empty: false, text: lines.join("\n"), snapshot: snap };
  }

  // ── Routes ──────────────────────────────────────────────────────────────────
  const router = express.Router();

  function parseHoldingInput(body, { partial = false } = {}) {
    const out = {};
    if (!partial || body.quantity !== undefined) {
      const q = num(body.quantity);
      if (q == null || q <= 0 || q > 1e9) return { error: "Quantity must be a positive number" };
      out.quantity = q;
    }
    if (!partial || body.avg_price !== undefined) {
      const p = num(body.avg_price);
      if (p == null || p <= 0 || p > 1e9) return { error: "Average price must be a positive number" };
      out.avg_price = p;
    }
    if (body.sector !== undefined && body.sector !== null && body.sector !== "") {
      if (!SECTORS.includes(body.sector)) return { error: "Unknown sector" };
      out.sector = body.sector;
    }
    if (body.notes !== undefined) out.notes = String(body.notes || "").slice(0, 500);
    return { value: out };
  }

  router.get("/", auth, async (req, res) => {
    try {
      ok(res, { ...(await getSnapshot(req.user.user_id)), sectorOptions: SECTORS });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  router.get("/search", auth, async (req, res) => {
    const q = String(req.query.q || "").trim();
    const market = String(req.query.market || "IN").toUpperCase();
    if (!MARKETS[market]) return fail(res, "market must be IN or US");
    if (q.length < 1) return ok(res, []);
    try {
      ok(res, await quotes.searchSymbols(q.slice(0, 40), market));
    } catch (e) {
      fail(res, "Symbol search is unavailable right now", 502);
    }
  });

  router.post("/holdings", auth, async (req, res) => {
    try {
      const userId = req.user.user_id;
      const market = String(req.body.market || "").toUpperCase();
      const symbol = String(req.body.symbol || "").trim().toUpperCase().replace(/-IN$/, "");
      if (!MARKETS[market]) return fail(res, "market must be IN or US");
      if (!SYMBOL_RE.test(symbol)) return fail(res, "Enter a valid ticker symbol");
      const parsed = parseHoldingInput(req.body);
      if (parsed.error) return fail(res, parsed.error);
      const input = parsed.value;

      const existing = await pool.query(
        `SELECT holding_id, sector FROM ai_portfolio_holdings WHERE user_id=$1 AND market=$2 AND symbol=$3`,
        [userId, market, symbol]
      );
      if (!existing.rowCount) {
        const count = await pool.query(`SELECT COUNT(*)::int AS n FROM ai_portfolio_holdings WHERE user_id=$1`, [userId]);
        if (count.rows[0].n >= MAX_HOLDINGS) return fail(res, `A portfolio can hold at most ${MAX_HOLDINGS} positions`);
      }

      // Validate the symbol against the live quote service
      const cnbc = quotes.cnbcSymbol(market, symbol);
      let quote;
      try {
        quote = (await quotes.fetchQuotes([cnbc], { maxAgeMs: 0 })).get(cnbc);
      } catch {
        return fail(res, "Couldn't reach the quote service to verify the symbol. Try again shortly.", 502);
      }
      if (!quote) return fail(res, `${symbol} wasn't found on ${MARKETS[market].exchange}`);

      const sector = input.sector || existing.rows[0]?.sector || await classifySector(quote.name, symbol, market);

      // Adding a symbol that is already held merges the lots at a weighted average cost
      const r = await pool.query(
        `INSERT INTO ai_portfolio_holdings(user_id, market, symbol, name, sector, quantity, avg_price, notes)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (user_id, market, symbol) DO UPDATE SET
           avg_price = (ai_portfolio_holdings.quantity * ai_portfolio_holdings.avg_price + EXCLUDED.quantity * EXCLUDED.avg_price)
                       / (ai_portfolio_holdings.quantity + EXCLUDED.quantity),
           quantity  = ai_portfolio_holdings.quantity + EXCLUDED.quantity,
           name      = EXCLUDED.name,
           notes     = COALESCE(NULLIF(EXCLUDED.notes, ''), ai_portfolio_holdings.notes),
           "updatedAt" = NOW()
         RETURNING holding_id, (xmax = 0) AS inserted`,
        [userId, market, symbol, quote.name, sector, input.quantity, input.avg_price, input.notes || ""]
      );
      const { holding_id, inserted } = r.rows[0];
      ok(res, { holding_id, merged: !inserted }, inserted ? `${symbol} added` : `${symbol} lots merged at weighted average cost`);
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  router.put("/holdings/:id", auth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) return fail(res, "Holding not found", 404);
      const parsed = parseHoldingInput(req.body, { partial: true });
      if (parsed.error) return fail(res, parsed.error);
      const fields = Object.entries(parsed.value);
      if (!fields.length) return fail(res, "Nothing to update");
      const sets = fields.map(([k], i) => `${k}=$${i + 3}`).join(", ");
      const r = await pool.query(
        `UPDATE ai_portfolio_holdings SET ${sets}, "updatedAt"=NOW() WHERE holding_id=$1 AND user_id=$2 RETURNING holding_id`,
        [id, req.user.user_id, ...fields.map(([, v]) => v)]
      );
      if (!r.rowCount) return fail(res, "Holding not found", 404);
      ok(res, null, "Holding updated");
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  router.delete("/holdings/:id", auth, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id)) return fail(res, "Holding not found", 404);
      const r = await pool.query(
        `DELETE FROM ai_portfolio_holdings WHERE holding_id=$1 AND user_id=$2 RETURNING symbol`,
        [id, req.user.user_id]
      );
      if (!r.rowCount) return fail(res, "Holding not found", 404);
      ok(res, null, `${r.rows[0].symbol} removed`);
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  return { initDB, router, buildContext, getSnapshot };
};
