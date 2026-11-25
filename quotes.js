"use strict";

const express = require("express");

// ─── Ticker symbols (CNBC quote symbols) ──────────────────────────────────────
const SYMBOLS = [
  { symbol: ".NSEI",          label: "NIFTY 50",   market: "IN", type: "index" },
  { symbol: ".NSEBANK",       label: "NIFTY BANK", market: "IN", type: "index" },
  ...["RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN", "BHARTIARTL", "ITC", "LT",
      "HINDUNILVR", "BAJFINANCE", "KOTAKBANK", "AXISBANK", "MARUTI", "SUNPHARMA"]
    .map(t => ({ symbol: `${t}-IN`, label: t, market: "IN", type: "stock" })),

  { symbol: ".SPX",           label: "S&P 500",    market: "US", type: "index" },
  { symbol: ".IXIC",          label: "NASDAQ",     market: "US", type: "index" },
  { symbol: ".DJI",           label: "DOW",        market: "US", type: "index" },
  ...["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "JPM", "BRK.B", "LLY", "V"]
    .map(t => ({ symbol: t, label: t, market: "US", type: "stock" })),
];

const REFRESH_MS   = 60 * 60 * 1000;
const QUOTE_TTL_MS = 5 * 60 * 1000;   // on-demand quotes (portfolio) are reused for 5 min
const QUOTE_BATCH  = 40;
const QUOTE_URL    = "https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol";
const LOOKUP_URL   = "https://symlookup.cnbc.com/symservice/symlookup.do";
const USER_AGENT   = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

// Exchanges a holding may come from, per market
const LOOKUP_EXCHANGES = {
  IN: ["National Stock Exchange of India"],
  US: ["NASDAQ", "New York Stock Exchange", "NYSE", "NYSE Arca", "NYSE American", "Cboe BZX"],
};

// CNBC formats numbers as strings: "1,164.90", "+0.53", "-1.82%", "UNCH"
function toNumber(value) {
  if (value == null || value === "UNCH") return 0;
  const n = parseFloat(String(value).replace(/[,%+]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Display symbol (RELIANCE / AAPL) + market → CNBC symbol (RELIANCE-IN / AAPL)
function cnbcSymbol(market, symbol) {
  return market === "IN" ? `${symbol}-IN` : symbol;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function parseQuote(q) {
  const price = toNumber(q.last);
  if (!price) return null;
  return {
    symbol: q.symbol,
    name: q.name || q.shortName || q.symbol,
    exchange: q.exchange || null,
    price,
    change: toNumber(q.change) || 0,
    changePct: toNumber(q.change_pct) || 0,
    previousClose: toNumber(q.previous_day_closing),
    currency: q.currencyCode || null,
    pe: toNumber(q.pe),
    beta: toNumber(q.beta),
    marketCap: q.mktcapView || null,
    dividendYield: toNumber(q.dividendyield),
    yearHigh: toNumber(q.yrhiprice),
    yearLow: toNumber(q.yrloprice),
    nextEarningsDate: q.EventData?.next_earnings_date || null,
    asOf: q.last_time || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
module.exports = function createQuotes({ auth, ok, fail }) {
  let cache = { quotes: [], updatedAt: null };
  const quoteCache = new Map(); // CNBC symbol → { quote, fetchedAt }

  async function requestQuotes(symbols) {
    const params = new URLSearchParams({
      symbols: symbols.join("|"),
      requestMethod: "itv", noform: "1", partnerId: "2", fund: "1", exthrs: "1", output: "json", events: "1",
    });
    const res = await fetch(`${QUOTE_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return [].concat(body?.FormattedQuoteResult?.FormattedQuote || []);
  }

  // Returns Map(CNBC symbol → parsed quote) for every symbol CNBC knows; unknown symbols are absent
  async function fetchQuotes(symbols, { maxAgeMs = QUOTE_TTL_MS } = {}) {
    const unique = [...new Set(symbols)];
    const now = Date.now();
    const result = new Map();
    const stale = [];
    for (const s of unique) {
      const hit = quoteCache.get(s);
      if (hit && now - hit.fetchedAt < maxAgeMs) {
        if (hit.quote) result.set(s, hit.quote);
      } else {
        stale.push(s);
      }
    }
    for (const batch of chunk(stale, QUOTE_BATCH)) {
      const raw = await requestQuotes(batch);
      const bySymbol = new Map(raw.filter(q => q.code === 0).map(q => [q.symbol, parseQuote(q)]));
      for (const s of batch) {
        const quote = bySymbol.get(s) || null;
        quoteCache.set(s, { quote, fetchedAt: now });
        if (quote) result.set(s, quote);
      }
    }
    return result;
  }

  async function searchSymbols(query, market) {
    const params = new URLSearchParams({ prefix: query, partnerid: "20064", pgok: "1", pgsize: "40" });
    const res = await fetch(`${LOOKUP_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()).slice(1); // first row is result metadata
    const exchanges = LOOKUP_EXCHANGES[market] || [];
    const seen = new Set();
    return rows
      .filter(r => r.countryCode === market && exchanges.includes(r.exchangeName))
      .map(r => ({
        symbol: market === "IN" ? String(r.symbolName).replace(/-IN$/, "") : r.symbolName,
        name: r.companyName,
        exchange: r.exchangeName,
        type: r.issueType,
      }))
      .filter(r => r.symbol && !seen.has(r.symbol) && seen.add(r.symbol))
      .slice(0, 10);
  }

  async function refresh() {
    try {
      const bySymbol = await fetchQuotes(SYMBOLS.map(s => s.symbol), { maxAgeMs: 0 });
      const quotes = SYMBOLS.map(s => {
        const q = bySymbol.get(s.symbol);
        if (!q) return null;
        return {
          ...s,
          price: q.price,
          change: q.change,
          changePct: q.changePct,
          currency: q.currency || (s.market === "IN" ? "INR" : "USD"),
        };
      }).filter(Boolean);

      if (!quotes.length) throw new Error("no quotes returned");
      cache = { quotes, updatedAt: new Date() };
      console.log(`📈  Ticker refresh: ${quotes.length}/${SYMBOLS.length} quotes`);
    } catch (e) {
      // Keep serving the last good quotes; with nothing cached yet, retry soon instead of in an hour
      console.error("Ticker refresh failed:", e.message);
      if (!cache.quotes.length) setTimeout(refresh, 2 * 60 * 1000);
    }
  }

  function start() {
    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  const router = express.Router();

  router.get("/ticker", auth, (req, res) => {
    if (!cache.quotes.length) return fail(res, "Quotes not available yet", 503);
    ok(res, cache);
  });

  return { start, router, fetchQuotes, searchSymbols, cnbcSymbol };
};
