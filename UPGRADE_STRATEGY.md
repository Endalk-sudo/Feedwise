# Upgrade Strategy — AI Feedback Collector v2.0

**Status:** Active
**Branch:** `stack-upgrade`
**Date:** 2026-09-04

## 1. Goal

Turn the prototype into a production-grade SaaS: strict TypeScript, tested,
containerized, CI-gated, with a modern data/auth/AI stack — without carrying
legacy baggage forward.

## 2. Principles

1. **Hard switch, no shims.** MongoDB/Mongoose, custom JWT, React Router, and
   Context API are deleted, not run in parallel. No data migration (explicit
   owner decision).
2. **Latest stable, never RCs.** Prisma stays on the v6 line (v7/v8 change the
   config format and better-auth targets v6-style clients). Everything else
   tracks its latest stable major/minor.
3. **Slice by slice, verified.** One feature slice at a time. Nothing merges
   forward until its gate passes.
4. **Types are the safety net.** `strict` + `noUncheckedIndexedAccess` stay on.
   No `any` leakage in new code; SDK drift is isolated behind narrow view
   types/casts with TODOs.
5. **Feature-based structure.** `server/src/features/<domain>/{routes,service,schemas}.ts`,
   `client/src/features/<domain>/{pages,hooks,api,types,components}`.
   Shared code lives in `lib/` (client) and `lib|middleware|utils|jobs` (server).

## 3. Target stack

| Layer | Choice |
|---|---|
| DB / ORM | PostgreSQL 16 + Prisma 6.19.x, `prisma migrate dev`, `prisma/seed.ts` |
| Auth | better-auth 1.7.x (Prisma adapter), session cookies; no custom JWT |
| API | Express 5.2.x, Zod v4 validation, `express-rate-limit`, security via `helmet` |
| AI | **Vercel AI SDK `ai@7.0.92` + `@ai-sdk/google@4.0.63`** (verified pairing Sept 2026 — `ai@7` ships with `@ai-sdk/google 4.0.x`; old `@google/genai` direct removed). `generateText` + `Output.object/array` with Zod v4 schemas, `maxRetries: 3`, existing fallbacks kept. Model via `AI_MODEL` (default `gemini-2.0-flash`); `GEMINI_API_KEY` mapped via `createGoogleGenerativeAI`. Requires Node 22+ |
| Payments | Stripe latest v22, isolated behind `SubscriptionView` casts |
| Client routing | TanStack Router (code-based, no vite plugin) |
| Server state | TanStack Query v5 (no `onSuccess` in `useQuery` — sync via effects) |
| Client state | Zustand v5 (auth/UI/feedback stores) |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) + lucide-react (real types, no shim) |
| Tests | Vitest ^4 (better-auth peer range forces v4 over v5), RTL, Playwright later |
| Tooling | `tsx` dev, `tsc && tsc-alias` build, ESLint + Prettier, GitHub Actions CI |
| Runtime | Docker Compose (client nginx:3000, server node:5000, postgres:5433) |

### Known toolchain quirks (do not "fix" differently)

- **npm arborist crash** (`edgesOut`) on this graph → always install with
  `--legacy-peer-deps` (documented in CI + AGENTS.md). Root cause: better-auth
  `peerOptional vitest ^2||^3||^4` vs vitest 5; we pin vitest ^4.
- **Server `@/` alias + NodeNext:** non-relative imports MUST carry `.js`
  extensions (`@/lib/prisma.js`); `tsc-alias` rewrites them in `dist/`.
- **Prisma groupBy `_count`:** with `_count: true` the type is a flat `number`.
  Keep `_count: true` in stats queries (verified against generated types).
- **`req.params` under Express 5 types** is `string | string[]` → cast
  `req.params.slug as string` (Zod already validated it).

## 4. Phases

### Phase 1 — Dependencies & baseline
Upgrade matrix (§3), remove `react-router-dom` + `nodemon`, AI-SDK compat
check, clean install, `prisma generate`.
**Gate:** `npm ls` clean · `prisma generate` OK.

