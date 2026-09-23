# Feedwise E2E + Integration + Browser Test Report — ROUND 2 (fresh run)

Date: 2026-09-20 ~20:00 UTC. Fresh live stack: postgres:5434, redis:6379, server tsx:5000, client vite:5173. Real Chromium 151 (playwright-core, `--no-sandbox`). Fresh test users/orgs (`r2_*`, `r2b_*`) so no stale-data masking.

## Verdict (Round 2)

Core loop green again: register -> org -> public submit -> list/stats -> status/correct/verify -> CSV -> tokens -> webhooks -> Stripe test checkout/portal, all PASS. Browser journey 7/7 PASS. Unit suites green (server 65/65, client 3/3). Typechecks green (both EXIT 0). The P0 AI finding is now CONFIRMED WITH ROOT CAUSE: `AI analysis failed: The operation was aborted due to timeout` in the server log on both positive and negative probes — Gemini calls time out in this environment, and the fallback stores fake-neutral rows (`Neutral/Low/3/false`, `confidence 0.1`).


Date: 2026-09-20. Live stack: postgres:5434, redis:6379, server tsx:5000, client vite:5173. Real Chromium 151 (Playwright-core, `--no-sandbox`).

## Verdict

App boots and core loop works end to end: register -> create org -> public feedback submit -> dashboard list/stats -> status/correct/verify -> CSV export -> token API -> webhooks -> Stripe checkout/portal (test mode). 11/13 browser checks passed on first run; after fixing the harness (4-field register form) the full user journey passed 4/4. Unit suites green: server 65/65, client 3/3. Typechecks green both packages. Lint: 0 errors (47 `any` warnings, server).

## Phase 0 — Readiness (PASS with findings)

- `shared` build OK. `prisma migrate deploy`: no pending migrations.
- server `tsc --noEmit` EXIT 0. client `tsc --noEmit` EXIT 0.
- FINDING F0.1 (P2): `server/.env` has `DATABASE_URL` wrapped in double quotes, so bare `npx prisma ...` fails with P1012 (`URL must start with postgresql://`). Workaround: export unquoted `DATABASE_URL` env var first. Fix: strip quotes in `.env` or document the export.
- FINDING F0.2 (P2): typecheck/lint/test take >30s (needed background runs). CI unaffected, local DX only.
- FINDING F0.3 (P1): no browser installed in dev env; used system Playwright cache (`chromium-1234`, headless shell). Recommend adding `playwright` as a client devDependency + `client/e2e/` spec dir so E2E is reproducible.

## Phase 1 — API integration, live server (PASS, 30+ probes)

Auth: sign-up 200 + session cookie; `GET /api/auth/me` 200; `GET /api/auth/has-org` 200 (`hasOrganization:false` pre-org). No-cookie `me`/`has-org` correctly 401. Sign-in without Origin header returns Better-Auth `MISSING_OR_NULL_ORIGIN` (expected; browser sends Origin).

Org + feedback loop: create org 200 (QR data URL issued); public `GET /organization/:slug` 200; public `POST /feedback/:slug` 201 with full analysis payload; authed list 200; stats 200 (`bySentiment/byCategory/byUrgency/byStatus`, `actedOnRate`); unauthed list 401; status PATCH 200; draft-reply 200 (fluent apology text); correct PATCH 200; verify PATCH 200 with `verificationSource:"manual"`; unknown org 404; empty-text submit 400 (`Please share a bit more detail`).

Analytics: sentiment/categories/heatmap/issues/alerts/staff-performance/export-CSV all 200. CSV header correct (`satisfaction,fixable,concrete_issue,retention_risk,verified,...`). `recommendations` + `retention-risk` correctly 403 on free plan. Token flow: issue token 200 (`fw_...`), `GET /analytics/:slug/token/sentiment` 200 with Bearer, 401 without. Webhooks: create 201, logs 200 (empty). Settings: GET 200; PUT with only `emailDigest` correctly 400 (`At least one of name or logo is required`); PUT with name 200. QR regenerate 200. Payments: checkout 200 (Stripe test URL), portal 200, raw webhook without signature 400. Add-member with unknown email 404 `User not found` (existing-users-only by design).

