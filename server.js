"use strict";

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const OpenAI = require("openai");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "frruit_secret";

const pool = new Pool({ connectionString: process.env.POSTGRES_URI });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendOtpEmail(email, otp) {
  await mailer.sendMail({
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: "Your Frruit OTP",
    html: `<p>Your one-time password is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
}

// OTPs stored in memory: email → { otp, expiresAt }
const otpStore = new Map();

// ─── DB Init ──────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_users (
      user_id   SERIAL PRIMARY KEY,
      name      TEXT,
      email     TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_user_plans (
      plan_id   SERIAL PRIMARY KEY,
      user_id   INT REFERENCES ai_users(user_id),
      credits   FLOAT DEFAULT 100000,
      expiry    DATE DEFAULT (NOW() + INTERVAL '10 years'),
      active    BOOLEAN DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS ai_prompts (
      prompt_id   SERIAL PRIMARY KEY,
      user_id     INT REFERENCES ai_users(user_id),
      prompt_text TEXT,
      active      BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_prompt_history (
      id          SERIAL PRIMARY KEY,
      prompt_id   INT REFERENCES ai_prompts(prompt_id),
      user_id     INT REFERENCES ai_users(user_id),
      person      TEXT,
      text        TEXT,
      type        TEXT DEFAULT 'text',
      focus_type  TEXT,
      link        TEXT DEFAULT '[]',
      active      BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ DB tables ready");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ok = (res, data = null, message = "Success") =>
  res.json({ status: true, message, data });

const fail = (res, message = "Error", code = 400) =>
  res.status(code).json({ status: false, message });

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function groupByDate(rows) {
  return rows.reduce((acc, item) => {
    const date = new Date(item.createdAt).toISOString().split("T")[0];
    const existing = acc.find((g) => g.date === date);
    if (existing) existing.data.push(item);
    else acc.push({ date, data: [item] });
    return acc;
  }, []);
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return fail(res, "Unauthorized", 401);
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    fail(res, "Invalid token", 401);
  }
}

// ─── System Prompts ───────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  fund:     "You are a financial analyst specializing in Indian and US stock markets. Answer questions about company fundamentals, financial ratios, earnings, and valuations. Be concise and accurate.",
  news:     "You are a knowledgeable market analyst. Answer questions about financial markets, company news, economic indicators, and investment topics using your training knowledge.",
  news_bing:"You are a knowledgeable market analyst. Answer questions about financial markets, company news, and economic events.",
  youtube:  "You are a financial content analyst. Summarize and explain financial content clearly and concisely.",
  reddit:   "You are a market sentiment analyst. Provide balanced insights on investor sentiment and market discussions.",
  screener: "You are a stock screening analyst. Help users find and analyze stocks based on financial criteria.",
  default:  "You are a helpful financial assistant specializing in stock markets, investment analysis, and financial planning.",
};

function sysPrompt(flag) {
  return SYSTEM_PROMPTS[flag] || SYSTEM_PROMPTS.default;
}

function extractSources(annotations = []) {
  if (!Array.isArray(annotations)) return [];
  return annotations
    .filter(a => a.type === "url_citation")
    .map(a => ({
      source_url: a.url_citation?.url || a.url,
      heading:    a.url_citation?.title || a.title || "",
      title:      a.url_citation?.title || a.title || "",
    }));
}

async function getHistory(userId, promptId, limit = 10) {
  const r = await pool.query(
    `SELECT person, text FROM ai_prompt_history
     WHERE user_id=$1 AND prompt_id=$2 AND active=true
     ORDER BY id ASC LIMIT $3`,
    [userId, promptId, limit]
  );
  return r.rows;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════
const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post("/users/emailLoginOtp", async (req, res) => {
  const { email } = req.body;
  if (!email) return fail(res, "Email required");
  const otp = genOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  await sendOtpEmail(email, otp);
  ok(res, null, "OTP sent to your email.");
});

router.post("/users/emailLoginVerifyOtp", async (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);
  if (!stored || stored.otp !== String(otp) || Date.now() > stored.expiresAt)
    return fail(res, "Invalid or expired OTP");
  otpStore.delete(email);

  let r = await pool.query(`SELECT * FROM ai_users WHERE email=$1`, [email]);
  let user = r.rows[0];
  if (!user) {
    const ins = await pool.query(
      `INSERT INTO ai_users(name, email) VALUES($1,$2) RETURNING *`,
      [email.split("@")[0], email]
    );
    user = ins.rows[0];
    await pool.query(`INSERT INTO ai_user_plans(user_id) VALUES($1)`, [user.user_id]);
  }
  const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
  ok(res, { token }, "Logged in successfully");
});

router.post("/users/sendSignUpOtp", async (req, res) => {
  const { email } = req.body;
  if (!email) return fail(res, "Email required");
  const otp = genOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  await sendOtpEmail(email, otp);
  ok(res, null, "OTP sent to your email.");
});

router.post("/users/verifyOtp", async (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);
  if (!stored || stored.otp !== String(otp) || Date.now() > stored.expiresAt)
    return fail(res, "Invalid or expired OTP");
  ok(res, null, "OTP verified");
});

router.post("/users/signup", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return fail(res, "Name and email required");
  try {
    const ins = await pool.query(
      `INSERT INTO ai_users(name, email) VALUES($1,$2)
       ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name RETURNING *`,
      [name, email]
    );
    const user = ins.rows[0];
    await pool.query(
      `INSERT INTO ai_user_plans(user_id) VALUES($1) ON CONFLICT DO NOTHING`,
      [user.user_id]
    );
    otpStore.delete(email);
    const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    ok(res, { token }, "Signup successful");
  } catch (e) {
    fail(res, e.message, 500);
  }
});

router.post("/users/resendOtp", async (req, res) => {
  const { email } = req.body;
  const otp = genOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  await sendOtpEmail(email, otp);
  ok(res, null, "OTP resent to your email.");
});

router.get("/users/userDetails", auth, async (req, res) => {
  const r = await pool.query(
    `SELECT user_id, name, email FROM ai_users WHERE user_id=$1`,
    [req.user.user_id]
  );
  ok(res, r.rows[0] || null);
});

router.put("/users/updateProfile", auth, async (req, res) => {
  const { name } = req.body;
  await pool.query(`UPDATE ai_users SET name=$1 WHERE user_id=$2`, [name, req.user.user_id]);
  ok(res, null, "Profile updated");
});

router.get("/users/getUserActivePlan", auth, async (req, res) => {
  const r = await pool.query(
    `SELECT * FROM ai_user_plans WHERE user_id=$1 AND active=true LIMIT 1`,
    [req.user.user_id]
  );
  ok(res, r.rows[0] || null);
});

router.get("/users/getAvaliableCredit", auth, async (req, res) => {
  const r = await pool.query(
    `SELECT credits FROM ai_user_plans WHERE user_id=$1 AND active=true LIMIT 1`,
    [req.user.user_id]
  );
  ok(res, { credits: r.rows[0]?.credits || 0 });
});

// ── Prompts (Chat sessions) ───────────────────────────────────────────────────

router.get("/prompts/getPrompts", auth, async (req, res) => {
  const r = await pool.query(
    `SELECT prompt_id, prompt_text, "createdAt" FROM ai_prompts
     WHERE user_id=$1 AND active=true ORDER BY "createdAt" DESC`,
    [req.user.user_id]
  );
  ok(res, groupByDate(r.rows));
});

router.post("/prompts/addPrompts", auth, async (req, res) => {
  const { prompt_text } = req.body;
  if (!prompt_text) return fail(res, "prompt_text required");
  const r = await pool.query(
    `INSERT INTO ai_prompts(user_id, prompt_text) VALUES($1,$2) RETURNING prompt_id`,
    [req.user.user_id, prompt_text.substring(0, 320)]
  );
  ok(res, { prompt_id: r.rows[0].prompt_id });
});

router.get("/prompts/getPromptHistory", auth, async (req, res) => {
  const { prompt_id } = req.query;
  if (!prompt_id) return fail(res, "prompt_id required");
  const r = await pool.query(
    `SELECT id as prompt_history_id, prompt_id, user_id, person, text, type, focus_type, link, active, "createdAt"
     FROM ai_prompt_history
     WHERE user_id=$1 AND prompt_id=$2 AND active=true
     ORDER BY id ASC`,
    [req.user.user_id, prompt_id]
  );
  ok(res, { rows: r.rows, count: r.rowCount });
});

router.delete("/prompts/deletePrompt", auth, async (req, res) => {
  const { promptId } = req.query;
  await pool.query(`UPDATE ai_prompts SET active=false WHERE prompt_id=$1 AND user_id=$2`, [promptId, req.user.user_id]);
  await pool.query(`UPDATE ai_prompt_history SET active=false WHERE prompt_id=$1`, [promptId]);
  ok(res, null, "Deleted");
});

router.get("/prompts/searchPrompts", auth, async (req, res) => {
  const { prompt } = req.query;
  const r = await pool.query(
    `SELECT prompt_id, prompt_text, "createdAt" FROM ai_prompts
     WHERE user_id=$1 AND active=true AND prompt_text ILIKE $2 ORDER BY "createdAt" DESC`,
    [req.user.user_id, `%${prompt || ""}%`]
  );
  ok(res, groupByDate(r.rows));
});

router.get("/prompts/searchSuggestedQuestionPrompts", auth, (req, res) => ok(res, []));

// REST chat (screener flag — uses web search)
router.post("/prompts/triggerChat", auth, async (req, res) => {
  try {
    const { message, prompt_id, flag } = req.body;
    if (!message || !prompt_id) return fail(res, "message and prompt_id required");

    const hist = await getHistory(req.user.user_id, prompt_id);
    const messages = [
      { role: "system", content: sysPrompt(flag) },
      ...hist.map(r => ({ role: r.person === "bot" ? "assistant" : "user", content: r.text || "" })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages,
      web_search_options: {},
    });
    const msg = completion.choices[0].message;
    const text = msg.content;
    const sources = extractSources(msg.annotations);

    await pool.query(
      `INSERT INTO ai_prompt_history(user_id, prompt_id, person, text, type, focus_type, link)
       VALUES($1,$2,'user',$3,'text',$4,'[]'),($1,$2,'bot',$5,'text',$4,$6)`,
      [req.user.user_id, prompt_id, message, flag, text, JSON.stringify(sources)]
    );

    ok(res, { data: text, link: sources, focus_type: flag });
  } catch (e) {
    fail(res, e.message, 500);
  }
});

router.post("/prompts/triggerGraph", auth, (req, res) =>
  fail(res, "Graph generation coming soon.")
);

// ── Prompt Library ────────────────────────────────────────────────────────────
router.get("/promptlibrary/getPrompts", auth, (req, res) => {
  ok(res, [
    { prompt_library_id: 1, prompt_text: "What are the key metrics to evaluate before buying a stock?", type: "suggested" },
    { prompt_library_id: 2, prompt_text: "Explain P/E ratio and how to use it", type: "suggested" },
    { prompt_library_id: 3, prompt_text: "What is dollar cost averaging?", type: "popular" },
    { prompt_library_id: 4, prompt_text: "How do I read a company balance sheet?", type: "popular" },
    { prompt_library_id: 5, prompt_text: "Difference between technical and fundamental analysis", type: "suggested" },
    { prompt_library_id: 6, prompt_text: "What are blue chip stocks and why invest in them?", type: "popular" },
    { prompt_library_id: 7, prompt_text: "How does inflation affect stock markets?", type: "suggested" },
    { prompt_library_id: 8, prompt_text: "Explain EBITDA and why it matters", type: "popular" },
  ]);
});

// ── Content Prompt (stubs) ────────────────────────────────────────────────────
router.post("/contentPrompt/triggerContentPrompt", auth, (req, res) =>
  ok(res, { data: "Link summarization coming soon.", prompt_id: 1 })
);
router.get("/contentPrompt/getSignedUrl", auth, (req, res) =>
  fail(res, "Document upload coming soon.")
);
router.post("/contentPrompt/addDocument", auth, (req, res) =>
  fail(res, "Document processing coming soon.")
);
router.post("/contentPrompt/triggerDocumentChat", auth, (req, res) =>
  ok(res, "Document Q&A coming soon.")
);
router.get("/contentPrompt/getContentPromptHistory", auth, (req, res) => ok(res, []));
router.get("/contentPrompt/getContentPromptHistoryByContentPromptId", auth, (req, res) => ok(res, []));
router.get("/contentPrompt/searchContentPrompts", auth, (req, res) => ok(res, []));
router.delete("/contentPrompt/deleteContentPrompt", auth, (req, res) => ok(res, null, "Deleted"));
router.post("/contentPrompt/triggerLinkGraph", auth, (req, res) => fail(res, "Coming soon."));
router.post("/contentPrompt/triggerAttachmentGraph", auth, (req, res) => fail(res, "Coming soon."));

// ── Stubs for everything else the frontend calls ──────────────────────────────
router.get("/stocks/getSuggestionPrompts", auth, (req, res) => ok(res, []));
const TRENDING_IN = [
  { name: "HDFC Bank",                     stock_ticker: "HDFCBANK",   stock_relevance: "+1.2%", reason: "Strong Q4 results and steady loan growth" },
  { name: "ICICI Bank",                    stock_ticker: "ICICIBANK",  stock_relevance: "+0.9%", reason: "Broad-based credit growth and NIM expansion" },
  { name: "State Bank of India",           stock_ticker: "SBIN",       stock_relevance: "+0.7%", reason: "Rising retail deposits and PSU capex tailwinds" },
  { name: "Kotak Mahindra Bank",           stock_ticker: "KOTAKBANK",  stock_relevance: "-0.3%", reason: "Valuation concerns amid muted loan growth" },
  { name: "Axis Bank",                     stock_ticker: "AXISBANK",   stock_relevance: "+1.1%", reason: "Improving asset quality and CASA ratio" },
  { name: "Bajaj Finance",                 stock_ticker: "BAJFINANCE", stock_relevance: "+1.8%", reason: "AUM growth beat and strong collections" },
  { name: "Bajaj Finserv",                 stock_ticker: "BAJAJFINSV", stock_relevance: "+1.5%", reason: "Diversified NBFC play benefiting from credit cycle" },
  { name: "Tata Consultancy Services",     stock_ticker: "TCS",        stock_relevance: "+0.6%", reason: "Resilient margins and large deal wins" },
  { name: "Infosys",                       stock_ticker: "INFY",       stock_relevance: "+0.4%", reason: "Guidance in-line; AI deal pipeline expanding" },
  { name: "HCL Technologies",             stock_ticker: "HCLTECH",    stock_relevance: "+0.8%", reason: "ER&D segment outperforming peers" },
  { name: "Wipro",                         stock_ticker: "WIPRO",      stock_relevance: "-0.2%", reason: "Slow BFSI vertical recovery weighing on growth" },
  { name: "Reliance Industries",           stock_ticker: "RELIANCE",   stock_relevance: "+1.3%", reason: "Jio subscriber additions and O2C margin recovery" },
  { name: "Larsen & Toubro",              stock_ticker: "LT",         stock_relevance: "+1.0%", reason: "Record order inflows from infra and defence" },
  { name: "NTPC",                          stock_ticker: "NTPC",       stock_relevance: "+0.5%", reason: "Capacity additions and renewable energy push" },
  { name: "Power Grid Corporation",        stock_ticker: "POWERGRID",  stock_relevance: "+0.4%", reason: "Steady regulated returns and transmission capex" },
  { name: "Adani Enterprises",             stock_ticker: "ADANIENT",   stock_relevance: "+2.1%", reason: "Airport and green energy businesses scaling up" },
  { name: "Adani Ports & SEZ",             stock_ticker: "ADANIPORTS", stock_relevance: "+1.6%", reason: "Cargo volume growth and port acquisitions" },
  { name: "Maruti Suzuki",                 stock_ticker: "MARUTI",     stock_relevance: "+0.9%", reason: "Strong SUV demand and CNG model launches" },
  { name: "Tata Motors",                   stock_ticker: "TATAMOTORS", stock_relevance: "+1.4%", reason: "JLR recovery and EV market share gains" },
  { name: "Mahindra & Mahindra",           stock_ticker: "M&M",        stock_relevance: "+1.7%", reason: "SUV segment dominance and EV order book" },
  { name: "Hindustan Unilever",            stock_ticker: "HINDUNILVR", stock_relevance: "+0.3%", reason: "Rural demand revival supporting volume growth" },
  { name: "ITC",                           stock_ticker: "ITC",        stock_relevance: "+0.6%", reason: "Cigarette volume resilience and FMCG scale-up" },
  { name: "Nestlé India",                  stock_ticker: "NESTLEIND",  stock_relevance: "+0.5%", reason: "Premium product mix and distribution expansion" },
  { name: "Britannia Industries",          stock_ticker: "BRITANNIA",  stock_relevance: "+0.4%", reason: "Margin improvement on lower commodity costs" },
  { name: "Sun Pharmaceutical",            stock_ticker: "SUNPHARMA",  stock_relevance: "+1.2%", reason: "US specialty portfolio and emerging market growth" },
];

const TRENDING_US = [
  { name: "Apple",                         stock_ticker: "AAPL",  stock_relevance: "+0.8%", reason: "iPhone cycle and Services revenue growth" },
  { name: "Microsoft",                     stock_ticker: "MSFT",  stock_relevance: "+1.1%", reason: "Azure AI adoption and Copilot monetisation" },
  { name: "Nvidia",                        stock_ticker: "NVDA",  stock_relevance: "+3.2%", reason: "Data centre GPU demand driven by AI buildout" },
  { name: "Alphabet",                      stock_ticker: "GOOGL", stock_relevance: "+1.0%", reason: "Search resilience and Cloud revenue acceleration" },
  { name: "Amazon",                        stock_ticker: "AMZN",  stock_relevance: "+1.4%", reason: "AWS growth and advertising segment profitability" },
  { name: "Meta Platforms",               stock_ticker: "META",  stock_relevance: "+1.9%", reason: "Ad market rebound and Llama AI integration" },
  { name: "Broadcom",                      stock_ticker: "AVGO",  stock_relevance: "+2.4%", reason: "Custom AI chip deals and VMware integration" },
  { name: "AMD",                           stock_ticker: "AMD",   stock_relevance: "+2.1%", reason: "MI300 AI accelerator gaining data centre share" },
  { name: "Intel",                         stock_ticker: "INTC",  stock_relevance: "-0.9%", reason: "Foundry losses and PC market recovery lag" },
  { name: "TSMC",                          stock_ticker: "TSM",   stock_relevance: "+1.8%", reason: "Advanced node demand from AI chip designers" },
  { name: "Berkshire Hathaway",            stock_ticker: "BRK.B", stock_relevance: "+0.6%", reason: "Cash pile deployment and insurance earnings" },
  { name: "JPMorgan Chase",               stock_ticker: "JPM",   stock_relevance: "+0.7%", reason: "NII strength and investment banking recovery" },
  { name: "Bank of America",              stock_ticker: "BAC",   stock_relevance: "+0.5%", reason: "Rate sensitivity advantage in higher-for-longer" },
  { name: "Mastercard",                    stock_ticker: "MA",    stock_relevance: "+0.9%", reason: "Cross-border volume growth and value-added services" },
  { name: "Visa",                          stock_ticker: "V",     stock_relevance: "+0.8%", reason: "Payments volume resilient amid global travel" },
  { name: "Procter & Gamble",             stock_ticker: "PG",    stock_relevance: "+0.3%", reason: "Pricing power and emerging market volume growth" },
  { name: "Coca-Cola",                     stock_ticker: "KO",    stock_relevance: "+0.2%", reason: "Defensive play with strong dividend yield" },
  { name: "PepsiCo",                       stock_ticker: "PEP",   stock_relevance: "+0.1%", reason: "Snack segment offsetting beverage softness" },
  { name: "Costco",                        stock_ticker: "COST",  stock_relevance: "+1.2%", reason: "Membership fee hike and warehouse expansion" },
  { name: "Johnson & Johnson",            stock_ticker: "JNJ",   stock_relevance: "+0.4%", reason: "MedTech growth and oncology pipeline progress" },
  { name: "Eli Lilly",                     stock_ticker: "LLY",   stock_relevance: "+2.8%", reason: "GLP-1 weight-loss drug demand surging globally" },
  { name: "Pfizer",                        stock_ticker: "PFE",   stock_relevance: "-0.6%", reason: "Post-COVID revenue normalisation and pipeline risk" },
  { name: "Tesla",                         stock_ticker: "TSLA",  stock_relevance: "+2.3%", reason: "FSD progress and energy storage record deployments" },
  { name: "Walt Disney",                   stock_ticker: "DIS",   stock_relevance: "+0.7%", reason: "Streaming profitability and parks demand recovery" },
  { name: "T-Mobile",                      stock_ticker: "TMUS",  stock_relevance: "+0.5%", reason: "Network leadership and subscriber momentum" },
];

const STANDOUT_IN = [
  { name: "Reliance Industries",       stock_ticker: "RELIANCE",   stock_relevance: "+1.3%", reason: "Jio subscriber additions and O2C margin recovery" },
  { name: "Tata Consultancy Services", stock_ticker: "TCS",        stock_relevance: "+0.6%", reason: "Resilient margins and large deal wins" },
  { name: "HDFC Bank",                 stock_ticker: "HDFCBANK",   stock_relevance: "+1.2%", reason: "Strong Q4 results and steady loan growth" },
  { name: "ICICI Bank",                stock_ticker: "ICICIBANK",  stock_relevance: "+0.9%", reason: "Broad-based credit growth and NIM expansion" },
  { name: "Infosys",                   stock_ticker: "INFY",       stock_relevance: "+0.4%", reason: "Guidance in-line; AI deal pipeline expanding" },
  { name: "State Bank of India",       stock_ticker: "SBIN",       stock_relevance: "+0.7%", reason: "Rising retail deposits and PSU capex tailwinds" },
  { name: "Axis Bank",                 stock_ticker: "AXISBANK",   stock_relevance: "+1.1%", reason: "Improving asset quality and CASA ratio" },
  { name: "Bajaj Finance",             stock_ticker: "BAJFINANCE", stock_relevance: "+1.8%", reason: "AUM growth beat and strong collections" },
  { name: "Larsen & Toubro",           stock_ticker: "LT",         stock_relevance: "+1.0%", reason: "Record order inflows from infra and defence" },
  { name: "NTPC",                      stock_ticker: "NTPC",       stock_relevance: "+0.5%", reason: "Capacity additions and renewable energy push" },
  { name: "Power Grid Corporation",    stock_ticker: "POWERGRID",  stock_relevance: "+0.4%", reason: "Steady regulated returns and transmission capex" },
  { name: "Maruti Suzuki",             stock_ticker: "MARUTI",     stock_relevance: "+0.9%", reason: "Strong SUV demand and CNG model launches" },
  { name: "Tata Motors",               stock_ticker: "TATAMOTORS", stock_relevance: "+1.4%", reason: "JLR recovery and EV market share gains" },
  { name: "Mahindra & Mahindra",       stock_ticker: "M&M",        stock_relevance: "+1.7%", reason: "SUV segment dominance and EV order book" },
  { name: "Hindustan Unilever",        stock_ticker: "HINDUNILVR", stock_relevance: "+0.3%", reason: "Rural demand revival supporting volume growth" },
  { name: "ITC",                       stock_ticker: "ITC",        stock_relevance: "+0.6%", reason: "Cigarette volume resilience and FMCG scale-up" },
  { name: "Zomato",                    stock_ticker: "ZOMATO",     stock_relevance: "+2.4%", reason: "Hyperpure and quick commerce scaling rapidly" },
  { name: "Nykaa",                     stock_ticker: "NYKAA",      stock_relevance: "+1.9%", reason: "Beauty GMV growth and profitability inflection" },
  { name: "Adani Enterprises",         stock_ticker: "ADANIENT",   stock_relevance: "+2.1%", reason: "Airport and green energy businesses scaling up" },
  { name: "Adani Green Energy",        stock_ticker: "ADANIGREEN", stock_relevance: "+1.8%", reason: "Renewable capacity additions ahead of schedule" },
];

const STANDOUT_US = [
  { name: "Apple",                     stock_ticker: "AAPL",  stock_relevance: "+0.8%", reason: "iPhone cycle and Services revenue growth" },
  { name: "Microsoft",                 stock_ticker: "MSFT",  stock_relevance: "+1.1%", reason: "Azure AI adoption and Copilot monetisation" },
  { name: "NVIDIA",                    stock_ticker: "NVDA",  stock_relevance: "+3.2%", reason: "Data centre GPU demand driven by AI buildout" },
  { name: "Amazon",                    stock_ticker: "AMZN",  stock_relevance: "+1.4%", reason: "AWS growth and advertising segment profitability" },
  { name: "Alphabet",                  stock_ticker: "GOOGL", stock_relevance: "+1.0%", reason: "Search resilience and Cloud revenue acceleration" },
  { name: "Meta Platforms",            stock_ticker: "META",  stock_relevance: "+1.9%", reason: "Ad market rebound and Llama AI integration" },
  { name: "Tesla",                     stock_ticker: "TSLA",  stock_relevance: "+2.3%", reason: "FSD progress and energy storage record deployments" },
  { name: "Netflix",                   stock_ticker: "NFLX",  stock_relevance: "+1.6%", reason: "Ad-supported tier growth and password sharing crackdown" },
  { name: "Palantir",                  stock_ticker: "PLTR",  stock_relevance: "+3.8%", reason: "AIP enterprise AI contracts accelerating" },
  { name: "Snowflake",                 stock_ticker: "SNOW",  stock_relevance: "+2.1%", reason: "Data cloud consumption growth and AI workloads" },
  { name: "Advanced Micro Devices",    stock_ticker: "AMD",   stock_relevance: "+2.1%", reason: "MI300 AI accelerator gaining data centre share" },
  { name: "Broadcom",                  stock_ticker: "AVGO",  stock_relevance: "+2.4%", reason: "Custom AI chip deals and VMware integration" },
  { name: "JPMorgan Chase",            stock_ticker: "JPM",   stock_relevance: "+0.7%", reason: "NII strength and investment banking recovery" },
  { name: "Goldman Sachs",             stock_ticker: "GS",    stock_relevance: "+0.9%", reason: "Trading revenue surge and M&A pipeline rebuilding" },
  { name: "Eli Lilly",                 stock_ticker: "LLY",   stock_relevance: "+2.8%", reason: "GLP-1 weight-loss drug demand surging globally" },
  { name: "Johnson & Johnson",         stock_ticker: "JNJ",   stock_relevance: "+0.4%", reason: "MedTech growth and oncology pipeline progress" },
  { name: "Coca-Cola",                 stock_ticker: "KO",    stock_relevance: "+0.2%", reason: "Defensive play with strong dividend yield" },
  { name: "Walmart",                   stock_ticker: "WMT",   stock_relevance: "+0.8%", reason: "E-commerce share gains and advertising business growth" },
  { name: "ExxonMobil",               stock_ticker: "XOM",   stock_relevance: "+0.6%", reason: "Pioneer acquisition synergies and Permian growth" },
  { name: "Chevron",                   stock_ticker: "CVX",   stock_relevance: "+0.5%", reason: "Hess deal and strong free cash flow generation" },
];

router.get("/stocks/trending", auth, (req, res) => {
  const market = (req.query.market || "IN").toUpperCase();
  ok(res, market === "US" ? TRENDING_US : TRENDING_IN);
});

router.get("/stocks/indexes", auth, (req, res) => ok(res, []));
router.get("/stocks/sp500", auth, (req, res) => ok(res, []));
router.get("/stocks/getStockBySearch", auth, (req, res) => ok(res, []));
router.get("/stocks/getCompanyDetail", auth, (req, res) => ok(res, null));
router.get("/stocks/getStockStatistics", auth, (req, res) => ok(res, null));
router.get("/stocks/getGraphDetail", auth, (req, res) => ok(res, null));
router.get("/stocks/getStockOverview", auth, (req, res) => ok(res, null));
router.get("/stocks/getFinancialsPeers", auth, (req, res) => ok(res, []));
router.get("/stocks/getFinancialsShareHolding", auth, (req, res) => ok(res, null));
router.get("/stocks/getStockRevenue", auth, (req, res) => ok(res, null));
router.get("/stocks/getFinancialsResults", auth, (req, res) => ok(res, null));
router.get("/stocks/fetchTrendingStocksFromAI", auth, (req, res) => {
  const market = (req.query.market || "IN").toUpperCase();
  ok(res, market === "US" ? STANDOUT_US : STANDOUT_IN);
});
const MARKET_SUMMARY_IN = {
  last_updated_utc: new Date().toISOString(),
  market_drivers: {
    summary: "India's equity markets, represented by the Nifty 50 and Sensex, are currently navigating a phase of consolidation after a strong multi-month rally that pushed valuations toward the higher end of historical ranges. Recent sessions have been marked by increased volatility, driven largely by profit booking, intermittent foreign institutional investor outflows, and sector-specific weakness, particularly in information technology stocks facing softer global demand and cautious client spending. Rising crude oil prices have added another layer of concern, as India's status as a major oil importer makes its inflation and fiscal outlook sensitive to energy costs. Despite these near-term headwinds, domestic fundamentals remain supportive, with steady GDP growth, resilient consumption, improving corporate balance sheets, and continued government-led infrastructure spending underpinning the broader market outlook.",
  },
  market_summary: {
    summary_points: [
      { title: "Valuation Consolidation", summary: "Nifty 50 and Sensex pulling back from elevated levels after a strong multi-month rally; profit booking driving near-term volatility." },
      { title: "FII Outflows", summary: "Intermittent foreign institutional investor selling adding selling pressure, particularly in large-cap IT and financial names." },
      { title: "Crude Oil Risk", summary: "Rising crude prices pose an upside risk to India's inflation and fiscal deficit, given its status as a major oil importer." },
      { title: "Domestic Fundamentals", summary: "Steady GDP growth, resilient consumption, and improving corporate balance sheets continue to support the medium-term market outlook." },
      { title: "Banking & Financials", summary: "Relatively stable on the back of strong credit growth; NIM expansion and improving asset quality lending support to sector." },
      { title: "Capex & Infrastructure", summary: "Capital goods and power sectors outperforming, driven by the ongoing government-led investment and infrastructure spending cycle." },
    ],
    sources: [],
  },
  standouts_analysis: {
    gainers: [
      { stock: "Larsen & Toubro",      reason: "Record order inflows from infrastructure and defence sectors driving strong earnings visibility." },
      { stock: "NTPC",                  reason: "Renewable capacity additions on track; power sector benefiting from rising electricity demand." },
      { stock: "Bajaj Finance",         reason: "AUM growth beat expectations; collections and asset quality remain healthy." },
      { stock: "Tata Motors",           reason: "JLR recovery gaining momentum; EV market share expanding domestically." },
    ],
    losers: [
      { stock: "Infosys",               reason: "Softer global IT demand and cautious client spending weighing on revenue growth guidance." },
      { stock: "Wipro",                 reason: "BFSI vertical recovery slower than peers; deal ramp-ups delayed by client budget freezes." },
      { stock: "HCL Technologies",      reason: "Margin pressure from wage hikes offsetting ER&D segment outperformance." },
    ],
  },
  sector_analysis: {
    top_performing_sectors: [
      { sector: "Banking & Financials", reason: "Strong credit growth, NIM expansion, and improving asset quality supporting sector outperformance." },
      { sector: "Capital Goods",        reason: "Government infrastructure push driving record order books for engineering and construction companies." },
      { sector: "Power & Energy",       reason: "Rising electricity demand and renewable capacity additions; NTPC and Power Grid in focus." },
      { sector: "Automobiles",          reason: "SUV demand robust; EV transition accelerating with Tata Motors and M&M leading." },
    ],
    underperforming_sectors: [
      { sector: "Information Technology", reason: "Softer global demand, cautious client budgets, and FII selling weighing on IT stocks." },
      { sector: "Oil & Gas (downstream)", reason: "Rising crude input costs squeezing margins for refiners and downstream players." },
    ],
    top_performers: [
      { sector: "Banking & Financials", reason: "Strong credit growth, NIM expansion, and improving asset quality." },
      { sector: "Capital Goods",        reason: "Record infrastructure order inflows from government capex cycle." },
      { sector: "Power",                reason: "Capacity additions and rising electricity demand driving earnings growth." },
      { sector: "Automobiles",          reason: "Robust SUV and EV demand supporting volume and margin expansion." },
    ],
  },
  latest_news: {
    articles: [
      { title: "Nifty consolidates near highs amid FII outflows", snippet: "Markets saw profit booking as foreign investors continued to sell Indian equities for the third consecutive session.", age: "2 hours ago" },
      { title: "Bajaj Finance Q4 results beat estimates on AUM growth", snippet: "The NBFC reported strong asset quality and collections, pushing the stock to a fresh 52-week high.", age: "4 hours ago" },
      { title: "Crude oil crosses $90 — impact on India's fiscal math", snippet: "Rising energy prices raise concerns about India's current account deficit and inflation trajectory.", age: "6 hours ago" },
      { title: "L&T wins ₹12,000 Cr infrastructure order from NHAI", snippet: "Larsen & Toubro secured one of its largest single road infrastructure contracts, boosting its order book.", age: "8 hours ago" },
      { title: "IT sector outlook cautious as global spending slows", snippet: "Analysts trim FY25 earnings estimates for top-tier IT companies citing delayed deal ramp-ups.", age: "10 hours ago" },
    ],
  },
};

const MARKET_SUMMARY_US = {
  last_updated_utc: new Date().toISOString(),
  market_drivers: {
    summary: "In the United States, equity markets led by the S&P 500 and Nasdaq Composite continue to exhibit strong upward momentum, supported by robust corporate earnings and sustained investor enthusiasm for artificial intelligence and large-cap technology companies. The rally has been concentrated among a handful of mega-cap firms, whose earnings growth and innovation narratives have driven index performance to near-record levels. At the same time, the broader economy has shown resilience, with steady consumer spending and a relatively stable labor market helping offset concerns about higher interest rates. However, risks remain on the horizon, including uncertainty over future Federal Reserve policy decisions, elevated market valuations—particularly in the technology sector—and potential shocks from geopolitical developments or energy price fluctuations.",
  },
  market_summary: {
    summary_points: [
      { title: "AI-Driven Rally", summary: "Mega-cap tech and AI infrastructure companies driving the S&P 500 and Nasdaq to near-record levels on earnings beats and forward guidance." },
      { title: "Concentrated Leadership", summary: "Market gains concentrated in a handful of large-cap names; equal-weight S&P 500 lagging the cap-weighted index significantly." },
      { title: "Resilient Economy", summary: "Consumer spending and labor market remain stable, reducing recession risk and supporting corporate earnings expectations." },
      { title: "Fed Policy Uncertainty", summary: "Timing of Federal Reserve rate cuts remains a key market variable; strong data pushing expectations for cuts further out." },
      { title: "Valuation Concerns", summary: "Technology sector trading at elevated multiples; forward P/E ratios above historical averages raising risk of de-rating." },
      { title: "Geopolitical & Energy Risk", summary: "Potential shocks from Middle East tensions or energy price spikes could disrupt current benign inflation narrative." },
    ],
    sources: [],
  },
  standouts_analysis: {
    gainers: [
      { stock: "NVIDIA",        reason: "Data centre GPU demand at record highs; AI buildout driving earnings far ahead of consensus estimates." },
      { stock: "Meta Platforms", reason: "Ad market recovery and Llama AI model monetisation driving margin expansion and strong EPS growth." },
      { stock: "Eli Lilly",     reason: "GLP-1 weight-loss drug (Mounjaro/Zepbound) demand surging globally; guidance raised multiple times." },
      { stock: "Palantir",      reason: "AIP enterprise AI platform contracts accelerating; US commercial revenue growing at 70%+ YoY." },
    ],
    losers: [
      { stock: "Intel",  reason: "Foundry division losses widening; PC market recovery slower than expected." },
      { stock: "Pfizer", reason: "Post-COVID revenue normalisation; pipeline setbacks weighing on near-term growth outlook." },
    ],
  },
  sector_analysis: {
    top_performing_sectors: [
      { sector: "Technology & AI",      reason: "Mega-cap tech earnings beats and AI capex cycle driving sector to near-record valuations." },
      { sector: "Semiconductors",       reason: "AI chip demand — especially NVIDIA and Broadcom — driving the strongest earnings cycle in years." },
      { sector: "Healthcare (GLP-1)",   reason: "Eli Lilly and obesity drug theme dominating healthcare sector performance and fund flows." },
      { sector: "Financials",           reason: "Higher-for-longer rates benefiting net interest income; M&A advisory pipeline rebuilding." },
    ],
    underperforming_sectors: [
      { sector: "Consumer Staples",  reason: "Defensive sector lagging as risk-on sentiment persists; margin pressure from input cost normalisation." },
      { sector: "Utilities",         reason: "Rate-sensitive sector underperforming as Fed cut expectations get pushed further out." },
    ],
    top_performers: [
      { sector: "Technology & AI",    reason: "AI narrative and mega-cap earnings driving index returns; most concentrated rally in decades." },
      { sector: "Semiconductors",     reason: "NVIDIA, Broadcom, and AMD benefiting from insatiable demand for AI training and inference chips." },
      { sector: "Healthcare",         reason: "GLP-1 obesity drug theme creating a new multi-year growth cycle for select pharma companies." },
      { sector: "Financials",         reason: "Higher rates and improving deal flow supporting investment banks and regional lenders." },
    ],
  },
  latest_news: {
    articles: [
      { title: "S&P 500 hits record high on NVIDIA earnings beat", snippet: "NVIDIA's blowout quarterly results pushed the broader index to all-time highs as AI optimism surged.", age: "2 hours ago" },
      { title: "Fed signals patience on rate cuts amid strong jobs data", snippet: "Federal Reserve officials reiterated a data-dependent stance, pushing rate cut expectations to Q4 2025.", age: "4 hours ago" },
      { title: "Meta Platforms raises full-year guidance on AI ad revenue", snippet: "Strong advertising revenue and AI-driven engagement gains drove Meta shares up 8% post-earnings.", age: "6 hours ago" },
      { title: "Eli Lilly GLP-1 sales top $5B for the first time in a quarter", snippet: "Mounjaro and Zepbound combined sales exceeded analyst estimates, reinforcing the obesity drug supercycle thesis.", age: "8 hours ago" },
      { title: "Intel reports wider-than-expected foundry losses", snippet: "The chip giant's manufacturing division continues to weigh on overall profitability despite cost reduction efforts.", age: "10 hours ago" },
    ],
  },
};

router.get("/stocks/getTrendingDashboardData", auth, (req, res) => {
  const market = (req.query.market || "IN").toUpperCase();
  const data = market === "US" ? MARKET_SUMMARY_US : MARKET_SUMMARY_IN;
  ok(res, { data: [{ data }] });
});
router.get("/news/trending", auth, (req, res) => ok(res, []));
router.get("/news/reference", auth, (req, res) => ok(res, []));
router.get("/news/fetchAllNews", auth, (req, res) => ok(res, []));
router.get("/users/getMostOnFruitGPT", auth, (req, res) => ok(res, []));
router.get("/users/getInvestorStories", auth, (req, res) => ok(res, []));
router.get("/watchlist/fetchWatchList", auth, (req, res) => ok(res, []));
router.get("/watchlist/fetchWatchListTickerByWatchlist", auth, (req, res) => ok(res, []));
router.post("/watchlist/addWatchList", auth, (req, res) => ok(res, null));
router.put("/watchlist/editWatchList", auth, (req, res) => ok(res, null));
router.delete("/watchlist/deleteWatchList", auth, (req, res) => ok(res, null));
router.post("/watchlist/addTickertoWatchList", auth, (req, res) => ok(res, null));
router.delete("/watchlist/removeTickerFromWatchList", auth, (req, res) => ok(res, null));
router.get("/eventCategories/fetchtrendingEvents", auth, (req, res) => ok(res, []));
router.get("/plans", auth, (req, res) => ok(res, []));
router.get("/topic/getTopics", auth, (req, res) => ok(res, []));
router.get("/topic/searchTopics", auth, (req, res) => ok(res, []));
router.get("/topic/getTopicsByUserId", auth, (req, res) => ok(res, []));
router.post("/users/addUserTopics", auth, (req, res) => ok(res, null));
router.put("/users/updateTopics", auth, (req, res) => ok(res, null));
router.get("/order/getUserOrders", auth, (req, res) => ok(res, []));
router.post("/order/placeOrder", auth, (req, res) => ok(res, null));
router.post("/order/initiateOrder", auth, (req, res) => ok(res, null));
router.get("/getfaqs", (req, res) => ok(res, []));
router.post("/users/userFeedback", auth, (req, res) => ok(res, null, "Thanks!"));
router.post("/users/deductEventCredits", auth, (req, res) => ok(res, null));

app.use("/api", router);

// Health check
app.get("/", (req, res) => res.send("Frruit AI Backend running"));

// ═══════════════════════════════════════════════════════════════════════════════
// SOCKET.IO — Streaming Chat
// ═══════════════════════════════════════════════════════════════════════════════

io.of("/chat").use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    socket.user = jwt.verify(token, JWT_SECRET);
    socket.market = socket.handshake.query.market || "IN";
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.of("/chat").on("connection", (socket) => {
  socket.on("chatStream", async ({ message, prompt_id, flag, market }) => {
    try {
      const userId = socket.user.user_id;

      const pr = await pool.query(
        `SELECT 1 FROM ai_prompts WHERE prompt_id=$1 AND user_id=$2 AND active=true`,
        [prompt_id, userId]
      );
      if (!pr.rowCount) {
        socket.emit("error", { message: "Prompt not found" });
        return socket.disconnect();
      }

      // Save user message first
      await pool.query(
        `INSERT INTO ai_prompt_history(user_id, prompt_id, person, text, type, focus_type)
         VALUES($1,$2,'user',$3,'text',$4)`,
        [userId, prompt_id, message, flag]
      );

      // Build messages with history
      const hist = await getHistory(userId, prompt_id);
      const messages = [
        { role: "system", content: sysPrompt(flag) },
        ...hist.map(r => ({ role: r.person === "bot" ? "assistant" : "user", content: r.text || "" })),
        { role: "user", content: message },
      ];

      // Use web search model — returns full response + url citations
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-search-preview",
        messages,
        web_search_options: {},
      });
      const msg = completion.choices[0].message;
      const fullText = msg.content;
      const sources = extractSources(msg.annotations);

      // Fake-stream: emit in chunks so UI animates normally
      const CHUNK = 25;
      for (let i = 0; i < fullText.length; i += CHUNK) {
        socket.emit("response", { data: fullText.slice(i, i + CHUNK) });
        await new Promise(r => setTimeout(r, 15));
      }

      // Save bot response
      await pool.query(
        `INSERT INTO ai_prompt_history(user_id, prompt_id, person, text, type, focus_type, link)
         VALUES($1,$2,'bot',$3,'text',$4,$5)`,
        [userId, prompt_id, fullText, flag, JSON.stringify(sources)]
      );

      socket.emit("end", { data: sources });
      socket.disconnect();
    } catch (err) {
      console.error("Stream error:", err.message);
      socket.emit("error", { message: "Something went wrong. Please try again." });
      socket.disconnect();
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
initDB()
  .then(() => server.listen(PORT, () => {
    console.log(`\n🚀  Frruit AI Backend  →  http://localhost:${PORT}`);
    console.log(`📡  Socket.IO          →  http://localhost:${PORT}/chat`);
    console.log(`📧  OTPs sent via ${process.env.SMTP_USER}\n`);
  }))
  .catch((err) => { console.error("DB init failed:", err.message); process.exit(1); });
