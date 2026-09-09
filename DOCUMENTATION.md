# AI Feedback Collector: Technical Deep Dive

## 🌟 Product Vision
The **AI Feedback Collector** is a SaaS platform designed to transform raw, overwhelming customer feedback into clear, actionable business intelligence. By leveraging a QR-code-driven collection method and advanced LLM analysis, it bridges the gap between customer voices and data-driven decisions.

---

## 🏗️ System Architecture

### High-Level Overview
The application is a two-package monorepo (`client/` + `server/`)with a PostgreSQL database, plus specialized third-party integrations for AI and Payments.

```mermaid
graph TD
    User((Customer)) -->|Scan QR| Client[React Frontend]
    Admin((Business Owner)) -->|Dashboard| Client
    Client -->|API Requests| Server[Node/Express Backend]
    Server -->|Queries| DB[(PostgreSQL)]
    Server -->|Analysis| AI[Gemini 2.0 via Vercel AI SDK]
    Server -->|Payments| Stripe[Stripe API]
    Server -->|Images| S3[S3-Compatible Storage]
```

### Key Technical Decisions
- **AI Engine (Gemini 2.0 Flash)**: Chosen for its speed and native support for structured JSON output, which is critical for parsing sentiment and keywords.
- **Vite Proxy**: Used to eliminate CORS issues during development and provide a seamless dev experience.
- **Stripe Webhooks**: Implemented to ensure the application's subscription state is always in sync with the payment processor, handling edge cases like failed renewals and cancellations.
- **Better Auth**: Session-based authentication (email/password via Better Auth with the Prisma adapter), replacing custom JWT + refresh token handing.

---

## 📊 Database Schema

### Models & Relationships
1.  **User**: Auth + profile data (managed by Better Auth.>
    - *Link*: Can belong to many Organizations via memberships.
2.  **Organization**: Contains business details, custom AI categories, and a unique slug for the QR landing page.
    - *Link*: Belongs to many Users. Contains many Feedbacks.
3.  **Feedback**: Stores the raw message and AI-enriched analysis (sentiment, rating, keywords).
    - *Link*: Belongs to an Organization.
4.  **Subscription**: Persisted Stripe subscription state (plan, status, period end,, linked to an Organization).
    - *Link*: Belongs to an Organization.

---

## 🤖 AI Pipeline
The core "magic" happens in the `analyzeFeedback` pipeline:
1.  **Input**: Raw text from a customer.
2.  **Context**: The organization categories (used as the AI context)..
3.  **Processing**: A structured prompt is sent to `gemini-2.0-flash` with a strict JSON schema.
4.  **Enrichment**: The AI returns sentiment (Positive/Negative/Neutral), an inferred 1-5 rating, key themes, and an urgency score.
5.  **Storage**: The enriched data is saved, enabling real-time dashboard analytics.

---

## 💳 SaaS & Monetization
The app features a fully functional subscription engine:
- **Plans**: Basic and Pro tiers.
- **Access Control**: Middleware checks for active subscriptions and redirects users to a "Reactivate" or "Payment" page if their status is invalid.
- **Billing Portal**: Integrated Stripe Customer Portal allows users to manage their own billing without manual support.

---

## 🚀 Deployment Strategy
- **Local dev**: Docker Compose(client vite :5173, server tsx :5000, postgres :5434; hot reload.).
- **Production**: Containerized via Docker Compose prod stack(nginx + node + postgres, `prisma migrate deploy` auto-runs).
- **CI/CD**: GitHub Actions -- lint, typecheck, test, build,with a Postgres service).

---

## Reliability & Background Jobs (BullMQ + Redis / Upstash)

Heavy AI work (daily insight generation, future batch analysis) is offloaded from the HTTP request path via **BullMQ**.

| Piece | Role |
|-------|------|
| **Redis** (`REDIS_URL`) | Shared store for queues and distributed rate limiting. Local: `redis:7-alpine` in `docker-compose.yml`. Production: **Upstash** Redis (`rediss://…`). |
| **BullMQ** | Durable job queue. Queues: `aifc-insights`, `aifc-default`. Workers run in the same Node process (or can be split later). |
| **Fallback** | If `REDIS_URL` is unset or Redis is down, the app still boots: rate limits fall back to in-memory, and the daily insight cron runs jobs **in-process**. |

### Key files
- `server/src/lib/redis.ts` — shared ioredis client
- `server/src/lib/queue.ts` — queue helpers + job names
- `server/src/workers/insights.worker.ts` — BullMQ worker for insight generation
- `server/src/jobs/generateInsights.ts` — cron that enqueues (or falls back)
- `server/src/middleware/rate-limit.ts` — Redis-backed `express-rate-limit` store when available

### Local setup
```bash
docker compose up -d redis   # or full stack
# server/.env
REDIS_URL=redis://localhost:6379
```

### Production (Upstash)
1. Create a Redis database on [upstash.com](https://upstash.com).
2. Copy the Redis URL (`rediss://…`) into `REDIS_URL`.
3. Deploy. Health check (`GET /health`) reports `"redis": "connected"`.

---

## Product loop (collect → understand → act)

### Collection (public page)
- Ultra-short form: feedback text + optional star rating + optional context chips
- Branded header (logo / name), mobile-first, anonymous by default
- Min length reduced to 5 characters to reduce drop-off

### Understanding (AI)
Structured analysis now includes:
- sentiment, urgency, category, rating, keyPoints, keywords
- **themes**, **rootCause**, **suggestedAction**, confidence
- Human correction endpoint: `PATCH /api/feedback/:slug/:id/correct`

### Action (close the loop)
- Status: `open` | `in_progress` | `resolved` | `ignored`
- Internal notes + optional owner reply
- Dashboard **“Top things to fix this week”** + **% acted on**
- Stats: `highUrgencyOpen`, `actedOnRate`, `topActions`

### Migration
Run after pull:
```bash
cd server && npx prisma migrate deploy
# or for local dev:
npx prisma migrate dev
```
