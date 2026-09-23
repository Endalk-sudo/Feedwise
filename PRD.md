# Product Requirements Document (PRD)
## AI Feedback Collector - Production Upgrade

**Version:** 2.0
**Date:** September 2026
**Author:** Endalk
**Status:** Superseded by `stack-upgrade` implementation — see `docs/UPGRADE_PLAN.md`, `DOCUMENTATION.md`, and `deployment.md` for the current stack (PostgreSQL + Prisma, Better-Auth session cookies, Vercel AI SDK, Docker Compose). Sections below referencing MongoDB/Mongoose, custom JWT, Render/Vercel deploys, and the old project layout are historical.

---

## 1. Executive Summary

AI Feedback Collector is a SaaS platform that helps businesses collect, analyze, and act on customer feedback using AI. This PRD outlines the production-grade upgrade to transform the current prototype into a scalable, maintainable, and professional product.

**Primary Goal:** Upgrade from prototype to production-ready SaaS with TypeScript, modern testing, CI/CD, Docker deployment, and improved UI/UX.

**Target Users:** Business owners (restaurants, clinics, retail stores, service providers) who want to collect and understand customer feedback without technical expertise.

---

## 2. Problem Statement

### Current Pain Points
1. **No type safety** - JavaScript codebase is prone to runtime errors
2. **No tests** - Zero test coverage means regressions are invisible
3. **No CI/CD** - Manual deployments are slow and error-prone
4. **Inconsistent UI** - CSS files are scattered, no design system
5. **No containerization** - Deployment is platform-specific
6. **Limited scalability** - Monolithic architecture will struggle at scale

### Business Problem Solved
Small businesses lose customers because they don't understand feedback. Manual analysis is:
- Time-consuming (hours per week)
- Inconsistent (human bias)
- Incomplete (misses patterns)
- Delayed (feedback arrives too late)

**AI Feedback Collector solves this** by providing instant, AI-powered analysis with actionable insights.

---

## 3. Target Users

### Primary Persona: Business Owner
- **Who:** Owner/operator of a small business (1-50 employees)
- **Goal:** Understand what customers think, identify problems, improve service
- **Pain:** No time to read every review, can't spot trends, misses urgent complaints
- **Value Prop:** "Know what your customers think in seconds, not hours"

### Secondary Persona: Customer
- **Who:** Any customer visiting the business
- **Goal:** Share feedback quickly and anonymously
- **Pain:** Long survey forms, no anonymity, feels like feedback goes nowhere
- **Value Prop:** "Scan, type, done - your feedback matters"

---

## 4. Core Value Proposition

> **For business owners** who want to understand their customers, **AI Feedback Collector** is a **feedback analysis platform** that **turns customer comments into actionable insights** using AI. Unlike **manual review reading** or **generic survey tools**, our product **provides instant AI analysis, trend detection, and growth recommendations**.

---

## 5. Current State Analysis

### What Works Well
- ✅ Complete user authentication flow (Better-Auth session cookies via Prisma adapter)
- ✅ Organization setup with custom categories
- ✅ QR code generation and public feedback submission
- ✅ Real-time AI analysis with Gemini
- ✅ Stripe subscription integration
- ✅ Basic and Pro analytics dashboards
- ✅ AI chat assistant (InsightBot)
- ✅ Daily insight generation cron job
- ✅ Team collaboration client UI (`/dashboard/team`: invite by email, roles)
- ✅ High-urgency + daily digest email alerts (SMTP via nodemailer)

### What Needs Improvement
> Status 2026-09: all rows below are **done** (TypeScript strict, Vitest, GitHub Actions CI, Docker Compose dev+prod, Tailwind v4 + custom UI kit, Zustand + TanStack Query, Zod validation, Winston logging, express-rate-limit). Remaining gaps live in §7.2 / §9 Phase 5.

| Area | Before | After |
|------|---------|-------|
| Language | JavaScript (ESM) | TypeScript (strict mode) ✅ |
| Testing | None | Vitest (unit + service tests) ✅ |
| CI/CD | None | GitHub Actions ✅ |
| Docker | None | Docker + Docker Compose (dev + prod) ✅ |
| Styling | Plain CSS files | Tailwind CSS + custom UI kit ✅ |
| State Management | Context API | Zustand + TanStack Query ✅ |
| Form Handling | React Hook Form | React Hook Form + Zod ✅ |
| Error Handling | Basic try/catch | ErrorBoundary + structured logging ✅ |
| API Design | REST | REST + Zod-validated contracts (`@aifc/contracts`) ✅ |

---

## 6. Upgrade Requirements

### 6.1 TypeScript Migration (Priority: HIGH)