FINDING F1.1 (P0, CONFIRMED WITH ROOT CAUSE in Round 2): server log now shows `AI analysis failed: The operation was aborted due to timeout` on every live submit, so ALL Round-2 feedback rows (positive AND negative) stored `sentiment:Neutral, urgency:Low, satisfactionEstimate:3, fixableProblem:false, retentionRisk:Low, confidence:0.1, keyPoints:["Analysis failed"]`. Positive/mixed text returned `keyPoints:["Analysis failed"]`, `confidence:0.1`, `suggestedAction:"Review this feedback manually"` with plausible-looking category. Strongly negative text (`rude staff, 45 min, cold food, rating 1`) returned `sentiment:Neutral, urgency:Low, retentionRisk:Low, satisfactionEstimate:3, fixableProblem:false` — wrong on every axis. Server log shows no AI error lines, so the failure is swallowed inside `analyzeFeedback`. Fix in `server/src/features/ai/service.ts`: log the underlying `generateText/Output.object` error (model name `gemini-3.5-flash` vs `AI_MODEL=gemini-2.0-flash` mismatch is a prime suspect — check `server/.env` `AI_MODEL`), add a `analysisFailed` flag or 5xx-safe marker instead of fake-neutral values, and add a unit test with a clearly-negative fixture asserting urgency High + retentionRisk High.

FINDING F1.2 (P2): verify endpoint accepts only `qr-pos|email-link|stripe-purchase|manual` but the error message is fine; client should surface the enum (currently unknown). Minor docs/UX gap.

FINDING F1.3 (P2): `POST /api/ai/:slug/chat/stream` on free plan returned 400 rather than the documented 403 `Pro plan required` seen on `/chat` and `/nlq`. Fix: run the same Pro-gate before validating stream body in `server/src/features/ai/routes.ts`, or map the validation error to 403 when plan is not pro.

Unit suites: server `vitest run` 9 files / 65 tests PASS; client `vitest run` 2 files / 3 tests PASS.

## Phase 2 — Real-browser smoke, Chromium (11/13 PASS)

Landing, login, dashboard, feedback, analytics, AI, team, settings pages all render; guest `/dashboard` redirects to login; unknown route shows 404; mobile 390px has no major overflow; zero console/page errors except notes in Phase 3. All 11 client routes return HTTP 200 (SPA shell — expected).

FINDING F2.1 (harness, not app): first run failed register + org-setup because the harness filled 3 inputs; the real form has name/email/password/confirmPassword + required terms checkbox. After correcting the harness, register and org-setup both PASS. No app change needed, but recommend `data-testid` attributes on auth/org forms for stable E2E selectors.



## Phase 3 — Full user journey in browser (4/4 PASS)

Fresh user: register (4 fields + terms) -> org-setup (name auto-slug, businessType select, description, availability check, submit enabled) -> dashboard -> feedback/analytics/team/settings -> public `/feedback/:slug` submit -> success confirmation. All PASS with zero page errors.

Console notes (P2): one 404 (likely favicon/asset — confirm and add `client/public/favicon.*` mapping), one 403 (analytics Pro-gate firing correctly on free plan — client should render an upgrade nudge instead of a bare console error), React hydration warnings (`div` inside `p`, `p` inside `div`) in landing/dashboard markup — fix nesting in `FeaturesGrid/Hero/DashboardHome` to remove StrictMode noise.


## Phase 4 — Cross-cutting (findings)

Rate limiting (P1): with Redis connected, repeated browser runs exhausted shared `rl:auth`/`rl:api` counters keyed by `::/56`, causing `POST /api/auth/sign-up/email` 429 and `GET /api/auth/get-session` 429 mid-run, which stalls navigation. Local-dev fix: raise `authRateLimiter.max` when `NODE_ENV=development`, or exempt `get-session`, or namespace test users. E2E fix: reset `rl:*` Redis keys between runs (done manually this session via `DEL rl:*`).

CORS/Origin (info): API correctly requires Origin for Better-Auth writes; raw curl without Origin gets 403 `MISSING_OR_NULL_ORIGIN`. No change needed, but E2E probes must send Origin headers.

SMTP (info): `SMTP_HOST` empty so mail is no-op by design; digest/urgency paths log + skip. Add a Mailpit service + one integration test before claiming Phase 3 email delivery works.

## Fix list (priority order)

P0: F1.1 AI Gemini timeout (`ai/service.ts`: raise/timeout config, honest failed-analysis marker, negative-fixture test).
P1: F0.3 add Playwright E2E to repo; Phase-4 rate-limit DX (dev bypass or higher caps).
P2: F0.1 quoted DATABASE_URL; F1.2 verify-source UX; F1.3 stream 400-vs-403; hydration nesting; favicon 404; upgrade nudge on 403s; 47 `any` lint warnings; Mailpit + email integration test.

