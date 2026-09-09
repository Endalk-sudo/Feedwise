# 🚀 AI Feedback Collector (SaaS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/frontend-React%2019-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2016-green)](https://www.postgresql.org/)

**AI Feedback Collector** is a full-stack SaaS platform designed to help businesses turn customer feedback into actionable insights instantly. Using QR codes for collection and Gemini AI for analysis, it categorizes, measures sentiment, and provides growth recommendations in real-time.

---

## 📖 Project Overview
The goal of this project is to simplify the feedback loop for small to medium businesses. Customers scan a QR code, leave their thoughts, and the AI handles the rest—categorizing the input, detecting sentiment, and alerting owners to urgent issues.

### 💡 Key Features
- **🤖 Smart AI Analysis**: Powered by Gemini 2.0, providing sentiment detection, priority scoring, and keyword extraction.
- **💳 SaaS-Ready**: Integrated Stripe payments for Basic and Pro subscription tiers.
- **📊 Interactive Dashboard**: Professional analytics using modern charting for sentiment trends and category breakthroughs.
- **📱 QR Collection**: Unique, organization-specific landing pages and QR codes for easy physical-to-digital feedback.
- **💬 Admin AI Chat**: An intelligent assistant to help admins query their own feedback data using natural language.
- **🔐 Secure Auth**: Better Auth session-based authentication with the Prisma adapter.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, TanStack Router + Query, Zustand, Tailwind v4 + shadcn/ui, Lucide, Sonner, Recharts.
- **Backend**: Node.js 22+, Express 5, Prisma ORM
- **Database**: PostgreSQL 16
- **Auth**: Better Auth (email/password, session cookies, Prisma adapter)
- **Reliability & Background Jobs**:
  - **BullMQ**: Durable job queue for AI insight generation, batch analysis, and other heavy work (prevents request timeouts).
  - **Redis / Upstash**: Shared cache + queue backend and distributed rate limiting (stops AI spam). Local Redis via Docker; production uses Upstash.
- **Integrations**: 
  - **AI**: Google Gemini 2.0 Flash via Vercel AI SDK (`ai` + `@ai-sdk/google`)
  - **Payments**: Stripe (Checkout & Billing Portal) + webhooks + hourly subscription sync
  - **Storage**: S3-compatible object storage (Org Logos)
  - **QR**: QRCode.js
- **Quality**: TypeScript (strict), Zod v4 validation, Vitest, ESLint + Prettier, GitHub Actions CI, Docker Compose (dev + prod)

---

## 🏗️ Technical Deep Dive
For a detailed look at the architecture, database schema, and technical decisions, please check out the **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL 16 + Redis 7 (both spin up in Docker Compose)
- Stripe, Gemini, and S3-compatible storage credentials

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/Endalk-sudo/AI-Feedback-collector-app.git
   cd AI-Feedback-collector-app
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   # Copy .env.example to .env and fill in your keys
   npm run dev
   ```

3. **Setup Client**
   ```bash
   cd ../client
   npm install
   # Copy .env.example to .env
   npm run dev
   ```

---

## 🌍 Deployment
This app is deployed via **Docker Compose**. Two compose files ship: `docker-compose.yml` (local dev, hot reload) and `docker-compose.prod.yml` (nginx + node + postgres prod stack; Prisma migrate auto-runs on start.. See the [Deployment Guide](./deployment.md) and [`UPGRADE_STRATEGY.md`](./UPGRADE_STRATEGY.md) for details.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## ✨ Developed with ❤️ by [Endalk](https://github.com/Endalk-sudo)
*Passionate about building AI-driven solutions that solve real-world problems.*