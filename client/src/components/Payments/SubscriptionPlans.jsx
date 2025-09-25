
import { useState } from 'react';
import { createCheckoutSession } from '../../services/paymentService.js';
import { redirectToCheckout } from '../../services/stripe.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PlansComponent from "./PlansComponent.jsx"
import NavBar from '../../components/NavBar';
import "./SubscriptionPlans.css"

/**
 * SUBSCRIPTION PLANS COMPONENT FUNCTION
 *
 * Renders pricing plans and handles subscription payment initiation.
 * Manages the complete flow from plan selection to Stripe Checkout redirect.
 *
 * @returns {JSX.Element} Subscription plans interface
 */
const SubscriptionPlans = () => {
  // LOADING STATE MANAGEMENT
  // Track which plan is currently being processed to show loading on specific button
  const [loading, setLoading] = useState(null);

  // ERROR STATE
  // Store error messages from payment processing failures
  const [error, setError] = useState('');

  // AUTHENTICATION CONTEXT
  // Access current user data for payment processing
  const { user } = useAuth();



  
  const handleSubscribe = async (priceId, planName) => {
    // AUTHENTICATION VALIDATION
    // Ensure user is logged in before allowing subscription
    if (!user) {
      setError('Please log in to subscribe to a plan');
      return;
    }

    // PRICE ID VALIDATION
    // Ensure plan has valid Stripe price configuration
    if (!priceId) {
      setError('Price ID is missing. Please contact support.');
      return;
    }

    // LOADING STATE ACTIVATION
    // Set loading for specific plan to show processing feedback
    setLoading(planName);
    setError(''); // Clear any previous errors

    try {
      // CHECKOUT SESSION CREATION
      // Call backend API to create Stripe checkout session
      const response = await createCheckoutSession(priceId);

      // RESPONSE VALIDATION
      // Ensure API returned valid session data
      if (!response.data || !response.data.sessionId) {
        throw new Error('Invalid response from server');
      }

      // EXTRACT SESSION ID
      // Get session ID for Stripe redirect
      const { sessionId } = response.data;

      // STRIPE CHECKOUT REDIRECT
      // Redirect user to Stripe's secure payment page
      const result = await redirectToCheckout(sessionId);

      // REDIRECT ERROR HANDLING
      // Handle any errors from Stripe redirect process
      if (result.error) {
        throw new Error(result.error.message);
      }

      // SUCCESS: User redirected to Stripe Checkout
      // Component unmounts as user leaves for payment processing

    } catch (error) {
      // ERROR HANDLING
      // Log error for debugging and show user-friendly message
      console.error('Error in subscription process:', error);
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Error creating checkout session. Please try again.';
      setError(errorMessage);
    } finally {
      // LOADING STATE CLEARANCE
      // Always reset loading state regardless of outcome
      setLoading(null);
    }
  };

  // RENDER SUBSCRIPTION PLANS INTERFACE
  return (
    <>
    <NavBar /> 
    <div className="subscription-plans">
      {/* HEADER SECTION */}
      <h2>Choose Your Plan</h2>
      <p className="plans-subtitle">Select the plan that works best for your business</p>

      {error && <div className="alert-error">{error}</div>}

      {/* PLANS CONTAINER */}
      <div className="plans-container">
          <PlansComponent 
            handleSubscribe={handleSubscribe}
            loading={loading}
          />
      </div>

    </div>
    </>
  );
};

export default SubscriptionPlans;