# Feedback → Business Value Research (Feedwise)

## 1. Revenue Impact — Evidence & Metrics

Real correlations (Bain / Qualtrics / McKinsey meta-analyses):
- **5-point retention improvement → 25–95% profit increase** (Bain).
- **1-point NPS rise → 1.3% CLV lift** (Qualtrics, NPS ≥ 50).
- **10-point NPS increase → 12–18% retention increase** (Bain 2026); **→ 3.2% upsell revenue** (CustomerGauge B2B).
- **NPS explains 20–60% of organic growth variance** between competitors (Bain); NPS leaders outgrow competitors by 2×.
- **Dell detractor loss ≈ $68M**; converting 2→8% detractors → +$167M/year (Bain classic).

Key insight: sentiment ≠ satisfaction. arXiv 2606.19698 (70,450 support conversations): sentiment correlates 0.36 with satisfaction; satisfaction correlates 0.47. **44% disagreement** between sentiment and satisfaction. "Tolerated friction" (satisfied but reporting fixable problem) is the largest hidden-value group.

## 2. How Businesses Make Money from Feedback

| Mechanism | Value | Evidence / Product Example |
| Revenue — retention | Prevent churn via urgency/scoring | Qualtrics XM (predictive churn), Medallia (retention risk scoring) |
| Revenue — upsell / referral | Promoters → referrals / upsells | GatherUp (referral automation), Zendesk (promoter-triggered upsell campaigns) |
| Revenue — marketing / reviews | Positive feedback → public reviews / testimonials | ReviewTrackers (review generation from surveys), GatherUp (good reviews → Google reviews) |
| Cost — operational fixes | Fix root-cause categories → lower support cost | Medallia (operational theme tracking linked to cost centers); Zendesk (auto-categorization saves 5–10 hrs/week) |
| Cost — automation | Auto-categorization, auto-response, trend alerts | Qualtrics (AI text analytics), Zendesk (auto-respond + sentiment routing) |

## 3. Automation That Saves Most Time (mapped to Feedwise)

- **Auto-categorization** (already exists via Gemini in `server/src/features/ai/service.ts`) → saves 5–10 hrs/week manual sorting.
- **Auto-alert / notification** (missing; `server/src/jobs/generateInsights.ts` exists for daily insight) → closes insight→action gap; should trigger on high-urgency + satisfaction-drop.
- **Trend detection** (exists in analytics routes; missing client visualization) → shows cost-reduction trajectory over time.
- **Auto-response templates** (missing; `feedbackService.updateStatus` supports `ownerReply`) → could auto-generate reply drafts for common categories.
- **Marketing automation: good reviews → referral request** (missing) → converts promoters into new revenue; GatherUp / ReviewTrackers core feature.

## 4. Real Competitors & What They Do Best

- **Qualtrics XM** — predictive retention scoring, operational linkage (feedback → cost center), automated actions. Best at enterprise value attribution.
- **Medallia** — retention risk scoring, staff-performance dashboards linked to feedback, automated action plans. Strongest at closing insight→action loop.
- **Zendesk** — auto-categorization + response-time tracking; CSAT linked to retention evidence. Best automation for support teams.
- **ReviewTrackers / GatherUp** — review generation from surveys (marketing value), referral automation from promoters (revenue), staff-performance tracking linked to reviews. Best at turning feedback into public marketing assets.

## 5. Proposed New Features (Concrete + Codebase-Mapped)

### F1: Revenue Attribution & Retention Risk Score
- **What**: Per-feedback risk score based on urgency + sentiment + satisfaction + frequency; aggregate retention-risk metric per organization.
- **Why**: Qualtrics/Medallia do predictive risk; without it, the product can't claim revenue impact.
- **Maps to**: `server/src/features/ai/service.ts` (add `retentionRisk` output), `shared/contracts` (new Zod schema field), `server/src/features/analytics/routes.ts` (new `/retention-risk` endpoint), `client/src/features/analytics/pages/AnalyticsPage.tsx` (new risk dashboard widget).

### F2: Satisfaction + Fixable-Problem Annotation (Evidence-Based Fix)
- **What**: Replace single sentiment with structured fields: `satisfactionEstimate` (1–5), `fixableProblem` (boolean), `concreteIssue` (string). Based on arXiv 2606.19698.
- **Maps to**: `server/src/features/ai/service.ts` (enrich analysis output), `shared/contracts`, `client/src/features/feedback/types.ts`, `client/src/features/ai/pages/AIPage.tsx`.

### F3: Marketing Automation — Good Reviews → Referral Request
- **What**: When sentiment=Positive + urgency=Low + satisfaction high → trigger referral/review request email / SMS. Matches GatherUp behavior.
- **Maps to**: `server/src/jobs/generateInsights.ts` (add marketing branch), new `server/src/lib/mail.ts` (email worker), `client/src/features/settings/pages/MarketingPage.tsx` (new settings page).

### F4: Staff Performance Dashboard (Linked to Feedback)
- **What**: Per-staff metrics: response time, resolved rate, satisfaction trend, category ownership. Matches Medallia staff-performance link.
- **Maps to**: `server/src/features/organization/routes.ts` (member endpoints exist), `client/src/features/organization/pages/MembersPage.tsx` (new performance cards), new `server/src/features/staff/service.ts`.

### F5: Cost Reduction Tracking
- **What**: Link `category` + `rootCause` to estimated cost; track resolved high-cost issues over time; show cost-reduction trend in analytics.
- **Maps to**: `shared/contracts` (add `costEstimate` to feedback schema), `server/src/features/analytics/service.ts` (aggregate cost saved), `client/src/features/analytics/pages/AnalyticsPage.tsx`.

### F6: Insight → Action Automation (Auto-Response Drafts + Task Routing)
- **What**: High-urgency or negative feedback → auto-draft owner reply using `suggestedAction`; route to assigned staff member; log in analytics.
- **Maps to**: `server/src/features/feedback/service.ts` (`updateStatus` + new `autoReplyDraft`), `server/src/jobs/generateInsights.ts` (action trigger), `client/src/features/feedback/pages/FeedbackPage.tsx` (new "Auto-Reply Draft" UI).

### F7: Data Export (CSV/PDF) for Stakeholder Reporting
- **What**: Existing `analytics` endpoints provide raw data; add export endpoint + client download button.
- **Maps to**: `server/src/features/analytics/routes.ts`, `client/src/features/analytics/pages/AnalyticsPage.tsx`, `shared/contracts`.

All 7 features map to existing codebase modules; none require a new server package. Highest-value first: F2 (evidence-backed quality fix), F1 (revenue claim), F6 (closes insight→action gap), F3 (marketing revenue), F4 (retention via staff), F5 (cost claim), F7 (retention/stakeholder reporting).
