# Product Requirements Document (PRD)
## AI Feedback Collector - Production Upgrade

**Version:** 2.0
**Date:** September 2026
**Author:** Endalk
**Status:** Superseded by `stack-upgrade` implementation — see `UPGRADE_STRATEGY.md`, `DOCUMENTATION.md`, and `deployment.md` for the current stack (PostgreSQL + Prisma, Better-Auth session cookies, Vercel AI SDK, Docker Compose). Sections below referencing MongoDB/Mongoose, custom JWT, Render/Vercel deploys, and the old project layout are historical.

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

### What Needs Improvement
| Area | Current | Target |
|------|---------|--------|
| Language | JavaScript (ESM) | TypeScript (strict mode) |
| Testing | None | Unit + Integration + E2E |
| CI/CD | None | GitHub Actions |
| Docker | None | Docker + Docker Compose |
| Styling | Plain CSS files | Tailwind CSS + Design System |
| State Management | Context API | Zustand or TanStack Query |
| Form Handling | React Hook Form | React Hook Form + Zod (already used) |
| Error Handling | Basic try/catch | Global error boundary + structured logging |
| API Design | REST | REST + OpenAPI spec |

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

**GitHub Actions Workflow:**
```yaml
# On every push/PR:
1. Lint (ESLint + Prettier)
2. Type Check (TypeScript)
3. Unit Tests (Vitest)
4. Integration Tests (Vitest + test DB)
5. Build (Vite + TypeScript)

# On main branch merge:
6. Build + publish Docker images (client nginx + server node, see `docker-compose.prod.yml`)
```

**Quality Gates:**
- All tests must pass
- No TypeScript errors
- Lint must pass
- Build must succeed

### 6.4 Docker Deployment (Priority: HIGH)

**Docker Setup:**
```yaml
# docker-compose.yml
services:
  client:
    build: ./client
    ports: ["3000:3000"]
    
  server:
    build: ./server
    ports: ["5000:5000"]
    depends_on: [postgres]
    
  postgres:
    image: postgres:16-alpine
    ports: ["5434:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
```

**Hosting Options:**
1. **Docker Compose prod stack** (current: client nginx:3000 + server node:5000 + postgres, see `docker-compose.prod.yml`)
2. **Railway** - Free tier with Docker support
3. **Fly.io** - Free tier with Docker deployment

**Recommendation:** Docker Compose for prod and self-hosting (local dev also via `docker-compose.yml`). The old Render + Vercel workflow (`.github/workflows/deploy.yml`) has been removed.

### 6.5 UI/UX Redesign (Priority: MEDIUM)

**Design System:**
- **Framework:** Tailwind CSS 4
- **Component Library:** shadcn/ui (accessible, customizable)
- **Icons:** Lucide React (already used)
- **Animations:** Framer Motion (already used)

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
| Feedback Submission | Public page, text input, AI analysis | P0 |
| Dashboard | Overview, feedback list, pagination | P0 |
| Basic Analytics | Sentiment chart, category count | P0 |
| Pro Analytics | Trends, heatmap, alerts, recommendations | P1 |
| AI Chat | InsightBot for natural language queries | P1 |
| Stripe Payments | Checkout, billing portal, webhooks | P0 |
| Settings | Org name, logo upload | P0 |

### 7.2 New Features (Add)

| Feature | Description | Priority |
|---------|-------------|----------|
| Team Collaboration | Invite team members, role-based access | P1 |
| Multi-language Support | i18n for feedback page | P2 |
| Email Notifications | Alert on high-urgency feedback | P1 |
| Export Data | CSV/PDF export of feedback and analytics | P2 |
| Custom Branding | White-label feedback page | P2 |
| API Access | REST API for integrations | P2 |
| Webhooks | Push notifications to external services | P2 |

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

| Layer | Current | Proposed |
|-------|---------|----------|
| **Frontend** | React 19, Vite, Plain CSS | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express 5, JavaScript | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL 16, Prisma 6 | PostgreSQL 16, Prisma 6 (keep) |
| **AI** | Gemini 2.0 Flash | Gemini 2.0 Flash (keep) |
| **Payments** | Stripe | Stripe (keep) |
| **Storage** | S3-compatible object storage | S3-compatible object storage (keep) |
| **Auth** | Better-Auth session cookies | Better-Auth session cookies (keep) |
| **Testing** | None | Vitest, React Testing Library, Playwright |
| **CI/CD** | None | GitHub Actions |
| **Docker** | None | Docker + Docker Compose |
| **Linting** | ESLint (basic) | ESLint + Prettier (strict) |

### 8.2 Project Structure (Proposed)

