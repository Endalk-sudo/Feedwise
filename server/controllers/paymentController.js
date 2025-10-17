

import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { stripe, getOrCreateCustomer, stripeCreateCheckoutSession, stripeCreateBillingPortalSession, stripeHandleWebhook } from '../utils/stripe.js';

/**
 * CREATE CHECKOUT SESSION ENDPOINT
 *
 * Initiates the subscription payment flow by creating a Stripe checkout session.
 * This generates a secure, Stripe-hosted payment page where users can enter
 * payment information and subscribe to a plan.
 */
export const createCheckoutSession = async (req, res, next) => {
   try {
     // EXTRACT REQUEST DATA
     // Get the priceId from the request body and userId from authenticated request
     const { priceId } = req.body;
     const userId = req.user.id;

    // INPUT VALIDATION - PRICE ID REQUIRED
    // Ensure priceId is provided, as it's essential for subscription creation
    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: 'Price ID is required'
      });
    }

    // USER LOOKUP FROM DATABASE
    // Find the user by their ID to ensure they exist and get their data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // STRIPE CUSTOMER MANAGEMENT
    // Get existing Stripe customer or create new one - prerequisite for checkout
    let customer;
    try {
      customer = await getOrCreateCustomer(user);
    } catch (stripeError) {
      // ERROR HANDLING FOR STRIPE CUSTOMER CREATION
      // Log the error and return appropriate response
      console.error('Error creating/retrieving Stripe customer:', stripeError);
      return res.status(500).json({
        success: false,
        message: 'Error creating customer record'
      });
    }

    // CHECKOUT SESSION CREATION
    // Create the actual Stripe checkout session with customer and price
    let session;
    try {
      session = await stripeCreateCheckoutSession(customer.id, priceId);
      console.log('Checkout session created:', session.id);
    } catch (stripeError) {
      // ERROR HANDLING FOR CHECKOUT SESSION CREATION
      // Log the error and return response with Stripe error message
      console.error('Error creating checkout session:', stripeError);
      return res.status(500).json({
        success: false,
        message: 'Error creating checkout session: ' + stripeError.message
      });
    }
    
    // SUCCESS RESPONSE
    // Return the session ID to frontend for redirecting to Stripe checkout
    res.status(200).json({
      success: true,
      sessionId: session.id
    });
  } catch (error) {
    // UNEXPECTED ERROR HANDLING
    // Catch any unforeseen errors and log them for debugging
    console.error('Unexpected error in createCheckoutSession:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session'
    });
  }
};

/**
 * CREATE BILLING PORTAL SESSION ENDPOINT
 *
 * Creates a secure session for Stripe's hosted customer portal where users can:
 * - Update payment methods
 * - View billing history and invoices
 * - Cancel or upgrade subscriptions
 * - Update billing information
 *
 */
export const createBillingPortalSession = async (req, res, next) => {
   try {
     // EXTRACT USER ID FROM AUTHENTICATED REQUEST
     // Get the user ID that was set by authentication middleware
     const userId = req.user.id;

    // USER LOOKUP FROM DATABASE
    // Retrieve user data to access their Stripe customer ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // VALIDATE STRIPE CUSTOMER EXISTS
    // Ensure the user has a Stripe customer ID before creating portal session
    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'Stripe customer not found' });
    }

    // CREATE BILLING PORTAL SESSION
    // Call utility function to create Stripe billing portal session
    const session = await stripeCreateBillingPortalSession(user.stripeCustomerId);

    // SUCCESS RESPONSE
    // Return the portal URL for frontend to redirect user
    res.status(200).json({ url: session.url });
  } catch (error) {
    // ERROR HANDLING
    // Log errors and return appropriate response
    console.error('Error creating billing portal session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating billing portal session'
    });
  }
};

/**
 * HANDLE WEBHOOK ENDPOINT - STRIPE EVENT PROCESSOR
 *
 * Processes real-time events from Stripe via webhooks. This is the backbone
 * of subscription synchronization between Stripe and our application.
 *
 * Webhook Security:
 * - Verifies Stripe signature to prevent spoofing
 * - Uses raw body parser (configured in server.js)
 * - Processes events idempotently (handles duplicates)
 *
 * Event Processing Flow:
 * 1. Stripe sends HTTP POST with event data
 * 2. Signature verification ensures authenticity
 * 3. Event type determines handler function
 * 4. Database updated to reflect Stripe changes
 * 5. User status synchronized automatically
 *
 * @route POST /api/payments/webhook
 * @access Public (but secured by signature verification)
 * @param {string} stripe-signature - Header containing HMAC signature
 * @param {Buffer} req.body - Raw webhook payload
 * @returns {Object} Acknowledgment response
 *
 * Critical Events Handled:
 * - checkout.session.completed: New subscription activated
 * - invoice.paid: Successful renewal payment
 * - invoice.payment_failed: Payment failure handling
 * - customer.subscription.deleted: Subscription cancellation
 */
