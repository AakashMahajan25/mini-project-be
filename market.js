"use strict";

// Live market dashboard: top movers from CNBC quotes, trending tickers from news mentions,
// and an hourly AI market summary built only from stored headlines (each point cites its articles).
// Also serves the legacy dashboard endpoints (/stocks/trending, /stocks/fetchTrendingStocksFromAI,
// /stocks/getTrendingDashboardData) with live data in the shapes the webapp already renders.

const express = require("express");
const { EventEmitter } = require("events");

const SUMMARY_MODEL     = process.env.MARKET_AI_MODEL || "gpt-4.1-mini";
const MOVERS_REFRESH_MS = 15 * 60 * 1000;
const SUMMARY_TTL_MS    = 60 * 60 * 1000;
const SUMMARY_HEADLINES = 60;

// Large-cap universe for movers (validated against CNBC on 2026-11-25)
const UNIVERSE = {
  IN: ("RELIANCE TCS HDFCBANK ICICIBANK INFY SBIN BHARTIARTL ITC LT HINDUNILVR BAJFINANCE KOTAKBANK AXISBANK MARUTI " +
       "SUNPHARMA HCLTECH WIPRO NTPC POWERGRID ADANIENT ADANIPORTS TMPV M&M NESTLEIND BRITANNIA BAJAJFINSV TITAN " +
       "ULTRACEMCO ASIANPAINT TATASTEEL JSWSTEEL ONGC COALINDIA TECHM DRREDDY CIPLA ETERNAL TRENT BEL HINDALCO GRASIM " +
       "EICHERMOT HEROMOTOCO APOLLOHOSP JIOFIN SHRIRAMFIN TATACONSUM SBILIFE HDFCLIFE INDUSINDBK BAJAJ-AUTO").split(" "),
  US: ("AAPL MSFT NVDA GOOGL AMZN META AVGO AMD INTC TSM BRK.B JPM BAC MA V PG KO PEP COST JNJ LLY PFE TSLA NFLX ORCL " +
       "CRM XOM CVX WMT UNH HD ABBV MRK ADBE QCOM CSCO DIS NKE BA GS").split(" "),
};
const INDICES = {
  IN: [{ symbol: ".NSEI", label: "NIFTY 50" }, { symbol: ".NSEBANK", label: "NIFTY BANK" }],
  US: [{ symbol: ".SPX", label: "S&P 500" }, { symbol: ".IXIC", label: "NASDAQ" }, { symbol: ".DJI", label: "DOW" }],
};

const SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["drivers", "points"],
  properties: {
    drivers: { type: "string" },
    points: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "summary", "article_ids"],
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          article_ids: { type: "array", items: { type: "integer" } },
        },
      },
    },
  },
};

const marketOf = (q) => ((q.market || "IN").toUpperCase() === "US" ? "US" : "IN");
const pctText = (n) => `${n > 0 ? "+" : ""}${Number(n || 0).toFixed(2)}%`;

