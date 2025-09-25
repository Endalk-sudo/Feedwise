/**
 * STRIPE SERVICE - Frontend Stripe.js Integration
 *
 * This module handles client-side Stripe integration using Stripe.js.
 * It provides functions for redirecting users to Stripe Checkout and managing
 * the Stripe.js library initialization.
 *
 * Key Concepts:
 * - Stripe.js: Client-side JavaScript library for Stripe integration
 * - Publishable Key: Public key safe to expose in frontend code
 * - Checkout Session: Server-created payment session for secure payments
 * - Redirect Flow: Seamless transition to Stripe's hosted checkout page
 *
 * Security Model:
 * - Publishable keys are safe for frontend use (unlike secret keys)
 * - Payment processing happens on Stripe's secure servers
 * - No sensitive payment data touches your application
 * - PCI compliance handled by Stripe
 *
 * Stripe.js vs Server-side Integration:
 * - Stripe.js: Handles frontend payment UI and tokenization
 * - Server: Creates checkout sessions, processes webhooks, manages subscriptions
 * - This file: Bridges frontend actions to Stripe's hosted checkout
 *
 * Environment Configuration:
 * - VITE_STRIPE_PUBLISHABLE_KEY: Stripe publishable key from dashboard
 * - Must start with 'pk_test_' for test mode or 'pk_live_' for production
 *
 * Integration Flow:
 * 1. User clicks "Subscribe" → Component calls backend API
 * 2. Backend creates checkout session → Returns session ID
 * 3. Frontend calls redirectToCheckout() → User goes to Stripe
 * 4. Payment completes → User redirected back to success/cancel pages
 */
 
import { loadStripe } from '@stripe/stripe-js';

/**
 * STRIPE INSTANCE INITIALIZATION
 *
 * Creates a promise that resolves to a Stripe.js instance.
 * This instance is used for all Stripe operations on the frontend.
 *
 * Initialization Process:
 * 1. loadStripe() called with publishable key
 * 2. Stripe.js library loads asynchronously
 * 3. Promise resolves when ready for use
 *
 * Environment Variable:
 * VITE_STRIPE_PUBLISHABLE_KEY - Your Stripe publishable key
 * Example: pk_test_51ABC...xyz (test mode)
 *
 * Error Handling:
 * - Invalid key: Stripe.js fails to initialize
 * - Network issues: Loading may fail
 * - Components should handle uninitialized state
 */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * REDIRECT TO CHECKOUT FUNCTION
 *
 * Redirects the user to Stripe's hosted checkout page.
 * This creates a seamless payment experience without handling payment forms.
 *
 * Checkout Flow:
 * 1. Function receives sessionId from backend
 * 2. Waits for Stripe.js to initialize
 * 3. Calls stripe.redirectToCheckout() with session ID
 * 4. User is redirected to Stripe's secure checkout page
 * 5. After payment, user returns to success/cancel URLs
 *
 * @param {string} sessionId - Checkout session ID from backend API
 * @returns {Promise<Object>} Stripe redirect result
 * @throws {Error} If sessionId missing or Stripe fails
 *
 * Session ID Source:
 * - Created by backend /api/payments/create-checkout-session
 * - Contains pricing, customer, and redirect URLs
 * - Valid for limited time (typically 24 hours)
 *
 * Error Scenarios:
 * - No sessionId: Validation error before Stripe call
 * - Invalid sessionId: Stripe shows error page
 * - Network issues: Redirect fails gracefully
 */
export const redirectToCheckout = async (sessionId) => {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    // Wait for Stripe.js to load
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: sessionId,
    });

    return result;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};

/**
 * STRIPE INITIALIZATION CHECK FUNCTION
 *
 * Utility function to verify Stripe.js has loaded successfully.
 * Useful for conditional rendering or error states in components.
 *
 * @returns {Promise<boolean>} True if Stripe is ready, false otherwise
 *
 * Usage Examples:
 * - Show loading spinner while Stripe initializes
 * - Disable payment buttons until ready
 * - Display error messages for failed initialization
 *
 * Initialization States:
 * - Pending: Promise not resolved yet
 * - Success: Stripe instance available
 * - Failed: Error during loading (network, invalid key, etc.)
 */
export const isStripeInitialized = async () => {
  try {
    const stripe = await stripePromise;
    return stripe !== null;
  } catch (error) {
    console.error('Error checking Stripe initialization:', error);
    return false;
  }
};

/**
 * DEFAULT EXPORT - Stripe Promise
 *
 * Exports the Stripe promise for advanced usage.
 * Most components should use the helper functions above.
 *
 * Advanced Usage:
 * import stripePromise from '../services/stripe';
 * const stripe = await stripePromise;
 * // Direct Stripe.js API calls
 *
 * @returns {Promise<Stripe|null>} Stripe.js instance promise
 */
export default stripePromise;