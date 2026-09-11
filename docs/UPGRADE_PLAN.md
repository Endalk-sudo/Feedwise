# Feedwise Ultimate Upgrade Plan

> Synthesis of `report.json`, `research_fix_synthesis.md`, `research_value_extraction.md`,
> `stakeholder-value.json`, `ULTIMATE_FEATURES.md`, `ULTIMATE_VISION.md`,
> grounded against the actual codebase (server/client/shared/Prisma) on 2026-09-11.

## 0. Thesis — score dashboard → operations platform

- Sentiment != satisfaction: arXiv 2606.19698 (70,450 convos): sentiment 0.36 vs
  satisfaction 0.47 correlation; 44% disagreement. Biggest hidden group =
  "tolerated friction" (satisfied + fixable problem).
- 64% doubt review authenticity; 5-10 hrs/week manual response (PRD S2);
  no insight -> action link (`PATCH /feedback/:slug/:id/status` orphaned);
  team UI / email / export / public API / i18n deferred or partial (PRD S7.2).
- 6 stakeholders (Owner, Manager, Staff, Customer, Supplier, Regulator) need
  revenue-risk, coaching data, recognition, close-the-loop, audit trail.
- Revenue evidence: 5pt retention +25-95% profit (Bain); 1pt NPS +1.3% CLV;
  10pt NPS +12-18% retention; NPS explains 20-60% growth variance.

---

## 1. Keep as-is (do not rewrite)

- `server/src/index.ts -> app.ts` mounts
  `/api/auth,/feedback,/analytics,/ai,/organization,/settings,/payments`;
  Stripe webhook `express.raw()` before `express.json()` — keep order.
- Better-Auth cookie sessions (`lib/auth.ts`,
  `middleware/auth.ts: authMiddleware/requireOrganizationMember`) — keep, extend for API tokens.
- AI: `ai@7 + @ai-sdk/google`, `generateText/Output.object` Zod v4,
  `convertToModelMessages/streamText -> useChat + DefaultChatTransport`
  in `client/src/features/ai/pages/AIPage.tsx` — keep, enrich output.
- Queue/cron: `lib/redis.ts`, `lib/queue.ts (aifc-insights)`,
  `workers/insights.worker.ts`, `jobs/generateInsights.ts` (2AM Pro cron +
  hourly subscription sync) — keep, add jobs.
- S3 (`config/s3.ts`, `utils/s3.ts`, logo-upload pattern) — reuse for voice/image/export.
- Client: TanStack Router + Query v5, Zustand (`auth/feedback/ui` stores),
  `lib/api.ts` Axios `withCredentials`, `components/ui` kit — keep.

## 2. Improve — existing features to fix

### I1. Structured satisfaction + fixable-problem (V1/F2) — P1, highest leverage
- **Now:** `feedbackAnalysisSchema` in `server/src/features/ai/service.ts` outputs only
  `{category, sentiment, urgency, rating, keyPoints, keywords, themes, rootCause,
  suggestedAction, confidence}`.
- **To:** add `satisfactionEstimate 1-5`, `fixableProblem boolean`,
  `concreteIssue string`, `retentionRisk Low|Medium|High` alongside sentiment.
- **Touch:** `server/src/features/ai/service.ts` (`analyzeFeedback`, `generateInsights`,
  `buildChatSystemPrompt`), `shared/src/features/{ai,feedback,analytics}/schemas.ts`,
  `server/prisma/schema.prisma: Feedback`, `server/src/features/analytics/service.ts`
  (cluster by satisfaction-drop + fixable frequency),
  `client/src/features/{feedback/types,ai/pages/AIPage}` (badges/cards).
- **Why:** fixes 44% sentiment/satisfaction gap; turns data into a work list; unblocks D1/D2/F1.

### I2. AI chat context + NLQ (E1) — P1
- **Now:** `POST /api/ai/:slug/chat` + `/chat/stream` load 20 recent feedback, Pro-gated,
  plain-text context via `chatContext()`.
- **To:** inject I1 annotations into system prompt; route NL queries
  ("negative staff feedback this week") to existing
  `GET /analytics/:slug/{sentiment,categories,heatmap,issues,alerts}` and stream back
  structured cards. No new AI package.
- **Touch:** `server/src/features/ai/{routes,service}.ts`,
  `client/src/features/ai/pages/AIPage.tsx` (cards, not just text).

### I3. Insight -> action link (D1 core + F6) — P1
- **Now:** `GET /analytics/:slug/recommendations` (Pro-only) orphaned; `PATCH /status`
  exists but no task routing.
