"use strict";

const express = require("express");
const Parser = require("rss-parser");

// ─── Feed sources ─────────────────────────────────────────────────────────────
const FEEDS = [
  { market: "IN", source: "Economic Times",    category: "Markets",  url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
  { market: "IN", source: "Economic Times",    category: "Stocks",   url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms" },
  { market: "IN", source: "Economic Times",    category: "Economy",  url: "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms" },
  { market: "IN", source: "Business Standard", category: "Markets",  url: "https://www.business-standard.com/rss/markets-106.rss" },
  { market: "IN", source: "Business Standard", category: "Economy",  url: "https://www.business-standard.com/rss/economy-102.rss" },
  { market: "IN", source: "Mint",              category: "Markets",  url: "https://www.livemint.com/rss/markets" },
  { market: "IN", source: "Mint",              category: "Business", url: "https://www.livemint.com/rss/companies" },
  { market: "IN", source: "Mint",              category: "Economy",  url: "https://www.livemint.com/rss/economy" },
  { market: "IN", source: "BusinessLine",      category: "Markets",  url: "https://www.thehindubusinessline.com/markets/feeder/default.rss" },

  { market: "US", source: "CNBC",              category: "Business", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { market: "US", source: "CNBC",              category: "Stocks",   url: "https://www.cnbc.com/id/15839069/device/rss/rss.html" },
  { market: "US", source: "CNBC",              category: "Economy",  url: "https://www.cnbc.com/id/20910258/device/rss/rss.html" },
  { market: "US", source: "CNBC",              category: "Business", url: "https://www.cnbc.com/id/10001147/device/rss/rss.html" },
  { market: "US", source: "CNBC",              category: "Tech",     url: "https://www.cnbc.com/id/19854910/device/rss/rss.html" },
  { market: "US", source: "MarketWatch",       category: "Markets",  url: "https://feeds.content.dowjones.io/public/rss/mw_topstories" },
  { market: "US", source: "WSJ",               category: "Markets",  url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain" },
  { market: "US", source: "Nasdaq",            category: "Markets",  url: "https://www.nasdaq.com/feed/rssoutbound?category=Markets" },
  { market: "US", source: "Seeking Alpha",     category: "Stocks",   url: "https://seekingalpha.com/market_currents.xml" },
  { market: "US", source: "Investing.com",     category: "Markets",  url: "https://www.investing.com/rss/news_25.rss" },
];

const CATEGORIES = ["Markets", "Stocks", "Economy", "Business", "Tech"];
const SENTIMENTS = ["Bullish", "Neutral", "Bearish"];
const EXCHANGES  = ["NSE", "BSE", "NYSE", "NASDAQ", "OTHER", "PRIVATE"];
// Only tickers tradable on the article's own market are kept
const MARKET_EXCHANGES = { IN: ["NSE", "BSE"], US: ["NYSE", "NASDAQ"] };

const REFRESH_MS     = 10 * 60 * 1000;
const RETENTION_DAYS = 7;
const ENRICH_LIMIT   = 600; // max articles tagged per refresh cycle
const ENRICH_BATCH   = 20;
const NEWS_AI_MODEL  = process.env.NEWS_AI_MODEL || "gpt-4.1-mini";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" },
  customFields: { item: [["media:content", "mediaContent"], ["media:thumbnail", "mediaThumbnail"]] },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeLink(link) {
  try {
    const u = new URL(link.trim());
    u.hash = "";
    [...u.searchParams.keys()].filter(k => k.startsWith("utm_")).forEach(k => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return null;
  }
}

function pickImage(item) {
  const media = [].concat(item.mediaContent || [], item.mediaThumbnail || []);
  for (const m of media) {
    const url = m?.$?.url;
    if (url && (!m.$.medium || m.$.medium === "image")) return url;
  }
  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith("image"))) return item.enclosure.url;
  return null;
}

const NAMED_ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };

// Some feeds double-encode, leaving entities like &quot; in the parsed text
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return NAMED_ENTITIES[e.toLowerCase()] ?? m;
  });
}

