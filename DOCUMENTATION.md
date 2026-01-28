# AI Feedback Collector: Technical Deep Dive

## 🌟 Product Vision
The **AI Feedback Collector** is a SaaS platform designed to transform raw, overwhelming customer feedback into clear, actionable business intelligence. By leveraging a QR-code-driven collection method and advanced LLM analysis, it bridges the gap between customer voices and data-driven decisions.

---

## 🏗️ System Architecture

### High-Level Overview
The application follows a modern MERN stack architecture (MongoDB, Express, React, Node) with specialized third-party integrations for AI and Payments.

```mermaid
graph TD
    User((Customer)) -->|Scan QR| Client[React Frontend]
    Admin((Business Owner)) -->|Dashboard| Client
    Client -->|API Requests| Server[Node/Express Backend]
    Server -->|Queries| DB[(MongoDB)]
    Server -->|Analysis| AI[Gemini 2.0 AI]
    Server -->|Payments| Stripe[Stripe API]
    Server -->|Images| Cloudinary[Cloudinary]
```

### Key Technical Decisions
- **AI Engine (Gemini 2.0 Flash)**: Chosen for its speed and native support for structured JSON output, which is critical for parsing sentiment and keywords.
- **Vite Proxy**: Used to eliminate CORS issues during development and provide a seamless dev experience.
- **Stripe Webhooks**: Implemented to ensure the application's subscription state is always in sync with the payment processor, handling edge cases like failed renewals and cancellations.
- **JWT + Refresh Tokens**: Provides a secure and smooth authentication experience, allowing users to stay logged in across sessions safely.

---

## 📊 Database Schema

### Models & Relationships
1.  **User**: Stores authentication and profile data. 
    - *Link*: Has one Organization.
2.  **Organization**: Contains business details, custom AI categories, and a unique slug for the QR landing page.
    - *Link*: Belong to a User. Contains many Feedbacks.
3.  **Feedback**: Stores the raw message and AI-enriched analysis (sentiment, rating, keywords).
    - *Link*: Belongs to an Organization.
4.  **Subscription**: Local cache of Stripe subscription states (plan, status, period end).
    - *Link*: Belongs to a User.

---

## 🤖 AI Pipeline
The core "magic" happens in the `analyzeFeedback` pipeline:
1.  **Input**: Raw text from a customer.
2.  **Context**: The organization's business type and description.
3.  **Processing**: A structured prompt is sent to `gemini-2.0-flash` with a strict JSON schema.
4.  **Enrichment**: The AI returns sentiment (Positive/Negative/Neutral), an inferred 1-5 rating, key themes, and an urgency score.
5.  **Storage**: The enriched data is saved, enabling real-time dashboard analytics.

---

## 💳 SaaS & Monetization
The app features a fully functional subscription engine:
- **Plans**: Basic and Pro tiers.
- **Access Control**: Middleware checks for active subscriptions and redirects users to a "Reactivate" or "Payment" page if their status is invalid.
- **Billing Portal**: Integrated Stripe Customer Portal allows users to manage their own billing without manual support.

---

## 🚀 Deployment Strategy
- **Frontend**: Hosted on **Vercel** for lightning-fast edge delivery.
- **Backend**: Containerized and deployed on **Render**.
- **Database**: **MongoDB Atlas** for high availability.