- **To:** every recommendation links to assignee + auto-reply draft (from
  `suggestedAction` + `ownerReply`) + `internalNote`; log closure for audit.
- **Touch:** `server/src/features/{analytics/service,feedback/service}.ts`,
  `client/src/features/{analytics/pages/AnalyticsPage,feedback/pages/FeedbackPage}.tsx`.

### I4. Analytics + feedback UI density — P2
- Add satisfaction trend, `verified` filter, retention-risk widget (Pro-gated like
  recommendations); close-the-loop reply visible on `PublicFeedbackPage`.
- **Touch:** `server/src/features/analytics/{routes,service}.ts`,
  `client/src/features/{analytics/pages/AnalyticsPage,feedback/pages/*}`.

## 3. Add — new features (all reuse existing arch)

### E2. Team collaboration UI — P1 (server ready, client missing)
- New `client/src/features/organization/pages/MembersPage.tsx + components/`
  consuming existing `POST/DELETE /organization/:slug/members`,
  `PUT .../members/:userId` via `lib/api.ts: organizations.addMember/removeMember`
  + `hooks.ts: useAddMember/useRemoveMember` (currently unused).
- Staff mobile-first view: assigned list + one-tap reply; role gate via
  `requireOrganizationMember`. F4 staff-perf cards live here later.

### V2. Email notifications — P1
- New `server/src/lib/mail.ts` (SMTP or Resend/SendGrid; `SMTP_*` in `lib/env.ts`).
- New BullMQ `high-urgency-notification.worker.ts`: trigger on
  `urgency == High OR satisfaction drop > 1 vs org avg`.
- Daily digest branch in `jobs/generateInsights.ts`; opt-in in Settings.
- Infra ready: Redis/BullMQ in compose; only unused `JOB_NAMES.SEND_DIGEST_EMAIL` exists.

### D1. Agent action loop + F6 auto-response — P1
- New `action-loop.worker.ts` on feedback/insight events: if `High + fixable`
  -> Gemini draft (assignee, reply, tag) -> update
  `Feedback.status/internalNote` -> notify via E2+V2.
- `feedbackService.autoReplyDraft()`; "Auto-Reply Draft" UI in `FeedbackPage`;
  staff Accept/Resolve/Escalate.

### F1. Retention-risk score + D2 predictive forecasting — P2
- Per-feedback `retentionRisk` from I1; aggregate
  `GET /analytics/:slug/retention-risk`; Pro widget in `AnalyticsPage`.
- Extend cron: rolling 7-day satisfaction + urgency/category frequency in Redis;
  e.g. `-0.3 pts/wk + rising Service urgency` -> `Insight{Churn risk rising...}`
  via `Output.object` forecast schema; surface in `/alerts`.

### V3/F7. CSV/PDF export + outbound webhooks — P2
- `GET /analytics/:slug/export?format=csv|pdf` streaming from `analyticsService`
  (`sentiment/categories/heatmap/issues`); Export button in `AnalyticsPage`.
- `POST /api/webhooks/:slug` signed push for High-urgency (reuse Stripe-webhook
  raw-body pattern); `GET /webhooks/logs`. No receiver-side dependency.

### D3. Verified feedback — P2
- `Feedback.verified + verificationSource`: (a) QR POS timestamp/location tag,
  (b) email confirm link, (c) Stripe `payments/webhook` purchase match.
- `verified` filter in analytics; trust badge on `PublicFeedbackPage` + dashboard.
- Addresses 64% trust gap; protects insight quality.

### D4. Public REST API + docs + token auth — P2
- `POST /api/auth/token` (scoped, hash-stored; reuse `authMiddleware` + scope check);
  `GET /api/docs`; expose `feedback/analytics/ai/chat/stream` with token auth.
- `shared/contracts` stays single source of truth. Unlocks CRM/Slack/POS.

### F3. Marketing automation (good reviews -> referral) — P2
- If `Positive + Low + satisfaction >= 4` -> referral/review-request email branch
  in cron + `mail.ts`; new `client/src/features/settings/pages/MarketingPage.tsx` toggle.
- Mirrors GatherUp/ReviewTrackers; turns promoters into revenue.

### F4. Staff performance dashboard — P2
- Per-member response-time / resolved-rate / satisfaction trend / category ownership
  from `organization + feedback` services; cards in `MembersPage`.
- Mirrors Medallia; enables coaching + recognition (Gallup link in stakeholder map).

### F5. Cost-reduction tracking — P3
- `shared` add `costEstimate` to feedback; `analyticsService` aggregates saved cost
  on resolve; trend chart in `AnalyticsPage`. Links `category + rootCause` to cost center.