function cleanText(text = "", max = 400) {
  const t = decodeEntities(text.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

function toDate(item) {
  const d = new Date(item.isoDate || item.pubDate || Date.now());
  if (isNaN(d) || d > new Date(Date.now() + 5 * 60 * 1000)) return new Date();
  return d;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function encodeCursor(row) {
  return `${new Date(row.published_at).toISOString()}|${row.id}`;
}

function decodeCursor(cursor) {
  const [iso, id] = String(cursor || "").split("|");
  const d = new Date(iso);
  return iso && id && !isNaN(d) && Number(id) ? { publishedAt: d.toISOString(), id: Number(id) } : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
module.exports = function createNews({ pool, openai, auth, ok, fail }) {
  let lastRefreshAt = null;
  let refreshing = false;

  async function initDB() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id           SERIAL PRIMARY KEY,
        market       TEXT NOT NULL,
        category     TEXT,
        source       TEXT,
        title        TEXT NOT NULL,
        link         TEXT UNIQUE NOT NULL,
        summary      TEXT,
        image_url    TEXT,
        published_at TIMESTAMPTZ NOT NULL,
        sentiment    TEXT,
        tickers      TEXT[] DEFAULT '{}',
        "createdAt"  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS news_articles_market_pub_idx ON news_articles(market, published_at DESC, id DESC);
    `);
    console.log("✅ News table ready");
  }

  async function ingestFeed(feed) {
    const parsed = await parser.parseURL(feed.url);
    const seen = new Set();
    const rows = [];
    for (const item of parsed.items || []) {
      const link = item.link && normalizeLink(item.link);
      const title = cleanText(item.title || "", 300);
      if (!link || !title || seen.has(link)) continue;
      seen.add(link);
      rows.push([feed.market, feed.category, feed.source, title, link,
        cleanText(item.contentSnippet || item.content || item.summary || ""), pickImage(item), toDate(item).toISOString()]);
    }
    if (!rows.length) return 0;
    const cols = rows[0].map((_, i) => rows.map(r => r[i]));
    const r = await pool.query(
      `INSERT INTO news_articles(market, category, source, title, link, summary, image_url, published_at)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::timestamptz[])
       ON CONFLICT (link) DO NOTHING`,
      cols
    );
    return r.rowCount;
  }

  // Tags untagged articles with sentiment + tickers in small batches
  async function enrichPending() {
    if (!process.env.OPENAI_API_KEY) return 0;
    const { rows } = await pool.query(
      `SELECT id, market, title, summary FROM news_articles
       WHERE sentiment IS NULL ORDER BY published_at DESC LIMIT $1`,
      [ENRICH_LIMIT]
    );
    let tagged = 0;
    for (const batch of chunk(rows, ENRICH_BATCH)) {
      const completion = await openai.chat.completions.create({
        model: NEWS_AI_MODEL,
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "news_tags",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "sentiment", "companies"],
                    properties: {
                      id:        { type: "integer" },
                      sentiment: { type: "string", enum: SENTIMENTS },
                      companies: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          required: ["ticker", "exchange"],
                          properties: {
                            ticker:   { type: "string" },
                            exchange: { type: "string", enum: EXCHANGES },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You tag financial news headlines for investors. For each article return: " +
              "sentiment = the likely short-term market/stock impact (Bullish, Bearish, or Neutral when mixed, informational, or unclear); " +
              "companies = up to 3 companies the article is primarily about, each with its stock ticker and primary listing exchange. " +
              "For companies listed in India use the NSE symbol (e.g. RELIANCE, TCS, HDFCBANK) with exchange NSE (or BSE if only BSE-listed). " +
              "For US-listed companies use the NYSE/NASDAQ ticker (e.g. AAPL, NVDA). " +
              "Use OTHER for companies whose primary listing is elsewhere (e.g. Carlsberg, Samsung, Pernod Ricard) and PRIVATE for unlisted ones (e.g. OpenAI, Binance). " +
              "Never include indices, sectors, currencies, or commodities. Return an empty list when no specific company is the focus.",
          },
          { role: "user", content: JSON.stringify(batch.map(a => ({ id: a.id, market: a.market, title: a.title, summary: a.summary }))) },
        ],
      });
      const items = JSON.parse(completion.choices[0].message.content).items || [];
      const byId = new Map(items.map(i => [i.id, i]));
      // Articles the model skipped default to Neutral so they aren't retried forever
      const ids = batch.map(a => a.id);
      const sentiments = ids.map(id => (SENTIMENTS.includes(byId.get(id)?.sentiment) ? byId.get(id).sentiment : "Neutral"));
      const tickers = batch.map(a =>
        JSON.stringify([...new Set((byId.get(a.id)?.companies || [])
          .filter(c => MARKET_EXCHANGES[a.market].includes(c.exchange))
          .map(c => String(c.ticker).toUpperCase().trim())
          .filter(Boolean))].slice(0, 3))
      );
      await pool.query(
        `UPDATE news_articles n SET sentiment = u.sentiment,
           tickers = ARRAY(SELECT jsonb_array_elements_text(u.tickers::jsonb))
         FROM unnest($1::int[], $2::text[], $3::text[]) AS u(id, sentiment, tickers)
         WHERE n.id = u.id`,
        [ids, sentiments, tickers]
      );
      tagged += ids.length;
    }
    return tagged;
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const results = await Promise.allSettled(FEEDS.map(ingestFeed));
      const added = results.reduce((n, r) => n + (r.status === "fulfilled" ? r.value : 0), 0);
      const failed = results
        .map((r, i) => (r.status === "rejected" ? `${FEEDS[i].source}/${FEEDS[i].category} (${r.reason?.message})` : null))
        .filter(Boolean);
      await pool.query(`DELETE FROM news_articles WHERE published_at < NOW() - make_interval(days => $1)`, [RETENTION_DAYS]);
      lastRefreshAt = new Date();
      console.log(`📰  News refresh: +${added} articles${failed.length ? `, ${failed.length} feeds failed: ${failed.join("; ")}` : ""}`);

      try {
        const tagged = await enrichPending();
        if (tagged) console.log(`🏷️   News tagged: ${tagged} articles`);
      } catch (e) {
        console.error("News tagging failed:", e.message);
      }
    } catch (e) {
      console.error("News refresh failed:", e.message);
    } finally {
      refreshing = false;
    }
  }

  function start() {
    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  // ─── Routes ─────────────────────────────────────────────────────────────────
  const router = express.Router();

  router.get("/feed", auth, async (req, res) => {
    try {
      const market    = (req.query.market || "IN").toUpperCase() === "US" ? "US" : "IN";
      const category  = CATEGORIES.includes(req.query.category) ? req.query.category : null;
      const sentiment = SENTIMENTS.includes(req.query.sentiment) ? req.query.sentiment : null;
      const q         = String(req.query.q || "").trim().slice(0, 100) || null;
      const cursor    = decodeCursor(req.query.cursor);
      const limit     = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);

      const r = await pool.query(
        `SELECT id, market, category, source, title, link, summary, image_url, published_at, sentiment, tickers
         FROM news_articles
         WHERE market = $1
           AND ($2::text IS NULL OR category = $2)
           AND ($3::text IS NULL OR sentiment = $3)
           AND ($4::text IS NULL OR title ILIKE '%' || $4 || '%' OR summary ILIKE '%' || $4 || '%' OR UPPER($4) = ANY(tickers))
           AND ($5::timestamptz IS NULL OR (published_at, id) < ($5, $6::int))
         ORDER BY published_at DESC, id DESC
         LIMIT $7`,
        [market, category, sentiment, q, cursor?.publishedAt || null, cursor?.id || null, limit + 1]
      );
      const hasMore = r.rows.length > limit;
      const articles = r.rows.slice(0, limit);
      ok(res, {
        articles,
        nextCursor: hasMore ? encodeCursor(articles[articles.length - 1]) : null,
        categories: CATEGORIES.filter(c => FEEDS.some(f => f.market === market && f.category === c)),
        lastUpdated: lastRefreshAt,
      });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  // Last-24h sentiment mix and most-mentioned tickers for a market
  router.get("/insights", auth, async (req, res) => {
    try {
      const market = (req.query.market || "IN").toUpperCase() === "US" ? "US" : "IN";
      const [mood, tickers] = await Promise.all([
        pool.query(
          `SELECT sentiment, COUNT(*)::int AS count FROM news_articles
           WHERE market = $1 AND sentiment IS NOT NULL AND published_at > NOW() - INTERVAL '24 hours'
           GROUP BY sentiment`,
          [market]
        ),
        pool.query(
          `SELECT t AS ticker, COUNT(*)::int AS count FROM news_articles, unnest(tickers) AS t
           WHERE market = $1 AND published_at > NOW() - INTERVAL '24 hours'
           GROUP BY t ORDER BY count DESC, t LIMIT 10`,
          [market]
        ),
      ]);
      ok(res, {
        mood: Object.fromEntries(SENTIMENTS.map(s => [s, mood.rows.find(m => m.sentiment === s)?.count || 0])),
        trendingTickers: tickers.rows,
      });
    } catch (e) {
      fail(res, e.message, 500);
    }
  });

  return { initDB, start, router };
};
