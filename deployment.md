# Deployment Guide - AI Feedback Collector App

> Supersedes the old Render (backend) + Vercel (frontend) + MongoDB Atlas guide.
> Current strategy: Docker Compose for both local dev and production, PostgreSQL 16,
> Prisma `migrate deploy` on server start. See `DOCUMENTATION.md` (Deployment Strategy),
> `docker-compose.yml` (dev), `docker-compose.prod.yml` (prod), and `UPGRADE_STRATEGY.md`.

## Prerequisites

- Docker + Docker Compose
- API keys for: Stripe (Test/Live Mode), Gemini AI, and S3-compatible storage
- Production secrets in `server/.env` (copy from `server/example.env`)

## 1. Local dev (hot reload)

```bash
cp server/example.env server/.env   # once; fill secrets (BETTER_AUTH_SECRET etc.)
docker compose up --build
```

- client Vite dev: http://localhost:5173
- server tsx watch: http://localhost:5000 (`GET /health`)
- postgres 16: host port 5434
- First DB setup: `docker compose up -d postgres`, then in `server/` run
  `npx prisma migrate dev --name <x>` and `npm run prisma:seed`.

## 2. Production (Docker Compose)

```bash
cp server/example.env server/.env   # fill production secrets
docker compose -f docker-compose.prod.yml up --build -d
```

- client nginx:3000 (proxies `/api` to server)
- server node:5000 (`prisma migrate deploy` auto-runs on start)
- postgres 16 (internal 5432, host 5434)

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
