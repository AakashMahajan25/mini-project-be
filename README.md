# Frruit AI backend

Express + Socket.IO server for Frruit, a finance assistant for Indian and US markets. It covers:

- web-search-grounded chat
- RAG retrieval over uploaded documents and saved news
- multilingual support
- a live news feed and market dashboard
- portfolio Q&A
- an evidence safeguard that records every answer for human review

Entry point: `server.js` (port 4000). The `services/`, `moleculer.config.js` and docker-compose files are leftovers from an older Moleculer version and are not used.

## Architecture

```
question ─► language.js   detect language, translate to English
         ─► pipeline.js   rewrite follow-ups as a standalone query
         ─► rag.js        hybrid retrieval: pgvector cosine + Postgres full-text, merged by reciprocal rank fusion
         ─► pipeline.js   answer in English with numbered evidence [S#] / [P1] (+ web search links)
         ─► evidence.js   verifier model checks each claim → confidence score → CANDIDATE or UNCERTAIN
         ─► language.js   translate the answer back (citation markers preserved)
         ─► answers.js    store answer, citations (with source timestamps), status history
```

| Module | Responsibility |
|---|---|
| `extract.js` | PDF (per page, via pdf.js), DOCX (with headings), DOC and TXT extraction; chunking into ~800-token sections with overlap, keeping page range + section heading |
| `rag.js` | Embeddings (`text-embedding-3-small`, 1536 dims), `rag_documents` / `rag_chunks` tables (HNSW + GIN indexes), upload processing queue, news → store sync, hybrid search |
| `documents.js` | Upload API (`/api/documents`), signed file links for citations, the Market Content GPT document flow (`/api/contentPrompt/*`) |
| `pipeline.js` | One chat turn end-to-end (REST `triggerChat`, `triggerDocumentChat`, socket `chatStream`) |
| `evidence.js` | Citation parsing, claim verification, confidence score, UNCERTAIN banner and review footer (added in code, not by the model) |
| `answers.js` | `ai_answers`, `ai_answer_citations`, `ai_answer_feedback`, `ai_answer_status_log`; feedback API; reviewer queue (`/api/review/*`) |
| `market.js` | Live movers (CNBC quotes, 15 min), news-mention trending, hourly AI market summary that cites its headlines; legacy dashboard endpoints |
| `news.js` | RSS ingestion every 10 min (+ optional Finnhub API), AI sentiment/ticker tagging, feed API |
| `quotes.js` | CNBC quote client and the ticker strip |
| `portfolio.js` | Holdings, live valuation, portfolio context for chat |
| `voice.js` | Speech-to-text fallback for browsers without the Web Speech API |

Socket.IO namespaces:

- `/chat` streams answers. Events: `stage`, `response`, `end`.
- `/live` pushes `news:new`, `market:movers` and `market:summary` to the dashboard and the news feed.

### Evidence safeguard

The confidence score is `0.5 × support + 0.25 × coverage + 0.25 × retrieval`:

- **support** comes from the verifier's verdict on each claim. The values are: supported 1, general knowledge 0.8, web-cited 0.75, partial 0.5, uncited 0.2, unsupported 0.
- **coverage** is the share of factual claims that carry a citation.
- **retrieval** is the best similarity among cited excerpts, or a score based on the number of web sources.

An answer is marked **UNCERTAIN** when any of these hold:

- it has no sources at all
- the verifier says the sources don't answer the question
- more than 20% of its claims are unsupported
- the verifier could not run
- confidence is below `CONFIDENCE_THRESHOLD` (default 0.6)

UNCERTAIN answers get a warning banner and a "Not verified against a source" list. Every answer ends with *"Candidate answer for human review, not investment advice"* and the time the sources were checked.

Answer statuses are `CANDIDATE`, `UNCERTAIN`, `UNDER_REVIEW`, `APPROVED`, `REJECTED` and `NEEDS_REVISION`. A user's thumbs-down sets `NEEDS_REVISION`. Reviewers, configured with `REVIEWER_EMAILS`, decide from the `/review` page. Every change is logged in `ai_answer_status_log`.

## Setup

1. **Database.** Postgres 16 with pgvector:
   ```bash
   docker run -d --name frruit-postgres --restart unless-stopped \
     -e POSTGRES_USER=… -e POSTGRES_PASSWORD=… -e POSTGRES_DB=frruit_db \
     -v frruit-pgvector-data:/var/lib/postgresql/data -p 127.0.0.1:5435:5432 pgvector/pgvector:pg16
   ```
   The server creates the tables and the `vector` extension on boot.
2. **Environment.** Copy `.env.example` to `.env` and fill it in. `OPENAI_API_KEY` is required for chat, embeddings, verification, translation, tagging and voice. Without it the server still boots, but every AI feature reports that it is unavailable.
3. `npm install`, then `npm run dev`.
4. **Optional shared corpus.** Put PDFs in `seed-docs/`, then run `npm run seed:docs`.

Uploaded files are stored in `storage/documents/`, which is gitignored. Set `UPLOAD_DIR` to change it.

## Testing

- `npm test` runs the unit tests: extraction, chunking, citation parsing and the evidence gate.
- `npm run eval` runs the evaluation through the real API against a running backend. It uploads `test/fixtures/acme_annual_report.pdf` (a fictional 3-page report) and asks 30 questions from `test/eval/questions.json`. It reports:
  - retrieval hit@k
  - citation accuracy
  - answer accuracy
  - evidence-gate pass rate
  - the UNCERTAIN rate on unanswerable questions
  - the citation rate of chat answers
  - latency

  The report is written to `test/eval/results/`. Pass `-- --api http://host:port` to target another server.
- **Offline testing.** `node test/mock-openai.js` starts a fake OpenAI API on :4010. Run the backend with `OPENAI_BASE_URL=http://127.0.0.1:4010/v1 OPENAI_API_KEY=mock`. **Use a separate database for this**: the mock's embeddings are not compatible with real ones. Put `MOCK_NOCITE` in a question to get an uncited answer, which exercises the UNCERTAIN path.