### E3. Voice + image submissions — P3
- `PublicFeedbackPage`: MediaRecorder audio + image `multipart` -> S3 (logo pattern);
  `analyzeFeedback` multimodal -> `keyPoints/themes`; `mediaType` enum in contracts.
- Zero-friction mobile; evidence photos. Gate behind Pro (transcription cost).

### E4. Multi-language public page — P3
- `react-i18next` or dict store + locale Zustand; AI runs in customer lang,
  dashboard shows original + translation; `categories` stay language-agnostic tags.
- Opens SMB global market; deferred in PRD S7.2.

## 4. Contracts + DB (Phase 0, before features)

- `shared/src/features/feedback/schemas.ts`: add `satisfactionEstimate (1-5),
  fixableProblem (bool), concreteIssue (string), retentionRisk (enum),
  verified (bool), mediaType (enum: text|voice|image), costEstimate (number?)`.
  Existing to keep: `submitFeedbackSchema, getFeedbacksSchema, feedbackParamsSchema,
  updateFeedbackStatusSchema, correctFeedbackSchema, submitFeedbackFormSchema`.
- `shared/src/features/ai/schemas.ts`: extend analysis output (mirror above);
  keep `chatSchema, chatStreamSchema`.
- `shared/src/features/analytics/schemas.ts`: add `retention-risk, export, verified`
  params; keep `analyticsParamsSchema`.
- `server/prisma/schema.prisma` migration:
  `Feedback += satisfactionEstimate Int?, fixableProblem Boolean?,
  concreteIssue String?, retentionRisk String?, verified Boolean @default(false),
  verificationSource String?, mediaUrl String?, mediaType String?, costEstimate Float?`;
  new `ApiToken{id, organizationId, tokenHash, scopes String[], expiresAt}` +
  `Webhook{id, organizationId, url, secret, events String[]}`;
  `Task`: prefer reuse `Feedback(status/ownerReply/internalNote/resolvedAt)` first;
  add `Task` model only if D1 assignment history outgrows it.
- Env: `SMTP_HOST/PORT/USER/PASS/FROM` (or `RESEND_API_KEY`), no other new infra
  (Redis/S3/Stripe/Gemini already wired).

## 5. Build order (grounded, each shippable)

1. **Phase 0** — contracts + Prisma migrate + seed `demo-coffee`; typecheck both pkgs.
2. **Phase 1 (I1)** — AI quality fix; tests for tolerated-friction cases.
3. **Phase 2 (E2)** — team UI (pure client, server ready).
4. **Phase 3 (V2)** — mail service + urgency worker + digest.
5. **Phase 4 (D1+F6+I3)** — action loop + auto-reply + recommendation links.
6. **Phase 5 (F1+D2)** — retention-risk endpoint + predictive cron.
7. **Phase 6 (V3+D3+D4)** — export + verified + public API/docs.
8. **Phase 7 (E1+F3+F4+F5)** — NLQ cards + marketing + staff perf + cost.
9. **Phase 8 (E3+E4)** — voice/image + i18n.

## 6. Verification per phase

- `server/: npm run typecheck, lint, test (vitest run), build (tsc)`;
  `client/: typecheck, lint, test, build (tsc -b && vite build)`.
- CI: `lint -> typecheck -> test -> build`; `npm ci --legacy-peer-deps`; Node 22; PG service.
- New tests: `ai/service.test.ts` (satisfaction vs sentiment incl. 44% cases),
  analytics retention/export, queue/worker delivery, `MembersPage`/export UI (Vitest).
- Manual: `docker compose up --build` (5173 -> 5000 -> pg 5434);
  register `demo@example.com`, `npm run prisma:seed`, stream chat, cron, SMTP catcher.

## 7. Stakeholder coverage check

- Owner: F1 risk + digest + export (board-ready).
- Manager: heatmap + routing + NLQ root-cause (`ai/service + AIPage`).
- Staff: close-the-loop UI + praise tagging + fix targets + F4 recognition.
- Customer: QR page + auto-ack High-urgency + "your feedback led to X" changelog (from insights job).
- Supplier: category scorecard export via V3 + S3 audit file + AI defect taxonomy.
- Regulator: Prisma audit trail + insight archive (S3) + reply timestamps.

## 8. Risks / non-goals

- No new server framework; no custom JWT; no breaking `auth/{*any}` catch-all or
  webhook raw-body order; no full white-label (PRD P2 partial stays).
- Email provider choice (SMTP vs Resend) needed in Phase 3.
- Transcription + S3 growth: gate E3 behind Pro.
- E4/I18n last: biggest surface, lowest near-term revenue leverage.