**Frontend:**
- Convert all `.jsx` → `.tsx`
- Add proper type definitions for API responses, props, state
- Create shared types directory (`types/`)
- Enable strict mode in `tsconfig.json`

**Backend:**
- Convert all `.js` → `.ts` (done — no `.js` sources remain in `server/src/`)
- Type all Prisma models, controllers, middleware
- Create type definitions for Express request/response
- Use Zod schemas for runtime validation (already done)

**Benefits:**
- Catch errors at compile time
- Better IDE support and autocomplete
- Self-documenting code
- Safer refactoring

### 6.2 Testing Strategy (Priority: HIGH)

**Unit Tests:**
- Services (ai service, paymentService)
- Utilities (timeUtils, logger)
- Middleware (auth, validation)

**Integration Tests:**
- API endpoints (auth, feedback, analytics, payments)
- Database operations (Prisma models)
- AI pipeline (mock Gemini calls)

**E2E Tests:**
- User registration → org setup → feedback submission → dashboard view
- Payment flow → subscription activation → feature access

**Tools:**
- Backend: Vitest (fast, ESM-native)
- Frontend: Vitest + React Testing Library
- E2E: Playwright (cross-browser)
- Mocking: MSW (Mock Service Worker) for API mocking

### 6.3 CI/CD Pipeline (Priority: HIGH)

**GitHub Actions Workflow (`ci.yml` — current):**
```yaml
# On push to main/develop/stack-upgrade and PRs to main:
1. Lint (ESLint + Prettier check, client + server)
2. Type Check (TypeScript, client + server)
3. Unit Tests (Vitest + Postgres service, client + server)
4. Build (tsc/vite, depends on 1-3; uploads client/dist + server/dist)
```
> No image publish or CD pipeline exists yet — prod deploys via
> `docker-compose.prod.yml` (see `deployment.md`).

**Quality Gates:**
- All tests must pass
- No TypeScript errors
- Lint must pass
- Build must succeed

### 6.4 Docker Deployment (Priority: HIGH)

**Docker Setup (current — all builds use repo-root context so the
`file:../shared` contracts dependency resolves):**
```yaml
# docker-compose.yml (dev, hot reload)
services:
  client:                     # client/Dockerfile.dev → vite :5173
    build: { context: ., dockerfile: client/Dockerfile.dev }
  server:                     # server/Dockerfile.dev → tsx watch :5000
    build: { context: ., dockerfile: server/Dockerfile.dev }
  postgres:                   # postgres:16-alpine, host 5434
  redis:                      # redis:7-alpine, host 6379 (BullMQ + rate limits)
```
Prod (`docker-compose.prod.yml`): client nginx:3000 + server node:5000 +
internal-only postgres; `prisma migrate deploy` on server start.

**Hosting Options:**
1. **Docker Compose prod stack** (current: client nginx:3000 + server node:5000 + postgres, see `docker-compose.prod.yml`)
2. **Railway** - Free tier with Docker support
3. **Fly.io** - Free tier with Docker deployment

**Recommendation:** Docker Compose for prod and self-hosting (local dev also via `docker-compose.yml`). The old Render + Vercel workflow (`.github/workflows/deploy.yml`) has been removed.

### 6.5 UI/UX Redesign (Priority: MEDIUM)

**Design System (as built):**
- **Framework:** Tailwind CSS 4 (CSS-first, no config file)
- **Component Library:** custom kit in `client/src/components/ui` (Button, Card, Badge, Input, PageHeader, Logo, Spinner, EmptyState, Drawer, Container) — no shadcn/ui, no Radix usage
- **Icons:** Lucide React
- **Animations:** CSS keyframes in `index.css` (no Framer Motion — not adopted)

**Pages to Redesign:**
1. **Landing Page** - Modern SaaS landing with hero, features, pricing, testimonials
2. **Auth Pages** - Clean login/register with social login options
3. **Dashboard** - Redesign with shadcn components, better spacing
4. **Feedback Page** - Mobile-first, minimal friction
5. **Analytics** - Interactive charts with better data visualization
6. **Settings** - Cleaner form layout with better UX

**Design Principles:**
- Mobile-first responsive design
- Consistent spacing and typography
- Accessible (WCAG 2.1 AA)
- Fast load times (<2s)
- Minimal cognitive load

### 6.6 Architecture Improvements (Priority: MEDIUM)

**Backend:**
- Service layer pattern (already partially implemented)
- Proper error handling middleware
- Request validation middleware (Zod, already done)
- Structured logging (Winston, already done)
- Rate limiting improvements

