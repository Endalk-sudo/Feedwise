# 🚀 FeedWise (SaaS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/frontend-React%2019-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016-green)](https://www.postgresql.org/)

**FeedWise** is a full-stack SaaS platform designed to help businesses turn customer feedback into actionable insights instantly. Using QR codes for collection and Gemini AI for analysis, it categorizes, measures sentiment, and provides growth recommendations in real-time.

---

## 📖 Project Overview
The goal of this project is to simplify the feedback loop for small to medium businesses. Customers scan a QR code, leave their thoughts, and the AI handles the rest—categorizing the input, detecting sentiment, and alerting owners to urgent issues.

### 💡 Key Features
- **🤖 Smart AI Analysis**: Powered by Gemini 2.0, providing sentiment detection, satisfaction scoring (1–5, distinct from tone), fixable-problem flags, retention-risk signals, priority scoring, and keyword extraction.
- **💳 SaaS-Ready**: Integrated Stripe payments for Basic and Pro subscription tiers.
- **📊 Interactive Dashboard**: Professional analytics using modern charting for sentiment trends and category breakthroughs.
- **📱 QR Collection**: Unique, organization-specific landing pages and QR codes for easy physical-to-digital feedback.
- **🔗 Collect Page**: Shareable `/feedback/<slug>` link plus QR code with PNG download and regenerate, in Dashboard → Settings → Collect feedback.
- **💬 Admin AI Chat**: An intelligent assistant to help admins query their own feedback data using natural language.
- **👥 Team Collaboration**: Invite staff by email with owner/admin/member roles (`/dashboard/team`).
- **📧 Email Alerts**: Immediate high-urgency / low-satisfaction alerts plus a daily digest (SMTP, safe no-op when unconfigured).
- **🔐 Secure Auth**: Better Auth session-based authentication with the Prisma adapter.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, TanStack Router + Query, Zustand, Tailwind v4 + custom UI kit (`client/src/components/ui`), Lucide, Sonner, Recharts.
- **Backend**: Node.js 22+, Express 5, Prisma ORM
- **Shared**: `@aifc/contracts` — Zod v4 schemas as the single source of truth for client + server (`file:../shared`, built to `shared/dist`)
- **Database**: PostgreSQL 16
- **Auth**: Better Auth (email/password, session cookies, Prisma adapter)
- **Reliability & Background Jobs**:
  - **BullMQ**: Durable job queue for AI insight generation, batch analysis, urgency-alert emails, and daily digests (prevents request timeouts).
  - **Redis / Upstash (optional)**: Shared cache + queue backend and distributed rate limiting (stops AI spam). Local Redis via Docker; production uses Upstash — or omit `REDIS_URL` entirely for in-memory fallbacks (e.g. Render without Redis).
- **Integrations**: 
  - **AI**: Google Gemini 2.0 Flash via Vercel AI SDK (`ai` + `@ai-sdk/google`)
  - **Payments**: Stripe (Checkout & Billing Portal) + webhooks + hourly subscription sync
  - **Email**: SMTP via nodemailer — high-urgency alerts + 7AM digest (`server/src/lib/mail.ts`, `workers/notification.worker.ts`)
  - **Storage**: S3-compatible object storage (Org Logos)
  - **QR**: `qrcode` package (server-generated PNG data URLs, regenerable per org)
- **Quality**: TypeScript (strict), Zod v4 validation, Vitest, ESLint + Prettier, GitHub Actions CI, Docker Compose (dev + prod)

---

## 🏗️ Technical Deep Dive
For a detailed look at the architecture, database schema, and technical decisions, please check out the **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v22+ — required by the Vercel AI SDK v7)
- PostgreSQL 16 + Redis 7 (both spin up in Docker Compose)
- Stripe, Gemini, and S3-compatible storage credentials
- Optional: SMTP credentials for email alerts (or local Mailpit on `localhost:1025`; empty `SMTP_HOST` disables sending safely)

### Installation

> Three packages: `client/`, `server/`, `shared/` (`@aifc/contracts`).
> Always install with `npm ci --legacy-peer-deps` (npm arborist crash on
> this graph). Install + build `shared/` first;
> `client`/`server` consume it via `file:../shared` (client `predev`/`prebuild`
> hooks rebuild contracts automatically).

1. **Clone the repo**
   ```bash
   git clone https://github.com/Endalk-sudo/AI-Feedback-collector-app.git
   cd AI-Feedback-collector-app
   ```

2. **Setup shared contracts**
   ```bash
   cd shared
   npm ci --legacy-peer-deps
   npm run build
   cd ..
   ```

3. **Setup Server**
   ```bash
   cd server
   npm ci --legacy-peer-deps
   cp example.env .env   # fill in your keys
   npm run dev
   ```

4. **Setup Client**
   ```bash
   cd ../client
   npm ci --legacy-peer-deps
   cp example.env .env   # VITE_API_URL etc. (empty = same-origin, Vite proxies /api)
   npm run dev
   ```

5. **Seed demo data** (in `server/`, with Postgres running):
   ```bash
   npx prisma migrate dev
   npm run prisma:seed   # demo org `demo-coffee`
   ```
   Then register `demo@example.com` in the UI to explore with the seeded org.

### Docker (recommended)
```bash
cp server/example.env server/.env   # once; fill secrets (BETTER_AUTH_SECRET etc.)
docker compose up --build            # client :5173, server :5000, postgres :5434, redis :6379
```
If the client container was created before the Dockerfiles moved to repo-root
context, drop the stale volume first: `docker volume rm feedwise_client-node-modules`
(never `docker compose down -v` — that deletes the database).

---

## 🌍 Deployment
This app deploys via **Docker Compose** or **Render Blueprint**. Two compose files ship: `docker-compose.yml` (local dev, hot reload) and `docker-compose.prod.yml` (nginx + node + postgres prod stack; Prisma migrate auto-runs on start). See the [Deployment Guide](./deployment.md) and [`docs/UPGRADE_PLAN.md`](./docs/UPGRADE_PLAN.md) for details.

### Render (Docker + Neon Postgres, no Redis)
A `render.yaml` Blueprint ships at the repo root: Docker web services for server (`/health`) and client (nginx, `BACKEND_URL`-templated `/api` proxy) plus an external Neon database.
```bash
# 1. Create a Neon project, copy the pooled URL (?sslmode=require)
# 2. Render Dashboard → New → Blueprint → select repo, fill prompts
#    (DATABASE_URL, BETTER_AUTH_URL/CLIENT_URL, GEMINI_API_KEY, STRIPE_*, S3_*)
# 3. Deploy server first, verify /health (migrations auto-run)
# 4. Set client BACKEND_URL to https://<server>.onrender.com, deploy client
# 5. Point the Stripe webhook at https://<server>.onrender.com/api/payments/webhook
```
Local `docker compose` dev is unaffected by the Blueprint.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## ✨ Developed with ❤️ by [Endalk](https://github.com/Endalk-sudo)
*Passionate about building AI-driven solutions that solve real-world problems.*