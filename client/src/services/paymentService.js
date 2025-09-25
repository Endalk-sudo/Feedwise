import api from "./api.js"
/**
 * CREATE CHECKOUT SESSION API FUNCTION
 *
 * Wrapper function for creating Stripe checkout sessions.
 * Initiates the subscription payment flow.
 *
 * API Call: POST /api/payments/create-checkout-session
 *
 * @param {string} priceId - Stripe price ID for the subscription plan
 * @returns {Promise<Object>} Axios response with session data
 * @throws {Error} API error or network failure
 *
 * Response Structure:
 * {
 *   success: true,
 *   sessionId: "cs_test_..."
 * }
 *
 * Error Handling:
 * - Logs API errors for debugging
 * - Re-throws errors for component handling
 * - May trigger 401 redirect via interceptor
 */
export const createCheckoutSession = async (priceId) => {
  try {
    const response = await api.post('/payments/create-checkout-session', { priceId });
    return response;
  } catch (error) {
    console.error('API Error creating checkout session:', error);
    throw error;
  }
};

/**
 * CREATE BILLING PORTAL SESSION API FUNCTION
 *
 * Wrapper function for creating Stripe billing portal sessions.
 * Allows users to manage their subscriptions and billing.
 *
 * API Call: POST /api/payments/create-billing-portal-session
 *
 * @returns {Promise<Object>} Axios response with portal URL
 * @throws {Error} API error or network failure
 *
 * Response Structure:
 * {
 *   success: true,
 *   url: "https://billing.stripe.com/..."
 * }
 *
 * Error Handling:
 * - Logs API errors for debugging
 * - Re-throws errors for component handling
 * - May trigger 401 redirect via interceptor
 */
export const createBillingPortalSession = async () => {
  try {
    const response = await api.post('/payments/create-billing-portal-session');
    return response;
  } catch (error) {
    console.error('API Error creating billing portal session:', error);
    throw error;
  }
};
 
/**
 * DEFAULT EXPORT - Configured Axios Instance
 *
 * Exports the configured Axios instance for direct use.
 * Components can import this for custom API calls.
 *
 * Usage Examples:
 * import api from '../services/api';
 * const response = await api.get('/users/profile');
 * const result = await api.post('/auth/login', credentials);
 *
 * Benefits:
 * - Pre-configured with base URL and interceptors
 * - Automatic authentication header management
 * - Consistent error handling
 * - Centralized API configuration
 */
export default api;