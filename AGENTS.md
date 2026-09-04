# AGENTS.md

## Project Overview

Two-package monorepo: AI Feedback Collector SaaS. Businesses get QR codes for customer feedback; AI (Gemini) analyzes sentiment/category/urgency in real-time.

- `client/` — React 19 + Vite 7 SPA (TypeScript config, but many `.jsx` files remain)
- `server/` — Node.js + Express 5 + MongoDB API (TypeScript config, but source files are `.js` in `src/`)

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

- **Server entry**: `server/src/index.js` — Express app with routes mounted at `/api/auth`, `/api/feedback`, `/api/ai`, `/api/user`, `/api/setting`, `/api/payments`, `/api/`
- **Stripe webhook** route is defined BEFORE `express.json()` middleware — this is intentional (needs raw body)
- **Auth**: JWT access tokens (15min) in localStorage + refresh tokens (15d) in HTTP-only cookies. Refresh token rotation on each refresh.
- **Client API client**: `client/src/services/api.js` — Axios with auto-refresh interceptor. Skips refresh for `/auth/login`, `/auth/register`, `/auth/logout`.
- **Validation**: Zod schemas in `server/src/middleware/schemas.js`, validated via `validationMiddleware.js`
- **AI**: Google Gemini 2.0 Flash via `@google/genai` SDK. Retry logic with exponential backoff in `server/src/services/aiServices.js`
- **Cron job**: Daily 2AM insight generation for Pro orgs (`server/src/jobs/generateInsights.js`)

## TypeScript Migration Status

Both packages have `tsconfig.json` with strict mode enabled, but source files are still `.js`. The server tsconfig has `allowJs: true, checkJs: false` to allow incremental migration. Client build runs `tsc -b` before Vite — ensure no type errors before building.

Path alias `@/*` maps to `./src/*` in both packages.

## Formatting

Prettier config (root `.prettierrc`): single quotes, trailing commas, 100 char width, 2-space indent, LF line endings.

## Environment Variables

Copy `server/example.env` to `server/.env` and `client/example.env` to `client/.env`. Key vars:
- Server: `MONGODB_URI`, `JWT_SECRET_ACCESS`, `JWT_SECRET_REFRESH`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`
- Client: `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`

## Docker (local dev)

```bash
cp server/example.env server/.env   # once; fill secrets (BETTER_AUTH_SECRET etc.)
docker compose up --build            # client vite:5173, server tsx:5000, postgres:5434
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
