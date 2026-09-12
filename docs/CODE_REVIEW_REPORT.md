# Code Review Report — Slice-by-Slice Business Logic Audit

> **Date:** 2026-09-12 · **Branch:** `dev` · **Scope:** full server + client + shared, reviewed feature-by-feature (10 slices)
> **Method:** read-only static review. Severity: 🔴 critical · 🟠 fix before launch · 🟡 nice-to-have / document.

**Overall verdict:** ⚠️ Needs fixes. No immediately exploitable authz hole found, but there are **two money-losing / quota-draining bugs** (duplicate Stripe subscriptions; unthrottled streaming chat), one **CSV injection** vulnerability, and several correctness issues that will produce customer-visible weirdness within weeks of launch (duplicate crons, daily churn alerts, stale recommendations, digest sent to free tier).

---

## Table of Contents

1. [Slice 1 — Auth & Organizations](#slice-1--auth--organizations)
2. [Slice 2 — Feedback Ingestion](#slice-2--feedback-ingestion)
3. [Slice 3 — AI Service](#slice-3--ai-service)
4. [Slice 4 — Analytics](#slice-4--analytics)
5. [Slice 5 — Payments / Stripe](#slice-5--payments--stripe)
6. [Slice 6 — Webhooks & API Tokens](#slice-6--webhooks--api-tokens)
7. [Slice 7 — Jobs & Workers](#slice-7--jobs--workers)
8. [Slice 8 — Mail & Notifications](#slice-8--mail--notifications)
9. [Slice 9 — Client State & Data Flow](#slice-9--client-state--data-flow)
10. [Slice 10 — Shared Contracts](#slice-10--shared-contracts-aifccontracts)
11. [Cross-Slice Synthesis](#cross-slice-synthesis) — systemic patterns + Top-10 priority fix list

---

## Slice 1 — Auth & Organizations

**Files:** `server/src/lib/auth.ts`, `middleware/auth.ts`, `middleware/organization.ts`, `features/auth/*`, `features/organization/*`, `shared/src/features/organization/schemas.ts`

Better-Auth (email/password, Prisma adapter) at `/api/auth/*`; custom `/me` + `/has-org`; slug-based tenancy; roles `owner > admin > member`.

| Sev | Finding |
|-----|---------|
| 🟠 | **Org creation blocked on inline AI call** — `organizationService.create` awaits `generateCategoriesForBusiness` before creating the org; Gemini latency/outage delays or fails onboarding. Generate post-create (fire-and-forget); a default fallback list already exists. |
| 🟠 | **Slug check-then-create race** — `findUnique` then `create`; concurrent same-slug submissions hit Prisma P2002 → generic 500 instead of friendly 409. Catch P2002. |
| 🟠 | **Duplicate member add → raw 500** — `addMember` has no existing-member check; P2002 → 500. Should 409 "Already a member". |
| 🟠 | **Public org endpoint leaks `settings`** — unauthenticated `GET /organization/:slug` includes `organization.settings` (webhook/config surface in later phases). Whitelist only what PublicFeedbackPage needs. |
| 🟠 | **Plan fields dual source of truth (partially confirmed)** — better-auth user `additionalFields` (`currentPlan`, `subscriptionStatus`, `stripeCustomerId`) exist but are never written by the payments path (dead state — see Slice 5 #4). Remove them. |
| 🟡 | `requireOrganizationMember` middleware trusts client-supplied org id and appears largely unused — delete or unify. |
| 🟡 | `minPasswordLength: 6` — weak; no breach check (rate limiter on auth router does exist ✅). |
| 🟡 | `hasOrganization` user field can drift from real membership — ensure onboarding uses `/has-org`, not the cached field. |
| 🟡 | Role asymmetry — `addMemberSchema` lets admins grant `admin`, but `updateMemberRoleSchema` only allows admin/member. Consider owner-only for admin grants. |

**✅ Good:** cross-tenant isolation consistently done (slug → org → membership check before every mutation); owner-only remove/role-change with self-protection; `trustedOrigins` configured; reset-password flows through SMTP no-op wrapper.

**Verdict: ⚠️ Needs fixes** — nothing exploitable; #1–#4 are reliability/data-exposure issues.

---

## Slice 2 — Feedback Ingestion

**Files:** `features/feedback/{routes,service}.ts`, `shared/features/feedback/schemas.ts`, `middleware/rate-limit.ts`

Public `POST /api/feedback/:slug` (10/hr/IP) → Gemini analysis → persist → conditional fire-and-forget enqueues (urgency alert, action loop, webhook push).

| Sev | Finding |
|-----|---------|
| 🔴 | **Public submission blocks on the AI call** — every QR submission pays a Gemini round-trip on the request path; outage/spam makes submit slow or fails the customer's submission and burns quota. Persist first; analyze from the worker or with a never-throwing fallback (see Slice 3 #5). |
| 🔴 | **`z.coerce.boolean()` trap in filters** — `fixableProblem`/`verified` coerce any non-empty string to `true` (incl. `"false"`). Works today only because service.ts bypasses it with its own `=== 'true'` check — contract and handler disagree. Fix at contract level (Slice 10 #3). |
| 🟠 | **IP extraction behind proxy** — without `app.set('trust proxy', 1)`, in prod (nginx) `req.ip` is the proxy IP, so the 10/hr limit is **global across all customers**; `x-forwarded-for` is also spoofable. Set `trust proxy` and parse the first hop deliberately. |
| 🟠 | **PII in `ipAddress`** — stored raw, no retention/masking policy (GDPR-adjacent). Truncate/hash. |
| 🟠 | **`getFeedbacks` returns full rows** — no `select`, so `ipAddress` + `rawAnalysis` leak to every member (incl. role `member`). Add a projection. |
| 🟡 | Webhook CRUD lives in feedback routes with the wrong role gate: `createWebhook` enforces manager at service level ✅ but `deleteWebhook` does **not** — a plain member can delete org webhooks. |
| 🟡 | `verify=false` nulls `verificationSource` — discards evidence trail (`qr-pos` vs `stripe-purchase`). |
| 🟡 | `page` unbounded — deep offset scan + full count. Cap or cursor-paginate. |
| 🟡 | `updateStatus` read-then-update isn't transactional — concurrent worker update can clobber. Use guarded `updateMany`. |

**✅ Good:** enqueues fire-and-forget with logged failures; action-loop/webhook triggers sensible (High urgency OR High retention OR fixable); resolved/reopen lifecycle with `resolvedAt` correct; `correctedByHuman` tracking; per-slug ownership verified on every protected route.

**Verdict: ⚠️ Needs fixes** — #1 and #3 are the real business risks.

---

## Slice 3 — AI Service

**Files:** `features/ai/{service,routes}.ts`, `shared/features/ai/schemas.ts` — Gemini analysis, draft replies, insights, NLQ router, blocking + streaming chat.

| Sev | Finding |
|-----|---------|
| 🔴 | **Streaming chat route has no `aiRateLimiter`** — blocking `/chat` and `/nlq` are limited (30/hr) but `/chat/stream` — the endpoint the UI actually uses — is **unthrottled** Gemini spend for any Pro member. One-line fix; biggest quota hole in the codebase. |
| 🟠 | **NLQ handler double-resolves org + Pro gate on `'pro'` literal** — `chatContext` already resolves membership and gates Pro; the NLQ handler resolves again with a non-null assertion. Plan check is a string literal — centralize (Slice 5 #7). |
| 🟠 | **Unbounded chat history from client** — `messages` validated only for count (≤50); total size uncapped — a client can POST megabytes of history per request. Cap serialized size before `convertToModelMessages`. |
| 🟠 | **Prompt-injection surface via feedback text** — customer text (≤5000 chars) flows verbatim into analysis, draft replies, chat, NLQ. A jailbreak can poison **public-facing owner replies** sent under the business's name. Delimit user text as data, hard-forbid discounts/refunds, consider output moderation on `draftOwnerReply`. |
| 🟠 | **Fallback analysis masks outages as Neutral/3/Low** — `analyzeFeedback` catch returns plausible junk (`confidence: 0.1`) that silently pollutes trends/retention/staff stats. Mark degraded rows (`confidence < 0.5` or `analysisStatus` column) so analytics can exclude them. |
| 🟡 | `satisfactionEstimate` derived from `rating` when model omits it — blends the field's intended distinct semantics. |
| 🟡 | NLQ keyword router is brittle (`wants('top')` matches "stop"; `wants('leave')` matches "love"); default card fallback is a good touch. |
| 🟡 | `draftOwnerReply` truncates at 1000 chars mid-sentence — use word-boundary trim. |

**✅ Good:** every AI call has try/catch with usable fallback (never breaks the request path); Zod-validated outputs with per-field backfill; built-in model retries; Pro gating + rate limiting on blocking chat; chat system prompt injected server-side only — client can't spoof feedback context; streaming errors still yield a message so `useChat` never hangs.

**Verdict: ⚠️ Needs fixes** — the stream rate-limiter (#1) should land immediately.


---

## Slice 4 — Analytics

**Files:** `features/analytics/{routes,service}.ts`, `shared/features/analytics/schemas.ts` — trends, categories, heatmap, top issues, alerts, recommendations, retention risk, forecast, CSV export, staff performance, token-auth read.

| Sev | Finding |
|-----|---------|
| 🔴 | **CSV export is formula-injection vulnerable (CWE-1236)** — `esc()` quotes commas/quotes/newlines but does not neutralize leading `=`, `+`, `-`, `@`. Feedback `text`/`ownerReply` are **customer-controlled**: `=HYPERLINK("http://evil","click")` or `=WEBSERVICE(...)` executes when the owner opens the export in Excel/Sheets. Fix: prefix dangerous leading chars with `'`. |
| 🟠 | **Recommendations cache never expires** — `getRecommendations` returns cached insights regardless of age; new feedback never changes recommendations unless rows are pruned. Also the AI-generation path blocks the HTTP request on a Gemini call. Check freshness via `periodStart` and move generation to the cron/worker. |
| 🟠 | **`getTopIssues` grouping is essentially fake** — key is `category + first 50 chars of text`; "cold coffee" vs "my latte was cold" never group, so "Top recurring issues" mostly returns single-count rows. Group by category with themes as sub-labels. |
| 🟠 | **Token-auth endpoint skips rate limiting** — `/token/sentiment` has no limiter; token brute-force surface. (Comparison is a hashed DB lookup, so timing attack is moot ✅.) |
| 🟠 | **`days` NaN → 500 risk** — handlers do `Number(req.query.days ?? 30)`; `?days=abc` → NaN → Invalid Date → Prisma throw → 500, unless the shared query schema validation covers `req.query` for these routes — verify; if the schema only validates `params`, the `days` bounds (≤365) are dead code. |
| 🟠 | **Staff performance misrepresents attribution** — schema has no per-member resolution audit column; the card implies per-member numbers that don't exist. Rename to "Team & workload" or add `resolvedById`. `avgResolutionHours` also samples a nondeterministic 200 rows. |
| 🟡 | `getSentimentTrends` loads all window rows in memory — fine now; use SQL `date_trunc` groupBy at scale. |
| 🟡 | Trend bucketing is UTC — café in UTC+3 sees evening feedback on the wrong day. Consider org timezone. |
| 🟡 | Enrichment attaches the same 5 linked rows + same draft reply + arbitrary `assigneeId` ("first member ever") to *every* recommendation card. |

**✅ Good:** consistent `orgContext` membership gate; Pro gates centralized in handlers; export bounded (≤5000 rows) and `select`-projected (no `ipAddress` leak); retention aggregation guards `satisfactionEstimate: { not: null }`; forecast deltas reasonable; token route correctly ordered before session middleware.

**Verdict: ⚠️ Needs fixes** — #1 is a one-line security fix; #2/#3 are "does this feature actually work" questions.

---

## Slice 5 — Payments / Stripe

**Files:** `features/payments/{service,routes}.ts`, `shared/features/payments/schemas.ts`, hourly sync.

Checkout (subscription mode, metadata carries `organizationId` + `plan`), billing portal, `verify-session` fallback, raw-body webhook (`checkout.session.completed`, `invoice.paid/payment_failed`, `customer.subscription.deleted`), hourly `syncSubscriptionStatus`.

| Sev | Finding |
|-----|---------|
| 🔴 | **Plan changes create a second subscription — double billing** — `createCheckoutSession` always starts a fresh Checkout subscription. A Pro customer re-checking-out (e.g. "switch to Basic") creates a second active subscription while the first keeps charging; `applySubscriptionState` overwrites `stripeSubscriptionId`, orphaning the old sub **which continues to bill invisibly**. Before checkout, if `stripeSubscriptionId` exists, route to the billing portal or update/cancel the existing subscription. **Fix before any real customer.** |
| 🟠 | **`memberOrganization` upgrades "first org" arbitrarily** — `findFirst` with no `orderBy` for multi-org users; checkout has no org selector. Add explicit org choice/confirmation. |
| 🟠 | **Billing actions allowed for any member role** — `/checkout`, `/portal`, `/verify-session` only require membership; a role-`member` invitee can start a paid subscription or open the billing portal. Owner/admin-gate these. |
| 🟠 | **better-auth user plan fields are vestigial** — never written by payments; exposed by session responses. Remove (resolves Slice 1 #5: gating correctly uses Organization). |
| 🟡 | No webhook event-id dedup ledger — upsert semantics make replays idempotent today; becomes a risk if handlers gain side effects (emails/credits). |
| 🟡 | **`invoice.payment_failed` → `past_due` keeps Pro access indefinitely** — no gate checks `subscriptionStatus`, only `currentPlan !== 'pro'`; access persists until Stripe auto-cancels after dunning (weeks). Decide: gate on plan+status, or accept the dunning window. |
| 🟡 | `'pro'` literal scattered (ai/routes, analytics/routes ×2, jobs ×2, client ×5). Add `PLANS.PRO` constant in `@aifc/contracts`. |

---

## Slice 6 — Webhooks & API Tokens

**Files:** `features/webhooks/{service,routes}.ts`, webhook push worker path, token validation.

Scoped API tokens (`fw_` + 24 random bytes, SHA-256-hashed at rest, prefix stored for display, scopes with `*` wildcard, optional expiry, `lastUsedAt`); HMAC-SHA256-signed outbound pushes with delivery logs and 8s timeout.

| Sev | Finding |
|-----|---------|
| 🟠 | **Client-supplied webhook secrets accepted** — `createWebhookSchema.secret` (min 8) is used verbatim; a member choosing `"12345678"` gets a forgeable signature. Always generate server-side; never accept client secrets. |
| 🟠 | **Webhook secrets stored plaintext in DB** — a DB dump exposes signing secrets for all orgs. Encrypt at rest (app-level AES-GCM/KMS) or document the accepted risk; never log it (currently never logged ✅). |
| 🟠 | **No retry/backoff for failed deliveries** — single attempt, then a log row; a receiver's transient blip permanently loses `feedback.high_urgency`. Add retries with backoff or a re-delivery endpoint; document at-most-once semantics for integrators. |
| 🟠 | **No SSRF protection on webhook URLs** — any `z.string().url()` accepted: members can register `http://169.254.169.254/latest/meta-data`, `localhost`, or RFC1918 targets and have the server POST signed JSON there (delivery log status = read primitive). Block private/metadata IPs at create + push time. |
| 🟡 | Token comparison — hashed DB lookup (`findUnique` on SHA-256), so timing attacks are moot ✅ (resolves the Slice 4 open question). Rate limiting on `/token/sentiment` remains open. |
| 🟡 | `revokeApiToken`/`deleteWebhook` use `deleteMany` — can't distinguish "not found" (correctly org-scoped ✅). |
| 🟡 | Token scopes are open strings — a manager can issue `scopes: ['banana']`. Enum-ify. |
| 🟡 | Webhook `events` is free-form strings — subscribers can register events that never fire. Enum-ify (`feedback.high_urgency`). |
| 🟡 | `lastUsedAt` written on every validated request — write amplification on the read path; throttle to >1min stale. |

**✅ Good:** tokens hashed (plaintext shown once); org scoping on every query; `requireManager` correctly gates **token** routes; HMAC signature + event headers; timeout prevents hangs; logs bounded; `validateApiToken` checks expiry + org + scope. **Correction/asymmetry:** `createWebhook` enforces owner/admin at service level, but `deleteWebhook` does **not** — route relies on plain membership.

**Verdict: ⚠️ Needs fixes** — #1/#2/#4 before exposing webhook/token management to customers.

---

## Slice 7 — Jobs & Workers

**Files:** `lib/queue.ts`, `jobs/generateInsights.ts` (4 crons), `workers/insights.worker.ts`, `workers/notification.worker.ts`.

2AM insight generation (BullMQ-preferred, in-process fallback), 2:30AM retention forecast + promoter referrals, 7AM digests, hourly Stripe sync; action-loop/alert/webhook/digest consumers at concurrency 2–5.

| Sev | Finding |
|-----|---------|
| 🔴 | **Multi-instance deployment double-fires every cron** — all four schedules are plain `node-cron` in-process with **no distributed lock**. With >1 API replica (or a restart near 2AM/7AM), you get duplicate insight runs, duplicate digest emails, duplicate churn insights (customer-visible) and double Stripe sync load. Fix: BullMQ Worker-based schedule or Redis `SET NX EX` lock per schedule. |

---

## Slice 8 — Mail & Notifications

**Files:** `server/src/lib/mail.ts` — SMTP transport, recipient resolution, HTML templates (urgency alert, digest, action-routed, referral).

Nodemailer singleton, no-op when `SMTP_HOST` unset; all four templates share `getOrgRecipientEmails`.

| Sev | Finding |
|-----|---------|
| 🟠 | **No unsubscribe mechanism on any email** — digests + referral emails are recurring commercial email with no List-Unsubscribe header, no unsubscribe link, no per-user opt-out (only org-level `emailDigest === false`, honored for digest/referral but not urgency alerts). Gmail/Yahoo bulk-sender rules require one-click unsubscribe; non-compliance lands the domain in spam and **kills urgency-alert deliverability — the core product value**. Highest-leverage fix in this slice. |
| 🟠 | **Urgency alerts email every member, no throttle** — a 20-member org gets one email per member per incident; a spam-run of high-urgency feedback (10/hr) = 10 × members emails. Add per-user notification prefs + per-org min-gap throttle. |
| 🟡 | No `text` part on any send — HTML-only email (spam-score penalty; plain-text clients see nothing). Strip tags for a fallback. |
| 🟡 | `getOrgRecipientEmails` has no role filter — newly-added role-`member` invitees get alert spam immediately; consider owner/admin for alerts. |
| 🟡 | `dashboardUrlFor` hardcodes `/dashboard/feedback` — referral emails point to the feedback list, not the referral view. |
| 🟡 | **Failed sends swallowed** — `sendMail` catches its own errors and returns `sent: false`, so worker retries never trigger; a transient SMTP outage silently loses urgency alerts. Decide: throw (let BullMQ retry) vs accept loss. |
| ✅ | **No XSS found in email templates** — every customer/org-controlled string passes `escapeHtml` in element context; URLs escaped in quoted `href`; reviewed all interpolations. Consistent escape discipline across all four templates. |

**Verdict: ⚠️ Needs fixes** — #1 protects the core alert product.

---

## Slice 9 — Client State & Data Flow

**Files:** `client/src/lib/{api.ts, query-client.ts, auth-client.ts}`, `lib/stores/{auth,feedback,ui}.store.ts`, `features/{feedback,organization}/hooks.ts`.

Axios (cookie auth, 401→login redirect), typed `apiClient` over the server envelope, TanStack Query v5 (5min stale / 24h gc / smart retry), Zustand stores (persisted auth, feedback mirror, toasts).

| Sev | Finding |
|-----|---------|
| 🟠 | **Auth store persists the session object to localStorage** — `partialize` saves session + user to `auth-storage`: XSS-readable stale cache that becomes a staleness oracle after server-side sign-out. Cold-boot also reports `isAuthenticated: true` (persisted) with `isLoading: true` (not persisted) → private UI flashes before the session check. Persist only `activeOrganization`; derive auth from live `authClient.useSession()`. |

---

## Slice 10 — Shared Contracts (`@aifc/contracts`)

**Files:** `shared/src/**` (408 lines, 7 feature schemas); consumption in server & client via `file:../shared` with auto-rebuild on dev/build/typecheck/test.

| Sev | Finding |
|-----|---------|
| 🔴 | **The client barely consumes the contracts** — client imports appear in only 3 auth/feedback pages; `features/feedback/types.ts` hand-redeclares every response type (`Feedback`, `RetentionRisk`, `NlqResponse`…) that `z.infer` could provide. Every later-phase field had to be added twice; nothing fails when the copies diverge. Export inferred types from contracts and delete the redeclarations. |
| 🟠 | **Response schemas don't exist** — contracts cover requests only: no feedback response, no list envelope, no analytics responses. The server can't type its own responses from contracts and `unwrapData<T>` is trusted, never checked. Response schemas would have mechanically caught the `ipAddress` leak (Slice 2 #5). |
| 🟠 | **`z.coerce.boolean()` traps enshrined at contract level** — `fixableProblem`/`verified` in shared feedback schemas: any non-empty query string (incl. `"false"`) → `true`. Handlers bypass with manual `=== 'true'` checks — proof of contract/handler disagreement. Fix with `z.enum(['true','false']).transform(...)` or a shared `booleanQuery` helper. |
| 🟠 | **Webhook secret + free-form events enshrined in shared** — `secret: z.string().min(8).optional()` and `events: z.array(z.string())` propagate Slice 6 #1/#8 to any future UI built on these schemas. Fix at the shared layer. |
| 🟡 | Message-length asymmetry — blocking chat max 2000 vs UI-stream 4000; pick one. |
| 🟡 | `feedbackParamsSchema.id` is optional `.cuid()` in an item-route schema — `id`-less requests validate, deferring failure to handlers. Split list vs item param schemas. |
| 🟡 | No exported `PLANS` constant / `isPro(plan)` helper — feeds the `'pro'` literal scattering (Slice 5 #7). |
| 🟡 | `settings` JSON is unvalidated on read (only `emailDigest` informally read in mail.ts); consistent with the public settings leak (Slice 1 #4). |
| ✅ | Contracts genuinely wired into both package lifecycles (no stale-contracts footgun); enums defined once and re-exported deliberately; sane bounds everywhere (text 5000, message 2000/4000, events ≤20, days ≤365, limit ≤100); user-facing error messages. |

**Verdict: ⚠️ Needs fixes** — the "single source of truth" promise is ~60% delivered; #1/#2 are the highest-leverage refactor in the codebase.

---

## Cross-Slice Synthesis

### Systemic patterns

1. **Request-path AI calls** (Slices 1, 2, 4) — Gemini sits inside request handlers for org creation, feedback submission, and recommendations. One dependency (AI) is a single point of failure for onboarding, submission, and dashboards. Pattern fix: queue all AI work; serve cached/fallback results on read paths.
2. **Check-then-act without guards** (Slices 1, 2, 7) — races between existence checks and writes (slug create, member add, action-loop status). Pattern fix: conditional `updateMany`/upsert + catch P2002 → 409.
3. **Contract/handler disagreement** (Slices 2, 4, 10) — handlers bypass shared schemas with ad-hoc parsing (`=== 'true'`, `Number(req.query.days)`), and response shapes aren't contract-covered at all. The shared package exists but isn't authoritative.
4. **String-literal enums scattered** — `'pro'` (server ×5, client ×5), status/sentiment/urgency literals across services. Fix once in `@aifc/contracts` constants.
5. **At-most-once semantics undocumented** — webhooks (no retry), email (swallowed failures, no unsubscribe), cron (no lock). Everything is fine until the first production incident.
6. **Role gating asymmetry** — org member routes owner-only, but webhook delete / billing actions available to plain members. Define a role matrix and enforce it in one middleware layer.

### Top-10 priority fixes (suggested order)

| # | Fix | Slice | Effort |
|---|-----|-------|--------|
| 1 | Cancel/update existing Stripe subscription before creating a new checkout (double billing) | 5 | M |
| 2 | Add `aiRateLimiter` to `/chat/stream` | 3 | S |
| 3 | CSV `esc()` formula-injection guard | 4 | S |
| 4 | Distributed lock for the 4 cron schedules | 7 | M |
| 5 | `trust proxy` + deliberate IP parsing (rate-limit integrity) | 2 | S |
| 6 | Gate digest cron to Pro orgs (or decide free-tier digests are intended) | 7 | S |
| 7 | Webhook secrets: generate server-side only + SSRF guard on URLs | 6 | M |
| 8 | Stop blocking submission on AI; mark fallback analyses (`confidence < 0.5`) | 2+3 | M |
| 9 | Unsubscribe headers + org `emailDigest` toggle surfaced in Settings UI | 8 | M |
| 10 | Churn-insight upsert (stop 14 identical alerts) + recommendations freshness check | 7+4 | S |

### Quick wins (≤30 min each)

- `aiRateLimiter` on stream route · CSV `esc` guard · `trust proxy` · digest plan filter · `PLANS.PRO` constant exported and adopted · `text` fallback in emails · word-boundary trim on draft replies · 403 handler clearing `activeOrganization` · `mutations.retry: false`.

### What's solid (worth preserving)

- Cross-tenant isolation discipline in every server service (slug → org → membership).
- Fire-and-forget queue enqueues that never break the request path; null-safe queue layer.
- Escape discipline in email templates (no injection found).
- Stripe webhook signature verification + metadata-based org binding.
- Token hashing design (SHA-256, show-once, prefix display).
- Contracts wired into both package lifecycles; consistent query-key conventions on the client.
- Test coverage on payments/webhooks (47/47 passing at review time).

---

*End of report. Findings reflect static review only; line numbers drift with edits — search by quoted identifiers.*

| 🟠 | **`activeOrganization` never revalidated** — after being removed from an org, all queries 403; the interceptor only handles 401 → endless error wall instead of an org picker. Add a 403 handler that clears `activeOrganization`. |
| 🟠 | **Feedback store is a redundant mirror of query state** — hooks copy query results into Zustand via effects and pages read the store: server state in two caches with different lifetimes, render flashes, double-update risk on optimistic mutations, stale `error` after recovery. Keep only UI selection (page/filters) in the store. Biggest client maintainability debt. |
| 🟠 | **5-min staleTime + `refetchOnWindowFocus: false` on an alerting product** — feedback/alerts/retention lists show 5-min-old data after tab switches; `['draft-reply', …]` keys are never invalidated after status/verify/correct mutations. Lower staleTime on live domains; invalidate draft-reply keys. |
| 🟠 | **`mutations.retry: 1` on non-idempotent mutations** — a retried `submit`/`updateStatus` after a timeout can double-apply. Retry on network errors only, or not at all. |
| 🟡 | Response shapes hand-redeclared in `features/*/types.ts` despite `@aifc/contracts` (see Slice 10 #1). |
| 🟡 | 401 redirect loses context — no `?next=` return path; deep-link users land at dashboard root after re-login. |
| 🟡 | `useOrgSlug` returns `''` with no active org — all hooks guard with `enabled: !!slug`, but any hook forgetting the guard spams `GET /api/feedback/`. |
| ✅ | Query keys namespaced consistently; targeted invalidations; `placeholderData: previous` pagination; 401/403 excluded from retry; centralized envelope-unwrap + toast bridge with a test. |

**Verdict: ⚠️ Needs fixes** — #1/#2 security/staleness; #3 maintainability debt.

| 🔴 | **Digest sent to ALL orgs, not just Pro** — `startDigestJob` selects orgs by "has feedbacks", no plan filter; free-tier orgs get the daily digest. The insight cron gates Pro — align the digest (intended? decide). |
| 🟠 | **Churn insight is append-only — duplicate alerts daily** — `startRetentionForecastJob` creates a new "Churn risk rising" insight **every night** while a falling trend persists; after 2 weeks the Priority Alerts card shows 14 identical alerts. Upsert on (org, title, week) instead. |
| 🟠 | **Action loop clobbers concurrent human updates** — `processActionLoop`: check status → Gemini draft (≤10s) → update. If staff resolve the row during the AI call, the worker's update re-sets `in_progress` and stamps the note on a resolved row. Use conditional `updateMany({ where: { id, status: 'open', internalNote: null } })` and check count. |
| 🟠 | **Fixed `jobId` dedupe is non-deterministic** — `jobId: 'urgency-${id}'` dedupes while the job exists in any state (incl. completed within the `removeOnComplete: { count: 100 }` window) — legitimate re-triggers silently swallowed or allowed depending on queue churn. Use age-based removal or explicit dedupe checks. |
| 🟡 | Fallback (no-Redis) path runs heavy AI sequentially inside the API process at 2AM — acceptable at current scale, not production-grade. |
| 🟡 | At-least-once email caveats: a Prisma failure after `sendMail` success re-sends on BullMQ retry; `sendActionRoutedEmail` is fire-and-forget inside a retried job (may double-send). Standard queue semantics; document or add idempotency keys. |
| ✅ | Queue layer comprehensively null-safe (Redis down never breaks submission); insight delete-then-create is idempotent per 30d window; per-org try/catch isolation; action-loop idempotency gate (`status !== 'open' || internalNote`) prevents most double-drafts. |

**Verdict: 🔴 Needs fixes** — #1 (cron locking) and #2 (digest plan gating) are deployment-blocking.


**✅ Good:** webhook signature verification with raw body (400 on bad signature, tested); `verifyAndApplySession` checks metadata org + membership before applying (can't attach someone else's session); plan metadata flows through checkout and subscription; `customer.subscription.deleted` fully downgrades; hourly sync self-heals missed webhooks.

**Verdict: 🔴 Needs fixes** — #1 is a money-losing bug.

