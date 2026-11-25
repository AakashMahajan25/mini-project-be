"use strict";

// Load .env before any module reads process.env at require time
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cors = require("cors");
const nodemailer = require("nodemailer");
const createNews = require("./news");
const createQuotes = require("./quotes");
const createLanguage = require("./language");
const createPortfolio = require("./portfolio");
const { createAI } = require("./ai");
const createRag = require("./rag");
const createAnswers = require("./answers");
const createDocuments = require("./documents");
const createEvidence = require("./evidence");
const createPipeline = require("./pipeline");
const createMarket = require("./market");
const createVoice = require("./voice");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "frruit_secret";

const pool = new Pool({ connectionString: process.env.POSTGRES_URI });
// Vercel AI Gateway when AI_GATEWAY_API_KEY is set, else OpenAI. The server boots without a key;
// AI features report themselves unavailable until one is set.
const openai = createAI();

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
    -- Multilingual: language of the row's text, and the English version the model works with
    ALTER TABLE ai_prompt_history ADD COLUMN IF NOT EXISTS language TEXT;
    ALTER TABLE ai_prompt_history ADD COLUMN IF NOT EXISTS text_en  TEXT;
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

const quotes = createQuotes({ auth, ok, fail });
const lang = createLanguage({ openai });
const portfolio = createPortfolio({ pool, openai, auth, ok, fail, quotes });
const rag = createRag({ pool, openai });
const answers = createAnswers({ pool, auth, ok, fail });
const documents = createDocuments({ pool, rag, answers, auth, ok, fail });
const evidence = createEvidence({ openai });
const pipeline = createPipeline({ pool, openai, lang, portfolio, rag, evidence, answers });
const market = createMarket({ pool, openai, quotes, auth, ok, fail });
const voice = createVoice({ openai, auth, ok, fail });
const live = io.of("/live");

// After each news refresh: embed the new articles, tell connected clients, refresh the AI market summary
const news = createNews({
  pool, openai, auth, ok, fail,
  onRefresh: async ({ added, byMarket, at }) => {
    if (added) live.emit("news:new", { added, byMarket, at });
    await rag.syncNews();
    market.onNews();
  },
});
market.events.on("movers", (payload) => live.emit("market:movers", payload));
market.events.on("summary", (payload) => live.emit("market:summary", payload));

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
    `SELECT user_id, name, email, role FROM ai_users WHERE user_id=$1`,
    [req.user.user_id]
  );
  if (r.rows[0]) r.rows[0].role = await answers.roleOf(req.user.user_id);
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
     WHERE user_id=$1 AND active=true AND kind='chat' ORDER BY "createdAt" DESC`,
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
  const rows = await answers.historyWithAnswers(req.user.user_id, prompt_id);
  ok(res, { rows, count: rows.length });
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
     WHERE user_id=$1 AND active=true AND kind='chat' AND prompt_text ILIKE $2 ORDER BY "createdAt" DESC`,
    [req.user.user_id, `%${prompt || ""}%`]
  );
  ok(res, groupByDate(r.rows));
});

router.get("/prompts/searchSuggestedQuestionPrompts", auth, (req, res) => ok(res, []));

// REST chat: same pipeline as the socket, answered in one response
async function restChat(req, res) {
  try {
    const { message, prompt_id, flag, language } = req.body;
    if (!message || !prompt_id) return fail(res, "message and prompt_id required");
    const turn = await pipeline.runTurn({ userId: req.user.user_id, promptId: prompt_id, message, flag, language });
    const text = await lang.translate(turn.englishAnswer, turn.target);
    const meta = await pipeline.finishTurn(turn, text);
    ok(res, { data: text, link: meta.citations.filter(c => c.cited), focus_type: turn.flag, ...meta });
  } catch (e) {
    fail(res, e.message, e.code === 404 ? 404 : 500);
  }
}