export const handleWebhook = async (req, res, next) => {
  try {
    // EXTRACT WEBHOOK DATA
    // Get the Stripe signature from headers and raw payload from body
    const sig = req.headers['stripe-signature'];
    const payload = req.body;

    // WEBHOOK VERIFICATION AND PARSING
    // Verify signature and construct the event object using utility function
    const event = await stripeHandleWebhook(payload, sig);

    // EVENT TYPE ROUTING
    // Switch based on event type to call appropriate handler function
    switch (event.type) {
      case 'checkout.session.completed':
        // CHECKOUT SESSION COMPLETED EVENT
        // Triggered when user successfully completes payment - activate subscription
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      case 'invoice.paid':
        // INVOICE PAID EVENT
        // Successful renewal payment - update subscription status
        const invoice = event.data.object;
        await handleInvoicePaid(invoice);
        break;
      case 'invoice.payment_failed':
        // INVOICE PAYMENT FAILED EVENT
        // Payment failed - mark subscription as past due
        const failedInvoice = event.data.object;
        await handleInvoicePaymentFailed(failedInvoice);
        break;
      case 'customer.subscription.deleted':
        // SUBSCRIPTION DELETED EVENT
        // User canceled subscription - deactivate access
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      default:
        // UNHANDLED EVENT TYPE
        // Log unknown events for monitoring - don't process them
        console.log(`Unhandled event type: ${event.type}`);
    }

    // SUCCESS ACKNOWLEDGMENT
    // Always return 200 to acknowledge receipt and prevent Stripe retries
    res.status(200).json({ received: true });
  } catch (error) {
    // WEBHOOK ERROR HANDLING
    // Log errors but return 400 to indicate processing failure
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * VERIFY CHECKOUT SESSION ENDPOINT
 *
 * Confirms payment completion after user returns from Stripe checkout.
 * Used by frontend to verify successful payment before showing success page.
 *
 * Verification Flow:
 * 1. User completes payment on Stripe checkout
 * 2. Stripe redirects to success URL with session_id
 * 3. Frontend calls this endpoint to verify payment
 * 4. Backend retrieves session from Stripe API
 * 5. Returns payment status and subscription details
 *
 * @route GET /api/payments/verify-session
 * @access Public (verification endpoint)
 * @param {string} session_id - Stripe checkout session ID from URL
 * @returns {Object} Payment verification result
 *
 * Error Handling:
 * - 400: Missing session ID or payment not completed
 * - 500: Stripe API errors during verification
 */
export const verifySession = async (req, res, next) => {
  try {
    // EXTRACT SESSION ID FROM QUERY PARAMETERS
    // Get the session ID from the URL query string
    const { session_id } = req.query;

    // VALIDATE SESSION ID PRESENCE
    // Ensure session_id is provided for verification
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // RETRIEVE SESSION FROM STRIPE API
    // Fetch complete session details from Stripe, including subscription data
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });

    // CHECK PAYMENT STATUS
    // Verify if payment was successful
    if (session.payment_status === 'paid') {
      // PAYMENT SUCCESSFUL RESPONSE
      // Return success with session details for frontend
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          customer: session.customer,
          subscription: session.subscription,
          paymentIntentId: session.payment_intent,
        },
      });
    } else {
      // PAYMENT NOT COMPLETED RESPONSE
      // Return failure status if payment wasn't successful
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        session: {
          id: session.id,
          payment_status: session.payment_status,
        },
      });
    }
  } catch (error) {
    // ERROR HANDLING
    // Log errors and return server error response
    console.error('Error verifying session:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying session',
    });
  }
};

/**
 * Handle checkout.session.completed event
 * @param {Object} session - Stripe session object
 */