function ago(date) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} hour${hours > 1 ? "s" : ""} ago` : `${Math.round(hours / 24)} days ago`;
}

module.exports = function createMarket({ pool, openai, quotes, auth, ok, fail }) {
  const events = new EventEmitter();
  const movers = { IN: null, US: null };
  const generating = { IN: false, US: false };

  async function initDB() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_summaries (
        id            SERIAL PRIMARY KEY,
        market        TEXT NOT NULL,
        drivers       TEXT NOT NULL,
        points        JSONB NOT NULL,
        model         TEXT,
        article_count INT,
        generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS market_summaries_market_idx ON market_summaries(market, generated_at DESC);
    `);
    console.log("✅ Market tables ready");
  }

  // ─── Movers ─────────────────────────────────────────────────────────────────
  async function refreshMovers() {
    for (const market of ["IN", "US"]) {
      try {
        const symbols = [...UNIVERSE[market].map(t => quotes.cnbcSymbol(market, t)), ...INDICES[market].map(i => i.symbol)];
        const bySymbol = await quotes.fetchQuotes(symbols, { maxAgeMs: 0 });
        const stocks = UNIVERSE[market].map(ticker => {
          const q = bySymbol.get(quotes.cnbcSymbol(market, ticker));
          return q && { ticker, name: q.name, price: q.price, change: q.change, change_pct: q.changePct, currency: q.currency, as_of: q.asOf };
        }).filter(Boolean);
        const indices = INDICES[market].map(i => {
          const q = bySymbol.get(i.symbol);
          return q && { symbol: i.symbol, label: i.label, price: q.price, change: q.change, change_pct: q.changePct, as_of: q.asOf };
        }).filter(Boolean);
        if (!stocks.length) throw new Error("no quotes");
        const sorted = [...stocks].sort((a, b) => b.change_pct - a.change_pct);
        movers[market] = {
          stocks,
          indices,
          gainers: sorted.filter(s => s.change_pct > 0).slice(0, 5),
          losers: sorted.filter(s => s.change_pct < 0).reverse().slice(0, 5),
          breadth: {
            advancing: stocks.filter(s => s.change_pct > 0).length,
            declining: stocks.filter(s => s.change_pct < 0).length,
            unchanged: stocks.filter(s => s.change_pct === 0).length,
          },
          updated_at: new Date().toISOString(),
        };
        events.emit("movers", { market, updated_at: movers[market].updated_at });
      } catch (e) {
        console.error(`Movers refresh (${market}) failed:`, e.message);
      }
    }
  }

  // ─── News-driven trending ───────────────────────────────────────────────────
  async function newsTrending(market, limit = 10) {
    const { rows } = await pool.query(
      `WITH m AS (
         SELECT t AS ticker, n.id, n.title, n.link, n.source, n.published_at, n.sentiment
         FROM news_articles n, unnest(n.tickers) AS t
         WHERE n.market = $1 AND n.published_at > NOW() - INTERVAL '24 hours')
       SELECT ticker, COUNT(*)::int AS mentions,
              COUNT(*) FILTER (WHERE sentiment='Bullish')::int AS bullish,
              COUNT(*) FILTER (WHERE sentiment='Bearish')::int AS bearish,
              (ARRAY_AGG(json_build_object('id', id, 'title', title, 'link', link, 'source', source, 'published_at', published_at)
                 ORDER BY published_at DESC))[1] AS headline
       FROM m GROUP BY ticker ORDER BY mentions DESC, MAX(published_at) DESC LIMIT $2`,
      [market, limit]
    );
    if (!rows.length) return [];
    const bySymbol = await quotes.fetchQuotes(rows.map(r => quotes.cnbcSymbol(market, r.ticker))).catch(() => new Map());
    return rows.map(r => {
      const q = bySymbol.get(quotes.cnbcSymbol(market, r.ticker));
      const net = r.bullish - r.bearish;
      return {
        ticker: r.ticker,
        name: q?.name || r.ticker,
        mentions: r.mentions,
        sentiment: net > 0 ? "Bullish" : net < 0 ? "Bearish" : "Neutral",
        bullish: r.bullish,
        bearish: r.bearish,
        price: q?.price ?? null,
        change_pct: q?.changePct ?? null,
        currency: q?.currency || null,
        headline: r.headline,
      };
    });
  }

  async function latestHeadlineFor(market, tickers) {
    if (!tickers.length) return new Map();
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (t) t AS ticker, n.title, n.link, n.source, n.published_at
       FROM news_articles n, unnest(n.tickers) AS t
       WHERE n.market=$1 AND t = ANY($2::text[]) AND n.published_at > NOW() - INTERVAL '3 days'
       ORDER BY t, n.published_at DESC`,
      [market, tickers]
    );
    return new Map(rows.map(r => [r.ticker, r]));
  }

  // ─── AI market summary ──────────────────────────────────────────────────────
  async function generateSummary(market, { force = false } = {}) {
    if (generating[market] || !process.env.OPENAI_API_KEY) return null;
    const { rows: [last] } = await pool.query(`SELECT generated_at FROM market_summaries WHERE market=$1 ORDER BY generated_at DESC LIMIT 1`, [market]);
    if (!force && last && Date.now() - new Date(last.generated_at).getTime() < SUMMARY_TTL_MS) return null;
    generating[market] = true;
    try {
      const { rows: articles } = await pool.query(
        `SELECT id, title, summary, source, published_at, sentiment, tickers FROM news_articles
         WHERE market=$1 AND published_at > NOW() - INTERVAL '24 hours' ORDER BY published_at DESC LIMIT $2`,
        [market, SUMMARY_HEADLINES]
      );
      if (articles.length < 5) return null;
      const m = movers[market];
      const marketData = m ? {
        indices: m.indices.map(i => `${i.label} ${pctText(i.change_pct)}`),
        breadth: m.breadth,
        top_gainers: m.gainers.slice(0, 3).map(s => `${s.ticker} ${pctText(s.change_pct)}`),
        top_losers: m.losers.slice(0, 3).map(s => `${s.ticker} ${pctText(s.change_pct)}`),
        as_of: m.updated_at,
      } : null;
      const completion = await openai.chat.completions.create({
        model: SUMMARY_MODEL,
        temperature: 0.2,
        response_format: { type: "json_schema", json_schema: { name: "market_summary", strict: true, schema: SUMMARY_SCHEMA } },
        messages: [
          {
            role: "system",
            content: `You write the ${market === "IN" ? "Indian" : "US"} market summary for an investor dashboard, using ONLY the headlines and market data provided.
- drivers: 3-4 sentences on what is moving the market today.
- points: 4-6 key themes. Each has a short title, a 1-2 sentence summary, and article_ids = the ids of the headlines it is based on (at least one).
- Do not invent facts, numbers or events that are not in the input. Do not recommend buying or selling anything.`,
          },
          { role: "user", content: JSON.stringify({ market_data: marketData, headlines: articles.map(a => ({ id: a.id, title: a.title, summary: a.summary, source: a.source, published_at: a.published_at, sentiment: a.sentiment, tickers: a.tickers })) }) },
        ],
      });
      const out = JSON.parse(completion.choices[0].message.content);
      const byId = new Map(articles.map(a => [a.id, a]));
      const points = (out.points || []).map(p => ({
        title: p.title,
        summary: p.summary,
        sources: [...new Set(p.article_ids)].map(id => byId.get(id)).filter(Boolean)
          .map(a => ({ id: a.id, title: a.title, source: a.source, published_at: a.published_at })),
      })).filter(p => p.sources.length); // a point with no real source is dropped
      if (!points.length) throw new Error("summary had no sourced points");
      await pool.query(
        `INSERT INTO market_summaries(market, drivers, points, model, article_count) VALUES($1,$2,$3,$4,$5)`,
        [market, out.drivers, JSON.stringify(points), SUMMARY_MODEL, articles.length]
      );
      await pool.query(`DELETE FROM market_summaries WHERE market=$1 AND generated_at < NOW() - INTERVAL '7 days'`, [market]);
      events.emit("summary", { market });
      console.log(`🗞️   Market summary (${market}) generated from ${articles.length} headlines`);
      return true;
    } catch (e) {
      console.error(`Market summary (${market}) failed:`, e.message);
      return null;
    } finally {
      generating[market] = false;
    }
  }

  // Latest stored summary, or a headline digest when no AI summary exists yet
  async function getSummary(market) {
    const { rows: [s] } = await pool.query(`SELECT * FROM market_summaries WHERE market=$1 ORDER BY generated_at DESC LIMIT 1`, [market]);
    const ids = s ? [...new Set(s.points.flatMap(p => p.sources.map(x => x.id)))] : [];
    const links = ids.length ? new Map((await pool.query(`SELECT id, link FROM news_articles WHERE id = ANY($1::int[])`, [ids])).rows.map(r => [r.id, r.link])) : new Map();
    if (s) {
      return {
        generated_by: "ai",
        model: s.model,
        generated_at: s.generated_at,
        article_count: s.article_count,
        drivers: s.drivers,
        points: s.points.map(p => ({ ...p, sources: p.sources.map(x => ({ ...x, link: links.get(x.id) || null })) })),
      };
    }
    const { rows } = await pool.query(
      `SELECT id, title, summary, source, link, published_at, sentiment FROM news_articles
       WHERE market=$1 ORDER BY published_at DESC LIMIT 6`,
      [market]
    );
    const mood = await pool.query(
      `SELECT sentiment, COUNT(*)::int AS n FROM news_articles WHERE market=$1 AND published_at > NOW() - INTERVAL '24 hours' AND sentiment IS NOT NULL GROUP BY sentiment`,
      [market]
    );
    const count = (k) => mood.rows.find(r => r.sentiment === k)?.n || 0;
    const total = mood.rows.reduce((n, r) => n + r.n, 0);
    return {
      generated_by: "headlines",
      generated_at: new Date().toISOString(),
      article_count: rows.length,
      drivers: total
        ? `Of ${total} tagged headlines in the last 24 hours, ${count("Bullish")} lean bullish, ${count("Bearish")} bearish and ${count("Neutral")} neutral. The latest stories are listed below.`
        : "The latest market headlines are listed below.",
      points: rows.map(a => ({
        title: a.title,
        summary: a.summary || "",
        sources: [{ id: a.id, title: a.title, source: a.source, link: a.link, published_at: a.published_at }],
      })),
    };
  }

  async function overview(market) {
    const [trending, summary, mood] = await Promise.all([
      newsTrending(market),
      getSummary(market),
      pool.query(
        `SELECT sentiment, COUNT(*)::int AS count FROM news_articles
         WHERE market=$1 AND sentiment IS NOT NULL AND published_at > NOW() - INTERVAL '24 hours' GROUP BY sentiment`,
        [market]
      ),
    ]);
    const m = movers[market];
    return {
      market,
      indices: m?.indices || [],
      gainers: m?.gainers || [],
      losers: m?.losers || [],
      breadth: m?.breadth || null,
      movers_updated_at: m?.updated_at || null,
      trending,
      mood: Object.fromEntries(["Bullish", "Neutral", "Bearish"].map(s => [s, mood.rows.find(r => r.sentiment === s)?.count || 0])),
      summary,
    };
  }

  // Legacy card shape: { name, stock_ticker, stock_relevance, reason, ... }
  async function legacyTrending(market) {
    const trending = await newsTrending(market, 10);
    const cards = trending.map(t => ({
      name: t.name,
      stock_ticker: t.ticker,
      stock_relevance: t.change_pct != null ? pctText(t.change_pct) : `${t.mentions} stories`,
      reason: t.headline?.title || `${t.mentions} news mentions today`,
      mentions: t.mentions,
      sentiment: t.sentiment,
      source_url: t.headline?.link || null,
      source_date: t.headline?.published_at || null,
    }));
    const seen = new Set(cards.map(c => c.stock_ticker));
    const fill = [...(movers[market]?.stocks || [])].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
      .filter(s => !seen.has(s.ticker)).slice(0, Math.max(0, 10 - cards.length));
    const headlines = await latestHeadlineFor(market, fill.map(s => s.ticker));
    return [...cards, ...fill.map(s => ({
      name: s.name,
      stock_ticker: s.ticker,
      stock_relevance: pctText(s.change_pct),
      reason: headlines.get(s.ticker)?.title || `${s.change_pct >= 0 ? "Up" : "Down"} ${Math.abs(s.change_pct).toFixed(2)}% today`,
      source_url: headlines.get(s.ticker)?.link || null,
      source_date: headlines.get(s.ticker)?.published_at || null,
    }))];
  }

  async function legacyStandout(market) {
    const m = movers[market];
    if (!m) return [];
    const picks = [...m.gainers.slice(0, 5), ...m.losers.slice(0, 5)];
    const headlines = await latestHeadlineFor(market, picks.map(s => s.ticker));
    return picks.map(s => ({
      name: s.name,
      stock_ticker: s.ticker,
      stock_relevance: pctText(s.change_pct),
      reason: headlines.get(s.ticker)?.title || `${s.change_pct >= 0 ? "Among today's top gainers" : "Among today's top losers"} (${pctText(s.change_pct)})`,
      price: s.price,
      source_url: headlines.get(s.ticker)?.link || null,
      source_date: headlines.get(s.ticker)?.published_at || null,
    }));
  }

  function start() {
    refreshMovers().then(() => Promise.all(["IN", "US"].map(mk => generateSummary(mk))));
    setInterval(refreshMovers, MOVERS_REFRESH_MS);
  }

  // Called after each news refresh
  function onNews() {
    ["IN", "US"].forEach(mk => generateSummary(mk));
  }

  // ─── Routes ─────────────────────────────────────────────────────────────────
  const router = express.Router();

  router.get("/overview", auth, async (req, res) => {
    try { ok(res, await overview(marketOf(req.query))); } catch (e) { fail(res, e.message, 500); }
  });
  router.get("/movers", auth, (req, res) => {
    const m = movers[marketOf(req.query)];
    if (!m) return fail(res, "Market data not available yet", 503);
    ok(res, m);
  });
  router.get("/trending", auth, async (req, res) => {
    try { ok(res, await newsTrending(marketOf(req.query), Math.min(Number(req.query.limit) || 10, 25))); } catch (e) { fail(res, e.message, 500); }
  });
  router.get("/summary", auth, async (req, res) => {
    try { ok(res, await getSummary(marketOf(req.query))); } catch (e) { fail(res, e.message, 500); }
  });

  const legacyRouter = express.Router();
  legacyRouter.get("/trending", auth, async (req, res) => {
    try { ok(res, await legacyTrending(marketOf(req.query))); } catch (e) { fail(res, e.message, 500); }
  });
  legacyRouter.get("/fetchTrendingStocksFromAI", auth, async (req, res) => {
    try { ok(res, await legacyStandout(marketOf(req.query))); } catch (e) { fail(res, e.message, 500); }
  });
  legacyRouter.get("/getTrendingDashboardData", auth, async (req, res) => {
    try {
      const s = await getSummary(marketOf(req.query));
      ok(res, {
        data: [{
          data: {
            last_updated_utc: new Date(s.generated_at).toISOString(),
            generated_by: s.generated_by,
            market_drivers: { summary: s.drivers },
            market_summary: {
              summary_points: s.points.map(p => ({
                title: p.title,
                summary: p.summary,
                age: p.sources[0]?.published_at ? ago(p.sources[0].published_at) : undefined,
                sources: p.sources,
              })),
            },
          },
        }],
      });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  return { initDB, start, onNews, refreshMovers, generateSummary, overview, events, router, legacyRouter };
};