**Frontend:**
- TanStack Query for server state management
- Zustand for client state (optional)
- React Error Boundaries
- Lazy loading for routes
- Optimistic updates for better UX

**Database:**
- Proper indexing strategy
- Connection pooling configuration
- Backup strategy documentation

---

## 7. Feature Specifications

### 7.1 Core Features (Keep & Improve)

| Feature | Description | Priority |
|---------|-------------|----------|
| User Auth | Registration, login, logout, session (Better-Auth cookies) | P0 |
| Organization Setup | Create org, custom categories, QR generation | P0 |
| Feedback Submission | Public page, text input, AI analysis (sentiment + satisfaction 1–5, fixable-problem flag, retention risk) | P0 |
| Dashboard | Overview, feedback list, pagination | P0 |
| Basic Analytics | Sentiment chart, category count | P0 |
| Pro Analytics | Trends, heatmap, alerts, recommendations | P1 |
| AI Chat | InsightBot for natural language queries | P1 |
| Stripe Payments | Checkout, billing portal, webhooks | P0 |
| Settings | Org name, logo upload | P0 |

### 7.2 New Features (Status 2026-09)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Team Collaboration | Invite team members, role-based access | P1 | Done — client `MembersPage` (`/dashboard/team`): add/remove + role change over existing member endpoints (existing-users-only) |
| Multi-language Support | i18n for feedback page | P2 | Deferred |
| Email Notifications | Alert on high-urgency feedback | P1 | Done — SMTP via nodemailer (`server/src/lib/mail.ts`): immediate alerts on High urgency or satisfaction ≤ 2 + 7AM daily digest (`workers/notification.worker.ts`); safe no-op when `SMTP_HOST` is empty |
| Export Data | CSV/PDF export of feedback and analytics | P2 | Deferred |
| Custom Branding | White-label feedback page | P2 | Partial — org logo upload + public-page branding exist; no full white-label |
| API Access | REST API for integrations | P2 | Partial — internal REST API exists, no public tokens/docs |
| Webhooks | Push notifications to external services | P2 | Deferred (inbound Stripe webhook only) |

### 7.3 Landing Page Redesign

**Sections:**
1. **Hero** - Headline, subheadline, CTA, product screenshot
2. **Problem** - Pain points of manual feedback analysis
3. **Solution** - How AI Feedback Collector solves it
4. **Features** - Grid of key features with icons
5. **How It Works** - 3-step process (Sign up → Share QR → Get insights)
6. **Pricing** - Basic vs Pro comparison table
7. **Testimonials** - Social proof (placeholder for now)
8. **FAQ** - Common questions
9. **CTA** - Final call to action
10. **Footer** - Links, legal, contact

---

## 8. Technical Architecture

### 8.1 Proposed Tech Stack

| Layer | Before | After (2026-09) |
|-------|---------|-----------------|
| **Frontend** | React 19, Vite, Plain CSS | React 19, Vite 7, TypeScript strict, Tailwind v4, custom UI kit ✅ |
| **Backend** | Node.js, Express 5, JavaScript | Node.js 22, Express 5, TypeScript strict ✅ |
| **Database** | PostgreSQL 16, Prisma 6 | PostgreSQL 16, Prisma 6 (kept) ✅ |
| **AI** | Gemini Flash | Gemini Flash via Vercel AI SDK ✅ |
| **Payments** | Stripe | Stripe v22 ✅ |
| **Storage** | S3-compatible object storage | S3-compatible object storage (kept) ✅ |
| **Auth** | Better-Auth session cookies | Better-Auth session cookies (kept) ✅ |
| **Testing** | None | Vitest (+ RTL) ✅ |
| **CI/CD** | None | GitHub Actions (lint → typecheck → test → build) ✅ |
| **Docker** | None | Docker + Docker Compose (dev + prod) ✅ |
| **Linting** | ESLint (basic) | ESLint + Prettier ✅ |

### 8.2 Project Structure (Actual)

