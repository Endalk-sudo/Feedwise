# Deployment Guide - AI Feedback Collector App

This guide outlines the steps to deploy your MERN stack application to **Render** (Backend) and **Vercel** (Frontend).

## Prerequisites
- A GitHub account.
- A Render account (linked to GitHub).
- A Vercel account (linked to GitHub).
- API keys for: MongoDB Atlas, Stripe (Test Mode), Gemini AI, and Cloudinary.

---

## 1. Backend Deployment (Render)

1. **Push your code to GitHub**: Ensure all changes (including the updated `.env` keys) are committed and pushed.
2. **Create a New Web Service**:
   - Log in to [Render](https://dashboard.render.com/).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.
3. **Configure Service**:
   - **Name**: `ai-feedback-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Add Environment Variables**:
   In the **Env Vars** tab, add all keys from your `server/.env`:
   - `MONGODB_URI`
   - `JWT_SECRET_ACCESS`
   - `JWT_SECRET_REFRESH`
   - `GEMINI_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLIENT_URL` (Set this to your Vercel URL later)
   - `FRONTEND_URL` (Set this to your Vercel URL later)
   - `NODE_ENV`: `production`

---

## 2. Frontend Deployment (Vercel)

1. **Create a New Project**:
   - Log in to [Vercel](https://vercel.com/dashboard).
   - Click **Add New** > **Project**.
   - Import your GitHub repository.
2. **Configure Project**:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Add Environment Variables**:
   In the **Environment Variables** tab, add:
   - `VITE_API_URL`: Your Render service URL (e.g., `https://ai-feedback-backend.onrender.com`)
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key.

---

## 3. Post-Deployment Steps

1. **Update Backend CORS**:
   Once you have your Vercel URL (e.g., `https://ai-feedback-collector.vercel.app`), go back to Render and update:
   - `CLIENT_URL`
   - `FRONTEND_URL`
2. **Configure Stripe Webhooks**:
   - In your Stripe Dashboard, go to **Developers** > **Webhooks**.
   - Add an endpoint: `https://your-render-url.onrender.com/api/payments/webhook`.
   - Select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
   - Copy the **Signing Secret** and update `STRIPE_WEBHOOK_SECRET` on Render.

---

## 4. Verification
- Visit your Vercel URL.
- Try registering a new user.
- Check if the QR code is generated (Organization Setup).
- Test the feedback submission and AI analysis.