const handleCheckoutSessionCompleted = async (session) => {
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!subscriptionId) {
    console.log('Checkout session has no subscription ID yet, skipping');
    return;
  }

  // Find user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  try {
    // Get subscription details from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    if (!stripeSub || !stripeSub.items || !stripeSub.items.data || stripeSub.items.data.length === 0) {
      console.error('Invalid subscription data from Stripe');
      return;
    }

    const priceId = stripeSub.items.data[0].price.id;
    const amount = stripeSub.items.data[0].price.unit_amount;
    const currency = stripeSub.items.data[0].price.currency;
    const interval = stripeSub.items.data[0].price.recurring.interval;

    // Safely handle currentPeriodEnd
    let currentPeriodEnd;
    if (stripeSub.current_period_end) {
      currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
      if (isNaN(currentPeriodEnd.getTime())) {
        console.error('Invalid currentPeriodEnd:', stripeSub.current_period_end);
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      console.warn('current_period_end not provided in subscription, using default');
      currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Determine plan based on priceId
    let currentPlan;
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      currentPlan = 'pro';
    } else if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
      currentPlan = 'basic';
    } else {
      console.error('Unknown priceId:', priceId);
      currentPlan = 'basic'; // Fallback, or handle differently
    }
 
    // Create or update subscription in database
    let subscription = await Subscription.findOne({ userId: user._id });
    if (subscription) {
      subscription.planId = currentPlan;
      subscription.priceId = priceId;
      subscription.status = 'active';
      subscription.currentPeriodEnd = currentPeriodEnd;
      subscription.stripeSubscriptionId = subscriptionId;
      subscription.amount = amount;
      subscription.currency = currency;
      subscription.interval = interval;
      subscription.stripeCustomerId = customerId;
    } else {
      subscription = new Subscription({
        userId: user._id,
        planId: currentPlan,
        priceId,
        status: 'active',
        currentPeriodEnd,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        amount,
        currency,
        interval
      });
    }

    await subscription.save();

    // Update user's subscription status and current plan
    user.subscriptionStatus = 'active';
    user.currentPlan = currentPlan;
    await user.save();

    console.log(`Subscription created for user: ${user._id}`);
  } catch (error) {
    console.error('Error processing checkout.session.completed:', error);
  }
};

/**
 * Handle invoice.paid event
 * @param {Object} invoice - Stripe invoice object
 */
const handleInvoicePaid = async (invoice) => {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log('Invoice has no subscription ID, skipping');
    return;
  }

  // Find user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  try {
    // Get subscription details from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    // Safely handle currentPeriodEnd
    let currentPeriodEnd;
    if (stripeSub.current_period_end) {
      currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
      if (isNaN(currentPeriodEnd.getTime())) {
        console.error('Invalid currentPeriodEnd:', stripeSub.current_period_end);
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      console.warn('current_period_end not provided in subscription, using default');
      currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const priceId = stripeSub.items.data[0].price.id;

    // Determine plan based on priceId
    let currentPlan;
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
      currentPlan = 'pro';
    } else if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
      currentPlan = 'basic';
    } else {
      console.error('Unknown priceId:', priceId);
      currentPlan = 'basic'; // Fallback, or handle differently
    }
 
    // Update subscription in database
    const subscription = await Subscription.findOne({ userId: user._id });
    if (subscription) {
      subscription.status = 'active';
      subscription.currentPeriodEnd = currentPeriodEnd;
      await subscription.save();
    }

    // Update user's subscription status and current plan
    user.subscriptionStatus = 'active';
    user.currentPlan = currentPlan;
    await user.save();

    console.log(`Invoice paid for user: ${user._id}`);
  } catch (error) {
    console.error('Error processing invoice.paid:', error);
  }
};

/**
 * Handle invoice.payment_failed event
 * @param {Object} invoice - Stripe invoice object
 */
const handleInvoicePaymentFailed = async (invoice) => {
  const customerId = invoice.customer;

  // Find user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status in database
  const subscription = await Subscription.findOne({ userId: user._id });
  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();
  }

  // Update user's subscription status
  user.subscriptionStatus = 'past_due';
  await user.save();

  console.log(`Payment failed for user: ${user._id}`);
};

/**
 * Handle customer.subscription.deleted event
 * @param {Object} subscription - Stripe subscription object
 */
const handleSubscriptionDeleted = async (subscription) => {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  // Find user by Stripe customer ID
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status in database
  const dbSubscription = await Subscription.findOne({
    userId: user._id,
    stripeSubscriptionId: subscriptionId
  });

  if (dbSubscription) {
    dbSubscription.status = 'canceled';
    await dbSubscription.save();
  }

  // Update user's subscription status
  user.subscriptionStatus = 'inactive';
  user.currentPlan = null;
  await user.save();

  console.log(`Subscription canceled for user: ${user._id}`);
};