```
AI-Feedback-collector-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── app/              # router (TanStack Router, code-based)
│   │   ├── components/ui/    # shared UI kit (Button, Card, Badge, …)
│   │   ├── features/<domain>/# pages, hooks, types, components per slice
│   │   ├── lib/              # api client, auth-client, query-client, stores, utils
│   │   └── styles/           # index.css (Tailwind v4 CSS-first theme)
│   ├── nginx.conf
│   ├── Dockerfile(.dev)      # repo-root build context (resolves shared/)
│   ├── eslint.config.js
│   ├── tsconfig.json
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── features/<domain>/# routes + service + schemas per slice
│   │   ├── lib/              # env, auth, prisma, redis, queue, mail
│   │   ├── middleware/       # validation, rate-limit, …
│   │   ├── jobs/             # node-cron (insight generation, digest, subscription sync)
│   │   └── workers/          # BullMQ workers
│   ├── prisma/               # schema, migrations, seed
│   ├── Dockerfile(.dev)      # repo-root build context (resolves shared/)
│   └── package.json
├── shared/                    # @aifc/contracts — Zod v4 schemas (built to dist/)
├── docs/                      # research notes + UPGRADE_PLAN.md (upgrade phases)
├── docker-compose.yml         # dev: vite:5173 + tsx:5000 + postgres:5434 + redis:6379
├── docker-compose.prod.yml    # prod: nginx:3000 + node:5000 + internal postgres
├── .github/workflows/ci.yml   # lint → typecheck → test → build
├── .prettierrc
└── PRD.md
```

### 8.3 Database Schema (Current - Keep)

- **User/Account/Session/Verification** - Better-Auth tables (Prisma)
- **Organization** - Name, slug, QR, categories
- **Feedback** - Text, AI analysis (sentiment, urgency, rating, keywords, plus satisfaction 1–5, fixable-problem flag, concrete issue, retention risk, verified/media/cost fields)
- **Subscription** - Stripe mirror
- **Insight** - Cached AI recommendations

---

## 9. Implementation Roadmap (Status 2026-09)

### Phase 1: Foundation (Week 1-2) ✅ Done
- [x] Initialize TypeScript in both client and server
- [x] Set up ESLint + Prettier
- [x] Create shared contracts package (`shared/`, Zod v4)
- [x] Convert critical files to TypeScript (auth, feedback)
- [x] Set up Vitest for backend
- [x] Write unit tests for services and utilities

### Phase 2: Testing & CI (Week 3-4) ✅ Done
- [x] Complete TypeScript migration
- [x] Service-level tests for API logic
- [x] Set up GitHub Actions CI pipeline
- [x] Add lint + type-check + test steps
- [x] Configure build pipeline
- [ ] Test coverage reporting
- [ ] Playwright E2E (deferred)

### Phase 3: Docker & Deployment (Week 5) ✅ Done
- [x] Create Dockerfiles for client and server (repo-root context for `shared/`)
- [x] Set up Docker Compose for local dev (+ prod parity file)
- [x] Test Docker deployment locally
- [x] Document deployment process

### Phase 4: UI/UX Redesign (Week 6-8) ✅ Done
- [x] Configure Tailwind CSS v4 (CSS-first)
- [x] Build custom UI kit (`components/ui`) + success/warning theme tokens
- [x] Create design tokens (colors, typography, spacing)
- [x] Redesign landing page
- [x] Redesign auth pages
- [x] Redesign dashboard
- [x] Redesign analytics pages
- [x] Mobile responsiveness pass
- [ ] Full WCAG audit (deferred)

### Phase 5: New Features (Week 9-10) — open, see §7.2
- [x] Email notifications (high-urgency feedback + daily digest via SMTP)
- [x] Team collaboration client UI (`/dashboard/team`, existing-users-only)
- [ ] Data export (CSV/PDF)
- [x] Loading states (Spinner/LoadingState/Skeleton primitives)
- [x] Error boundaries (ErrorBoundary component)
- [ ] Performance optimization (Lighthouse)

### Phase 6: Polish & Launch (Week 11-12) — open
- [ ] Final accessibility audit
- [ ] Performance optimization (Lighthouse)
- [ ] Security audit
- [x] Documentation update (this sync)
- [ ] Production deployment
- [ ] Post-launch monitoring setup

---

## 10. Success Metrics

### Technical Metrics
| Metric | Current | Target |
|--------|---------|--------|
| TypeScript Coverage | 0% | 100% |
| Test Coverage | 0% | >80% |
| Build Time | N/A | <2 min |
| CI Pipeline | None | <5 min |
| Docker Build | None | <3 min |
| Lighthouse Score | Unknown | >90 |

### Business Metrics
| Metric | Current | Target |
|--------|---------|--------|
| User Registration | Unknown | Track |
| Feedback Submissions | Unknown | Track |
| Conversion (Free→Paid) | Unknown | >5% |
| Monthly Active Users | Unknown | Track |
| Customer Satisfaction | Unknown | >4.5/5 |

### Deployment Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Deploy Frequency | Manual | Daily |
| Deploy Time | Unknown | <10 min |
| Rollback Time | Unknown | <5 min |
| Downtime | Unknown | <1% |

---

