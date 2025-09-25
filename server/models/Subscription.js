/**
 * SUBSCRIPTION MODEL - Stripe Subscription Data Store
 *
 * This model tracks user subscriptions and payment details in MongoDB.
 * It serves as a local cache/mirror of Stripe subscription data for faster queries
 * and to maintain subscription history even if Stripe data becomes unavailable.
 *
 * Key Features:
 * - Links users to their Stripe subscriptions
 * - Tracks subscription lifecycle (active, canceled, past_due, etc.)
 * - Stores pricing information for historical reference
 * - Enables fast queries by user, subscription ID, or customer ID
 *
 * Why Store Locally:
 * - Faster than API calls to Stripe for common queries
 * - Maintains data integrity if Stripe is temporarily unavailable
 * - Enables complex queries and aggregations
 * - Keeps historical subscription data for analytics
 *
 * Synchronization:
 * - Updated via Stripe webhooks (checkout.session.completed, invoice.paid, etc.)
 * - Should mirror Stripe's subscription states accurately
 * - Webhook events ensure real-time synchronization
 *
 * Database Design:
 * - References User model for relational integrity
 * - Multiple indexes for optimal query performance
 * - Timestamps for audit trails and data freshness
 */

import mongoose from 'mongoose';

/**
 * SUBSCRIPTION SCHEMA DEFINITION
 *
 * Defines the structure for subscription documents in MongoDB.
 * Mirrors key Stripe subscription data while adding local optimizations.
 *
 * Schema Relationships:
 * - userId: References the User model (one-to-many relationship)
 * - stripeSubscriptionId: Unique identifier from Stripe
 * - stripeCustomerId: Links to Stripe customer record
 */
const subscriptionSchema = new mongoose.Schema({
  // USER RELATIONSHIP
  // Links this subscription to a specific user in our database
  userId: {
    type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId reference
    ref: 'User', // References the User model for population
    required: true, // Every subscription must belong to a user
  },

  // PLAN IDENTIFICATION
  // Internal plan identifier (basic, pro, enterprise)
  planId: {
    type: String,
    required: true, // Must know which plan user subscribed to
  },

  // SUBSCRIPTION STATUS
  // Mirrors Stripe's subscription status for easy querying
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
    default: 'incomplete', // Initial state before payment completes
  },

  // BILLING CYCLE END DATE
  // When the current billing period expires
  currentPeriodEnd: {
    type: Date,
    required: true, // Critical for billing logic and renewals
  },

  // STRIPE IDENTIFIERS
  // Direct links to Stripe objects for API operations
  stripeSubscriptionId: {
    type: String, // Stripe subscription ID (sub_xxx)
    required: true,
    unique: true, // Ensures no duplicate subscriptions
  },
  stripeCustomerId: {
    type: String, // Stripe customer ID (cus_xxx)
    required: true, // Links to customer's payment methods
  },

  // CANCELLATION TRACKING
  // Whether subscription will cancel at period end
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false, // Most subscriptions are ongoing
  },

  // PRICING INFORMATION CACHE
  // Store pricing details locally for historical reference
  // Useful if Stripe pricing changes or for reporting
  priceId: {
    type: String, // Stripe price ID (price_xxx)
    required: true,
  },
  amount: {
    type: Number, // Price in cents (Stripe convention)
    required: true,
  },
  currency: {
    type: String,
    default: 'usd', // Default to US dollars
  },
  interval: {
    type: String, // Billing frequency
    enum: ['day', 'week', 'month', 'year'], // Stripe's valid intervals
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

/**
 * DATABASE INDEXES
 *
 * Optimized indexes for common query patterns.
 * These indexes significantly improve query performance for subscription lookups.
 *
 * Index Strategy:
 * - userId: Find all subscriptions for a user (most common)
 * - stripeSubscriptionId: Lookup by Stripe ID (webhook processing)
 * - stripeCustomerId: Find subscriptions by Stripe customer
 */
subscriptionSchema.index({ userId: 1 }); // Ascending index on userId
subscriptionSchema.index({ stripeSubscriptionId: 1 }); // Unique lookups by Stripe sub ID
subscriptionSchema.index({ stripeCustomerId: 1 }); // Customer-based queries

/**
 * MODEL EXPORT
 *
 * Creates and exports the Subscription model.
 * Provides methods for CRUD operations on subscription data.
 *
 * Model Usage:
 * - Subscription.find({ userId: user._id }) - Get user's subscriptions
 * - Subscription.findOne({ stripeSubscriptionId: 'sub_xxx' }) - Find by Stripe ID
 * - Subscription.create({ ... }) - Create new subscription record
 */
export default mongoose.model('Subscription', subscriptionSchema);