```
AI-Feedback-collector-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── app/              # App entry, routes, providers
│   │   ├── components/       # Shared UI components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── features/         # Feature-based modules
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── feedback/
│   │   │   ├── analytics/
│   │   │   ├── ai/
│   │   │   ├── payments/
│   │   │   └── settings/
│   │   ├── hooks/            # Shared custom hooks
│   │   ├── lib/              # Utilities, API client
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # Global styles
│   ├── public/               # Static assets
│   ├── tests/                # Frontend tests
│   ├── Dockerfile
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── config/           # Configuration (cloudinary, etc.)
│   │   ├── features/<domain>/ # Route handlers + services + Zod schemas per slice
│   │   ├── lib/              # env, auth, prisma clients
│   │   ├── middleware/        # Custom middleware
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── jobs/             # Cron jobs
│   ├── tests/                # Backend tests
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI pipeline
│       └── deploy.yml        # CD pipeline
├── .eslintrc.js
├── .prettierrc
├── tsconfig.base.json        # Shared TS config
└── PRD.md
```

### 8.3 Database Schema (Current - Keep)

- **User/Account/Session/Verification** - Better-Auth tables (Prisma)
- **Organization** - Name, slug, QR, categories
- **Feedback** - Text, AI analysis (sentiment, urgency, rating, keywords)
- **Subscription** - Stripe mirror
- **Insight** - Cached AI recommendations

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize TypeScript in both client and server
- [ ] Set up ESLint + Prettier with strict rules
- [ ] Create shared type definitions
- [ ] Convert critical files to TypeScript (auth, feedback)
- [ ] Set up Vitest for backend
- [ ] Write unit tests for services and utilities

### Phase 2: Testing & CI (Week 3-4)
- [ ] Complete TypeScript migration
- [ ] Write integration tests for API endpoints
- [ ] Set up GitHub Actions CI pipeline
- [ ] Add lint + type-check + test steps
- [ ] Configure build pipeline
- [ ] Add test coverage reporting

### Phase 3: Docker & Deployment (Week 5)
- [ ] Create Dockerfiles for client and server
- [ ] Set up Docker Compose for local dev
- [ ] Test Docker deployment locally
- [ ] Update deployment configs
- [ ] Document deployment process

### Phase 4: UI/UX Redesign (Week 6-8)
- [ ] Install and configure Tailwind CSS
- [ ] Install shadcn/ui components
- [ ] Create design tokens (colors, typography, spacing)
- [ ] Redesign landing page
- [ ] Redesign auth pages
- [ ] Redesign dashboard
- [ ] Redesign analytics pages
- [ ] Ensure mobile responsiveness

### Phase 5: New Features (Week 9-10)
- [ ] Add email notifications (high-urgency feedback)
- [ ] Add team collaboration (invite members, roles)
- [ ] Add data export (CSV/PDF)
- [ ] Add loading states and skeleton screens
- [ ] Add error boundaries
- [ ] Optimize performance

### Phase 6: Polish & Launch (Week 11-12)
- [ ] Final UI polish and accessibility audit
- [ ] Performance optimization (Lighthouse)
- [ ] Security audit
- [ ] Documentation update
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

1. **Should we add team collaboration now or later?** (Recommended: Later, focus on core)
2. **Do we want to support self-hosting or just SaaS?** (Recommended: Both)
3. **Should we migrate to a different database?** (Decided: PostgreSQL 16 + Prisma — MongoDB migration explicitly rejected per `UPGRADE_STRATEGY.md`)
4. **Do we want to add authentication providers (Google, GitHub)?** (Recommended: Later)
5. **Should we add rate limiting to AI features?** (Recommended: Yes, to control costs)

---

## 13. Appendices

### A. Current API Endpoints

**Auth (Better-Auth at `/api/auth/*` + custom endpoints):**
- POST `/api/auth/sign-up/email` (Better-Auth)
- POST `/api/auth/sign-in/email` (Better-Auth)
- POST `/api/auth/sign-out` (Better-Auth)
- GET `/api/auth/me`
- GET `/api/auth/has-org`

**Feedback:**
- POST `/api/feedback/:slug`
- GET `/api/feedback/:slug`

**Analytics (mounted at `/api/analytics`, auth + org membership required):**
- GET `/api/analytics/:slug/sentiment`
- GET `/api/analytics/:slug/categories`
- GET `/api/analytics/:slug/heatmap`
- GET `/api/analytics/:slug/issues`
- GET `/api/analytics/:slug/alerts`
- GET `/api/analytics/:slug/recommendations` (Pro only)

**AI:**
- POST `/api/ai/chat`

**Payments:**
- POST `/api/payments/checkout`
- POST `/api/payments/portal`
- POST `/api/payments/webhook`
- GET `/api/payments/verify-session`

**Settings (mounted at `/api/settings`):**
- GET `/api/settings/:slug`
- PUT `/api/settings/:slug`

### B. Environment Variables

**Backend:**
- `PORT`
- `DATABASE_URL` (PostgreSQL)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GEMINI_API_KEY`
- `AI_MODEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `CLIENT_URL`

**Frontend:**
- `VITE_API_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### C. Deployment Links

- Frontend: Docker prod stack (client nginx:3000, see `docker-compose.prod.yml`)
- Backend: Docker prod stack (server node:5000, `prisma migrate deploy` on start)
- Database: PostgreSQL 16 (see `docker-compose.prod.yml`)
- Payments: Stripe (configured)

---

**Document End**

*This PRD is a living document. Updates should be made as requirements evolve and decisions are made.*