## 11. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TypeScript migration breaks existing code | High | Medium | Incremental migration, keep JS files working |
| Testing reveals critical bugs | Medium | High | Fix bugs before proceeding, maintain test coverage |
| Docker deployment issues | Medium | Medium | Test locally first, use proven base images |
| UI/UX redesign breaks functionality | High | Low | Feature flags, gradual rollout |
| Performance regression | Medium | Medium | Performance testing before and after |
| Scope creep | High | High | Strict adherence to PRD, defer nice-to-haves |

---

## 12. Open Questions

1. **Should we add team collaboration now or later?** (Decided: now — built in upgrade Phases 0–3, `/dashboard/team`)
2. **Do we want to support self-hosting or just SaaS?** (Recommended: Both)
3. **Should we migrate to a different database?** (Decided: PostgreSQL 16 + Prisma — MongoDB migration explicitly rejected per `docs/UPGRADE_PLAN.md`)
4. **Do we want to add authentication providers (Google, GitHub)?** (Recommended: Later)
5. **Should we add rate limiting to AI features?** (Decided: Yes — `aiRateLimiter` on chat endpoints + Redis-backed `express-rate-limit` with `ipKeyGenerator` IPv6 handling)

---

## 13. Appendices

### A. Current API Endpoints (verified 2026-09)

**Auth (`/api/auth` — custom routes run before the Better-Auth catch-all `/{*any}`):**
- POST `/api/auth/sign-up/email` (Better-Auth)
- POST `/api/auth/sign-in/email` (Better-Auth)
- POST `/api/auth/sign-out` (Better-Auth)
- GET `/api/auth/me`
- GET `/api/auth/has-org`

**Feedback (mounted at `/api/feedback`):**
- POST `/api/feedback/:slug` (public, rate-limited)
- GET `/api/feedback/:slug` (auth)
- GET `/api/feedback/:slug/stats` (auth)
- GET `/api/feedback/:slug/:id` (auth)
- PATCH `/api/feedback/:slug/:id/status` (close the loop: status/reply/note)
- PATCH `/api/feedback/:slug/:id/correct` (human correction of AI analysis)

**Analytics (mounted at `/api/analytics`, auth + org membership required):**
- GET `/api/analytics/:slug/sentiment`
- GET `/api/analytics/:slug/categories`
- GET `/api/analytics/:slug/heatmap`
- GET `/api/analytics/:slug/issues`
- GET `/api/analytics/:slug/alerts`
- GET `/api/analytics/:slug/recommendations` (Pro only)

**AI (mounted at `/api/ai`, auth; chat is Pro-gated):**
- POST `/api/ai/:slug/chat` (blocking fallback)
- POST `/api/ai/:slug/chat/stream` (UI-message stream, `useChat` + `DefaultChatTransport`)

**Organization (mounted at `/api/organization` unless noted):**
- POST `/api/organization/` (create org)
- GET `/api/organization/my-orgs`
- GET `/api/organization/:slug` (public — powers the QR landing page)
- PUT `/api/organization/:slug`
- POST `/api/organization/:slug/members`, DELETE `/api/organization/:slug/members/:userId`, PUT `/api/organization/:slug/members/:userId` (owner only)

**Payments (mounted at `/api/payments`):**
- POST `/api/payments/checkout`
- POST `/api/payments/portal`
- POST `/api/payments/webhook` (raw body, before `express.json()`)
- GET `/api/payments/verify-session/:sessionId`

**Settings (mounted at `/api/settings`):**
- GET `/api/settings/:slug`
- PUT `/api/settings/:slug`
- POST `/api/settings/logo` (multipart logo upload, owner/admin)

### B. Environment Variables (from `server/example.env` / `client/example.env`)

**Backend (`server/.env`):**
- `PORT`, `NODE_ENV`
- `DATABASE_URL` (PostgreSQL)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `GEMINI_API_KEY`, `AI_MODEL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID`
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, (+ `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL`, `S3_OBJECT_ACL`)
- `REDIS_URL` (local Redis or Upstash; empty = in-memory fallbacks)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM` (empty `SMTP_HOST` = emails skipped safely; local catcher e.g. Mailpit on `:1025`)
- `CLIENT_URL`

**Frontend (`client/.env`):**
- `VITE_API_URL` (empty = same-origin, Vite proxies `/api`)
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_BASIC_PRICE_ID`, `VITE_STRIPE_PRO_PRICE_ID`

### C. Deployment Links

- Frontend: Docker prod stack (client nginx:3000, see `docker-compose.prod.yml`)
- Backend: Docker prod stack (server node:5000, `prisma migrate deploy` on start)
- Database: PostgreSQL 16 (see `docker-compose.prod.yml`)
- Payments: Stripe (configured)

---

**Document End**

*This PRD is a living document. Updates should be made as requirements evolve and decisions are made.*
