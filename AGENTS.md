# AGENTS.md

## Project Overview

Two-package monorepo: AI Feedback Collector SaaS. Businesses get QR codes for customer feedback; AI (Gemini) analyzes sentiment/category/urgency plus satisfaction (1–5), fixable-problem flags, and retention risk in real-time.

- `client/` — React 19 + Vite 7 SPA (TypeScript strict, `.tsx` in `src/`)
- `server/` — Node.js + Express 5 + PostgreSQL API (TypeScript strict, `.ts` in `src/`)
- `shared/` — `@aifc/contracts` Zod schemas (single source of truth for server + client)
- `docs/` — research notes + `UPGRADE_PLAN.md` (upgrade phases 0–8)

## Critical Commands

```bash
# Client (from client/)
npm run dev          # Vite dev server (proxies /api and /setting to localhost:5000)
npm run build        # tsc -b && vite build (TypeScript MUST compile first)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest run

# Server (from server/)
npm run dev          # tsx watch src/index.ts (NOT nodemon — uses tsx)
npm run build        # tsc (outputs to dist/)
npm run start        # node dist/index.js
npm run typecheck    # tsc --noEmit
npm run test         # Vitest run
```

## Architecture Facts

- **Server entry**: `server/src/index.ts` → `server/src/app.ts` — Express app with routes mounted at `/api/auth`, `/api/feedback`, `/api/analytics`, `/api/ai`, `/api/organization`, `/api/settings`, `/api/payments`
- **Stripe webhook** route is defined BEFORE `express.json()` middleware — this is intentional (needs raw body)
- **Auth**: Better-Auth session cookies via Prisma adapter (`/api/auth/{*any}` catch-all; custom `/me`, `/has-org` in `features/auth/routes.ts`). No custom JWT.
- **Client API client**: `client/src/lib/api.ts` — Axios (cookie-based, no token header) + `client/src/lib/auth-client.ts` (Better-Auth client). Query state via TanStack Query v5, local state via Zustand.
- **Validation**: Zod v4 schemas per slice (`server/src/features/<domain>/schemas.ts` + `shared/` contracts), validated via `middleware/validation.ts`
- **AI**: Google Gemini Flash via Vercel AI SDK (`ai` + `@ai-sdk/google`; model set by `AI_MODEL`, default `gemini-3.6-flash` — `gemini-2.0-flash` was retired by Google). Service in `server/src/features/ai/service.ts` with fallbacks. Analysis outputs sentiment/category/urgency/rating plus `satisfactionEstimate` (1–5, distinct from tone), `fixableProblem` + `concreteIssue`, and `retentionRisk` (backfilled for pre-upgrade analyses). Chat streams via `POST /api/ai/:slug/chat/stream` (UI-message protocol → `useChat` + `DefaultChatTransport` in `client/src/features/ai/pages/AIPage.tsx`); blocking `POST /api/ai/:slug/chat` kept as fallback. History is sent as `messages[]` and converted with `convertToModelMessages`; feedback context is injected server-side as the system prompt.
- **Cron jobs**: Daily 2AM insight generation for Pro orgs + 7AM digest emails + hourly subscription sync (`server/src/jobs/generateInsights.ts`). Email via SMTP/nodemailer (`server/src/lib/mail.ts`, no-op when `SMTP_HOST` empty); urgency alerts + digests consumed by `server/src/workers/notification.worker.ts`
- **Team UI**: `client/src/features/organization/pages/MembersPage.tsx` at `/dashboard/team` (add/remove/change-role over existing member endpoints; existing-users-only)

## TypeScript Migration Status

Both packages have `tsconfig.json` with strict mode enabled and are fully TypeScript (`.ts`/`.tsx`). The server tsconfig keeps `allowJs: true, checkJs: false` for safety, but no `.js` sources remain in `src/`. Client build runs `tsc -b` before Vite — ensure no type errors before building.

Path alias `@/*` maps to `./src/*` in both packages.

## Formatting

Prettier config (root `.prettierrc`): single quotes, trailing commas, 100 char width, 2-space indent, LF line endings.

## Environment Variables

Copy `server/example.env` to `server/.env` and `client/example.env` to `client/.env`. Key vars:
- Server: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GEMINI_API_KEY`, `AI_MODEL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (+ `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL`, `S3_OBJECT_ACL`), `REDIS_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM`, `CLIENT_URL`
- Client: `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY` (+ price IDs)

## Docker (local dev)

```bash
cp server/example.env server/.env   # once; fill secrets (BETTER_AUTH_SECRET etc.)
docker compose up --build            # client vite:5173, server tsx:5000, postgres:5434, redis:6379
```

Dev stack with hot reload (bind mounts): `client` (vite dev :5173) → `server` (`tsx watch` :5000, runs `prisma migrate deploy` on start) → `postgres` 16 (host :5434 — :5433 belongs to another project). First DB setup: `docker compose up -d postgres`, then in `server/` run `npx prisma migrate dev --name <x>` and `npm run prisma:seed` (demo org `demo-coffee` for the first registered user). Demo login: register `demo@example.com` via UI, then seed. Prod images (`Dockerfile` + nginx) are a Phase 4 concern.

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`): lint → typecheck → test → build. Build depends on all three passing.
Postgres service + `npm ci --legacy-peer-deps` everywhere (arborist crash). Node 22.

## Production Deploy

```bash
cp server/example.env server/.env   # fill production secrets
docker compose -f docker-compose.prod.yml up --build -d
```

Prod stack: client nginx:3000 (proxies /api) → server node:5000 (`prisma migrate deploy` on start) → postgres 16 (internal 5432, host 5434).
