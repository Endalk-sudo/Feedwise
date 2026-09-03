

import express from'express';
const router = express.Router();
// import { body } from 'express-validator';
import {createCheckoutSession,createBillingPortalSession,verifySession} from '../controllers/paymentController.js';
import {verifyToken} from'../middleware/auth.js';

/**
 * GLOBAL AUTHENTICATION MIDDLEWARE
 *
 * Applies authentication requirement to all payment routes.
 * All payment operations require a valid, authenticated user.
 */
router.use(verifyToken);

/**
 * CREATE CHECKOUT SESSION ROUTE
 *
 * Initiates the subscription payment flow by creating a Stripe checkout session.
 * Generates a secure payment page where users can enter card details.
 */
router.post('/create-checkout-session', createCheckoutSession);

/**
 * CREATE BILLING PORTAL SESSION ROUTE
 *
 * Creates a session for Stripe's hosted customer portal.
 * Allows users to manage subscriptions, payment methods, and billing.
 */
router.post('/create-billing-portal-session', createBillingPortalSession);

/**
 * VERIFY CHECKOUT SESSION ROUTE
 *
 * Confirms payment completion after user returns from Stripe checkout.
 * Used by frontend to verify successful payments and update UI.
 */
router.get('/verify-session', verifySession);

export default router;