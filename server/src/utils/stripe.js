/**
 * STRIPE UTILITIES - Core Stripe Integration Module
 *
 * This file contains all direct interactions with the Stripe API for our SaaS application.
 * It handles customer creation, checkout sessions, billing portal, and webhook verification.
 *
 * Key Concepts:
 * - Stripe Customer: Represents a user in Stripe's system, stores payment methods
 * - Checkout Session: Stripe-hosted payment page for subscriptions
 * - Billing Portal: Customer-facing page to manage subscriptions and billing
 * - Webhooks: Real-time notifications from Stripe about payment events
 *
 * Security Notes:
 * - Never expose secret keys to frontend
 * - Always verify webhook signatures to prevent spoofing
 * - Use test keys for development, live keys for production
 */

import Stripe from 'stripe';
import User from '../models/User.js';

// Initialize Stripe with secret key from environment variables
// This creates our Stripe client instance for all API calls
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * CREATE STRIPE CUSTOMER
 *
 * Creates a new customer in Stripe's system. Every user who will make payments
 * needs a corresponding Stripe customer record.
 */
const createCustomer = async (user) => {
  try {
    console.log('Creating Stripe customer for user:', user._id);

    // Create customer in Stripe with essential information
    const customer = await stripe.customers.create({
      email: user.email, // Required for receipts and customer portal
      name: `${user.firstName} ${user.lastName}`, // Display name in Stripe dashboard
      metadata: {
        userId: user._id.toString() // CRITICAL: Links Stripe customer to our user
      }
    });

    console.log('Stripe customer created successfully:', customer.id);
    return customer; // Returns full customer object including Stripe ID
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error; // Re-throw to let caller handle the error
  }
};

/**
 * CREATE CHECKOUT SESSION FOR SUBSCRIPTION
 *
 * This is the core function that initiates the payment flow. It creates a Stripe-hosted
 * checkout page where users can enter payment information and subscribe to a plan.
 *
 *
 * Security: Only authenticated users can create sessions, customer ID validated
 */
const stripeCreateCheckoutSession = async (customerId, priceId) => {
  try {
    console.log('Creating checkout session for customer:', customerId, 'with priceId:', priceId);

    // Input validation - prevent API abuse
    if (!customerId || !priceId) {
      throw new Error('Customer ID and Price ID are required');
    }

    // Sanity check - ensure Stripe is properly configured
    if (!stripe) {
      throw new Error('Stripe is not properly initialized');
    }

    // Create the checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Link to existing customer (no duplicate creation)
      payment_method_types: ['card'], // Accept credit/debit cards
      line_items: [
        {
          price: priceId, // The specific price/plan being purchased
          quantity: 1, // Most SaaS subscriptions are for 1 user/license
        },
      ],
      mode: 'subscription', // Creates recurring billing, not one-time payment
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-canceled`,
    });

    console.log('Checkout session created successfully');
    return session; // Contains session.id and session.url for frontend redirect
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error; // Let controller handle error response
  }
};

/**
 * CREATE BILLING PORTAL SESSION
 *
 * Creates a session for Stripe's hosted customer portal where users can:
 * - Update payment methods
 * - View billing history and invoices
 * - Cancel or upgrade subscriptions
 * - Update billing information
 */
const stripeCreateBillingPortalSession = async (customerId) => {
  try {
    console.log('Creating billing portal session for customer:', customerId);

    // Create portal session - Stripe generates secure, time-limited URL
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId, // Which customer's data to show
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`, // Where to redirect after portal actions
    });

    console.log('Billing portal session created successfully');
    return session; // Contains session.url for frontend redirect
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error; // Common error: Portal not configured in Stripe dashboard
  }
};

/**
 * HANDLE STRIPE WEBHOOK EVENTS
 *
 * Webhooks are HTTP POST requests sent by Stripe to notify our app of events.
 * CRITICAL SECURITY: We must verify the request signature to ensure it's from Stripe.
 *
 * 
 */
const stripeHandleWebhook = async (payload, sig) => {
  try {
    console.log('Handling webhook event');

    // CRITICAL: Verify webhook signature - this is our security gate
    const event = stripe.webhooks.constructEvent(
      payload, // Raw request body
      sig, // Signature from headers
      process.env.STRIPE_WEBHOOK_SECRET // Our webhook secret
    );

    console.log('Webhook event verified:', event.type);
    return event; // Safe to process - verified as from Stripe
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    throw err; // Don't process unverified events
  }
};

/**
 * GET OR CREATE STRIPE CUSTOMER
 *
 * Ensures every user has a corresponding Stripe customer record.
 * This is called before any payment operations to establish the link.
 */
const getOrCreateCustomer = async (user) => {
  try {
    console.log('Getting or creating customer for user:', user._id);

    // Check if user already has a Stripe customer linked
    if (user.stripeCustomerId) {
      console.log('User already has Stripe customer ID:', user.stripeCustomerId);

      try {
        // Verify the customer still exists in Stripe
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        console.log('Retrieved existing customer');
        return customer; // Return existing customer
      } catch (retrieveError) {
        // Customer was deleted or doesn't exist, create new one
        console.error('Error retrieving customer, creating new one:', retrieveError);
        // Fall through to create new customer
      }
    }

    // Create new Stripe customer for this user
    console.log('Creating new Stripe customer');
    const customer = await createCustomer(user);
    console.log('Created new customer with ID:', customer.id);

    // CRITICAL: Update our database with the Stripe customer ID
    await User.findByIdAndUpdate(user._id, {
      stripeCustomerId: customer.id,
    });
    console.log('Updated user with Stripe customer ID');

    return customer; // Return the new customer
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error; // Payment flow cannot continue without customer
  }
};


export {
  stripe, // Direct Stripe client - use with caution
  createCustomer,
  stripeCreateCheckoutSession,
  stripeCreateBillingPortalSession,
  stripeHandleWebhook,
  getOrCreateCustomer
};