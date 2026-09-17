# Deployment Guide - AI Feedback Collector App

> Docker-only deployment guide. Current strategy: Docker Compose for both
> local dev and production, PostgreSQL 16, Prisma `migrate deploy` on server
> start. See `DOCUMENTATION.md` (Deployment Strategy), `docker-compose.yml`
> (dev), `docker-compose.prod.yml` (prod), and `docs/UPGRADE_PLAN.md`.

## Prerequisites

- Docker + Docker Compose
- API keys for: Stripe (Test/Live Mode), Gemini AI, and S3-compatible storage
- Optional: SMTP credentials for email alerts (or local Mailpit on `localhost:1025`; empty `SMTP_HOST` disables sending safely)
- Production secrets in `server/.env` (copy from `server/example.env`)

## 1. Local dev (hot reload)

```bash
cp server/example.env server/.env   # once; fill secrets (BETTER_AUTH_SECRET etc.)
docker compose up --build
```

- client Vite dev: http://localhost:5173
- server tsx watch: http://localhost:5000 (`GET /health`)
- postgres 16: host port 5434
- redis 7: host port 6379 (powers BullMQ queues + distributed rate limiting;
  the app still boots with in-memory fallbacks if Redis is down)
- Email alerts + 7AM digest run inside the server process (BullMQ worker, no
  extra service). Set `SMTP_HOST` etc. in `server/.env` to enable; without it
  sends are logged + skipped.
- First DB setup: `docker compose up -d postgres`, then in `server/` run
  `npx prisma migrate dev --name <x>` and `npm run prisma:seed`.

## 2. Production (Docker Compose)

```bash
cp server/example.env server/.env   # fill production secrets
docker compose -f docker-compose.prod.yml up --build -d
```

- client nginx:3000 (proxies `/api` to server)
- server node:5000 (`prisma migrate deploy` auto-runs on start)
- postgres 16 (internal port 5432 only — no host port published)
- redis: use Upstash in production — set `REDIS_URL=rediss://…` in
  `server/.env` (see `DOCUMENTATION.md` → Reliability & Background Jobs)

## 3. Post-deployment steps

1. **Update client origin**: set `CLIENT_URL` (and `BETTER_AUTH_URL`) in `server/.env`
   to the public client URL so CORS + Better-Auth cookies work.
2. **Configure Stripe webhooks**:
   - In Stripe Dashboard → Developers → Webhooks add endpoint:
     `https://your-server-url/api/payments/webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
     `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy server.

## 4. Verification

- Visit the client URL.
- Register a new user → create organization → QR code appears.
- Submit public feedback and check AI analysis on the dashboard.

## 5. Troubleshooting

- **Vite `Failed to resolve import "@aifc/contracts"`**: the client image was
  built without `shared/`. All Dockerfiles use repo-root context — rebuild
  cleanly: `docker compose build --no-cache client && docker compose up --build`.
- **Stale `node_modules` after Dockerfile changes**: named volumes persist
  across rebuilds. If a service's install layout changed, drop just that
  volume, e.g. `docker volume rm feedwise_client-node-modules`
  (never `docker compose down -v` — that deletes the `pgdata` database).
- **npm `ETIMEDOUT`/`ECONNRESET` during image builds**: transient registry
  flakiness; Dockerfiles carry retry config (`fetch-retries 5`), just rerun
  the build.
