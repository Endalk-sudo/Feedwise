# 🚀 AI Feedback Collector (SaaS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/frontend-React-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/database-MongoDB-green)](https://www.mongodb.com/)

**AI Feedback Collector** is a full-stack SaaS platform designed to help businesses turn customer feedback into actionable insights instantly. Using QR codes for collection and Gemini AI for analysis, it categorizes, sentiments, and provides growth recommendations in real-time.

---

## 📖 Project Overview
The goal of this project is to simplify the feedback loop for small to medium businesses. Customers scan a QR code, leave their thoughts, and the AI handles the rest—categorizing the input, detecting sentiment, and alerting owners to urgent issues.

### 💡 Key Features
- **🤖 Smart AI Analysis**: Powered by Gemini 2.0, providing sentiment detection, priority scoring, and keyword extraction.
- **💳 SaaS-Ready**: Integrated Stripe payments for Basic and Pro subscription tiers.
- **📊 Interactive Dashboard**: Professional analytics using modern charting for sentiment trends and category breakthroughs.
- **📱 QR Collection**: Unique, organization-specific landing pages and QR codes for easy physical-to-digital feedback.
- **💬 Admin AI Chat**: An intelligent assistant to help admins query their own feedback data using natural language.
- **🔐 Secure Auth**: Robust JWT-based authentication with refresh token logic.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Context API, Lucide Icons, Framer Motion, Sonner.
- **Backend**: Node.js, Express.js, Mongoose.
- **Database**: MongoDB (Atlas).
- **Integrations**: 
  - **AI**: Google Gemini (2.0 Flash).
  - **Payments**: Stripe (Checkout & Billing Portal).
  - **Storage**: Cloudinary (Org Logos).
  - **QR**: QRCode.js.

---

## 🏗️ Technical Deep Dive
For a detailed look at the architecture, database schema, and technical decisions, please check out the **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Stripe, Gemini, and Cloudinary API keys

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
This app is ready for deployment on **Render** (Backend) and **Vercel** (Frontend). See the [Deployment Guide](./deployment.md) for full instructions.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## ✨ Developed with ❤️ by [Endalk](https://github.com/Endalk-sudo)
*Passionate about building AI-driven solutions that solve real-world problems.*