### Phase 2 — Backend slices (order matters)
1. Prisma final (schema ✓) → `migrate dev` → seed.
2. Auth (better-auth mount, session middleware).
3. Organization → Feedback → Analytics → AI → Payments → Settings/Jobs.
4. Delete legacy: `models/*.js`, `controllers/*.js`, old `routes/*.js`,
   `config/{db,jwt}.js`, `services/aiServices.js`, `utils/stripe.js`,
   `uploadHelper.js`, `services/cloudinaryServices.js`, old jobs, `src/index.js`.
**Gate per slice:** `typecheck && lint && test && build` + `GET /health`.

### Phase 3 — Frontend slices
1. Foundation: delete `types/lucide-react.d.ts`, drop router vite plugin,
   fix `router.tsx` (redirects, registered routes only), `auth-client.ts`
   (`authClient.signIn.email()`), unified auth store, Query-v5 hooks,
   `index.html` → `/src/main.tsx`.
2. Pages: auth → org-setup → dashboard → feedback → analytics → AI chat →
   settings → public feedback → landing.
3. Delete legacy: `App.jsx`, `main.jsx`, `context/`, `services/`, old
   `pages/`, `components/`, `auth/`, per-file `.css`, stale tests.
   Add shadcn/ui components on demand.
**Gate per slice:** `typecheck && lint && test && build` + dev smoke of route.

### Phase 4 — Infra & docs
Compose, Dockerfiles (`migrate deploy` on start), env templates, CI
(Postgres service, legacy-peer-deps with comment), AGENTS.md + PRD status.
**Final gate:** clean tree, full local CI-equivalent, seeded click-through
(register → org → submit → dashboard → AI chat).

## 5. Environment

See `server/example.env`. New/changed keys: `DATABASE_URL` (postgres),
`BETTER_AUTH_SECRET` (≥32 chars), `BETTER_AUTH_URL`, `AI_MODEL` (optional),
existing `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` per chosen SDK.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Stripe v22 type drift | `SubscriptionView` casts; Stripe CLI webhook test |
| TanStack latest-1.x drift | Code-based API is stable; typecheck catches it |
| npm arborist crash returns | Pinned vitest 4 + legacy flag; revisit on better-auth update |
| Scope creep | This file + PRD are the scope; new ideas go to backlog |

## 7. Progress log

- [x] Server: Prisma 6.19.3 aligned, client generated, `tsc && tsc-alias` build green
- [x] Server: Better-Auth fields in schema, Zod v4 validation, new-SDK AI service shape
- [x] Phase 1 dependency upgrades (client vitest→4, stripe-js→9, router→1.170, query→5.102, react→19.2; server stripe→22.6.1; dropped router-vite-plugin + nodemon). AI SDK decision: stay on `@google/genai` direct + zod validation (provider pairing unverifiable)
- [x] Phase 1b (2026-09-04): switched AI to **Vercel AI SDK `ai@7.0.92` + `@ai-sdk/google@4.0.63`** (pairing now verifiable; `@google/genai` + server `axios` removed; `stripe→22.6.1`, `express→5.2.1`, `zod→4.5.4`). Client: added `@tailwindcss/vite`, swapped wrong `@tanstack/router-devtools` → `@tanstack/react-router-devtools@1.167.1`, dropped router vite plugin, `index.html` → `main.tsx`, `index.css` customs → `@utility` (v4). Node 20→22 (Dockerfiles + CI, required by `ai@7`). Gates: server `typecheck/prisma generate/build` green, client `vite build` green + vitest 8/8; client `typecheck` (98) + lints are pre-existing slice debt (Phase 3)
- [ ] Phase 2 backend slices + legacy deletion
- [ ] Phase 3 frontend slices + legacy deletion
- [ ] Phase 4 infra + docs + final gate