router.post("/prompts/triggerChat", auth, (req, res) => restChat(req, res));

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
router.use("/contentPrompt", documents.contentRouter);
// Document Q&A (Market Content GPT): answers only from the attached document, with page citations
router.post("/contentPrompt/triggerDocumentChat", auth, async (req, res) => {
  try {
    const { message, prompt_id, language } = req.body;
    if (!message || !prompt_id) return fail(res, "message and prompt_id required");
    const turn = await pipeline.runTurn({ userId: req.user.user_id, promptId: prompt_id, message, flag: "docs", language });
    const text = await lang.translate(turn.englishAnswer, turn.target);
    const meta = await pipeline.finishTurn(turn, text);
    res.json({ status: true, message: "Success", data: text, link: meta.citations.filter(c => c.cited), meta });
  } catch (e) {
    fail(res, e.message, e.code === 404 ? 404 : 500);
  }
});
router.post("/contentPrompt/triggerLinkGraph", auth, (req, res) => fail(res, "Coming soon."));
router.post("/contentPrompt/triggerAttachmentGraph", auth, (req, res) => fail(res, "Coming soon."));

// ── Stubs for everything else the frontend calls ──────────────────────────────
router.use("/stocks", quotes.router);
router.get("/stocks/getSuggestionPrompts", auth, (req, res) => ok(res, []));
router.use("/stocks", market.legacyRouter);

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
router.use("/portfolio", portfolio.router);
router.use("/news", news.router);
router.use("/documents", documents.router);
router.use("/answers", answers.router);
router.use("/review", answers.reviewRouter);
router.use("/market", market.router);
router.use("/voice", voice.router);
router.get("/rag/stats", auth, async (req, res) => ok(res, await rag.stats()));
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

function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    socket.user = jwt.verify(token, JWT_SECRET);
    socket.market = socket.handshake.query.market || "IN";
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}

io.of("/chat").use(socketAuth);

// Events: "stage" { stage } while working → "response" { data } chunks → "end" { data: sources, meta }
io.of("/chat").on("connection", (socket) => {
  socket.on("chatStream", async ({ message, prompt_id, flag, language }) => {
    try {
      const userId = socket.user.user_id;
      const turn = await pipeline.runTurn({
        userId, promptId: prompt_id, message, flag, language,
        onStage: (stage, info) => socket.emit("stage", { stage, ...(info || {}) }),
      });

      let answer;
      if (turn.target.code === "en") {
        // The answer is complete and verified before streaming, so stream it in chunks for the UI animation
        answer = turn.englishAnswer;
        const CHUNK = 25;
        for (let i = 0; i < answer.length; i += CHUNK) {
          socket.emit("response", { data: answer.slice(i, i + CHUNK) });
          await new Promise(r => setTimeout(r, 15));
        }
      } else {
        // Real stream of the translation back into the user's language
        socket.emit("stage", { stage: "translating", language: turn.target.name });
        answer = await lang.translate(turn.englishAnswer, turn.target, (delta) => socket.emit("response", { data: delta }));
      }

      const meta = await pipeline.finishTurn(turn, answer);
      socket.emit("end", { data: meta.citations.filter(c => c.cited), meta });
      socket.disconnect();
    } catch (err) {
      console.error("Stream error:", err.message);
      socket.emit("error", { message: err.code === 404 ? "Prompt not found" : "Something went wrong. Please try again." });
      socket.disconnect();
    }
  });
});

// Live updates for the dashboard and news feed: "news:new", "market:movers", "market:summary"
live.use(socketAuth);

// ─── Start ────────────────────────────────────────────────────────────────────
initDB()
  .then(news.initDB)
  .then(portfolio.initDB)
  .then(rag.initDB)
  .then(answers.initDB)
  .then(market.initDB)
  .then(documents.initStorage)
  .then(() => server.listen(PORT, () => {
    news.start();
    quotes.start();
    market.start();
    rag.resumePending();
    rag.syncNews();
    console.log(`\n🚀  Frruit AI Backend  →  http://localhost:${PORT}`);
    console.log(`📡  Socket.IO          →  http://localhost:${PORT}/chat`);
    console.log(`📧  OTPs sent via ${process.env.SMTP_USER}`);
    console.log(`🤖  AI provider        →  ${openai.provider === "gateway" ? "Vercel AI Gateway" : "OpenAI"}\n`);
    openai.credits().then(c => c && console.log(`💳  AI Gateway balance: $${c.balance.toFixed(2)}`)).catch(() => {});
  }))
  .catch((err) => { console.error("DB init failed:", err.message); process.exit(1); });
