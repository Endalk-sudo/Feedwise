/**
 * PAYMENT SUCCESS COMPONENT - Post-Payment Verification and Confirmation
 *
 * This component handles the critical post-payment flow after users return from Stripe Checkout.
 * It demonstrates advanced React patterns including URL parameter parsing, automatic API calls,
 * conditional rendering based on payment status, and programmatic navigation.
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './PaymentSuccess.css';

/**
 * PAYMENT SUCCESS COMPONENT FUNCTION
 *
 * Handles post-payment verification and user feedback after Stripe Checkout.
 * Automatically verifies payment status and provides appropriate user interface.
 *
 * @returns {JSX.Element} Payment status interface with verification results
 */
const PaymentSuccess = () => {
  // STATUS MESSAGE STATE
  // Dynamic message that updates based on verification progress and results
  const [message, setMessage] = useState('Verifying your payment...');

  // LOADING STATE
  // Controls display of loading indicators during verification
  const [loading, setLoading] = useState(true);

  // ROUTER HOOKS
  // Access current location for URL parameters and navigation function
  const location = useLocation();
  const navigate = useNavigate();

  // AUTHENTICATION CONTEXT
  // Access current user data (may be needed for verification)
  const { user } = useAuth();

  // SESSION ID EXTRACTION
  // Parse session_id from URL query parameters
  // This ID comes from Stripe Checkout redirect
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');

  /**
   * PAYMENT VERIFICATION EFFECT
   *
   * Automatically verifies payment status when component mounts.
   * Handles the complete verification flow with appropriate user feedback.
   *
   * Verification Process:
   * 1. Check for session_id in URL parameters
   * 2. Call backend verification API with session ID
   * 3. Update message based on verification result
   * 4. Set up automatic redirect on success
   * 5. Handle errors with user-friendly messaging
   * 6. Clear loading state when complete
   */
  useEffect(() => {
    const verifyPayment = async () => {
      // SESSION ID VALIDATION
      // Ensure session_id exists in URL parameters
      if (!sessionId) {
        setMessage('No session ID found. Please contact support if you were charged.');
        setLoading(false);
        return;
      }

      try {
        // PAYMENT VERIFICATION API CALL
        // Call backend to verify payment status with Stripe
        const response = await api.get(`/payments/verify-session?session_id=${sessionId}`);

        if (response.data.success) {
          // SUCCESSFUL VERIFICATION
          // Update message and set up automatic redirect
          setMessage('Payment successful! Your subscription is now active. Redirecting to dashboard...');

          // AUTOMATIC REDIRECT
          // Give user time to read success message before redirecting
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000); // 3 second delay for user to see success message
        } else {
          // VERIFICATION FAILURE
          // Payment was not completed successfully
          setMessage('Payment verification failed. Please contact support with your session ID.');
        }
      } catch (error) {
        // ERROR HANDLING
        // Handle API errors, network issues, or verification failures
        console.error('Error verifying payment:', error);
        setMessage(
          error.response?.data?.message ||
          'Error verifying payment. Please contact support with your session ID.'
        );
      } finally {
        // CLEAR LOADING STATE
        // Always hide loading indicator regardless of outcome
        setLoading(false);
      }
    };

    // INITIATE VERIFICATION
    // Start verification process when component mounts
    verifyPayment();
  }, [sessionId, navigate, user]); // Dependencies for useEffect

  // RENDER PAYMENT STATUS INTERFACE
  return (
    <div className="payment-status">
      <div className="payment-status-card">
        {/* SUCCESS ICON */}
        {/* Visual indicator of payment status using SVG icon */}
        <div className="payment-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
        </div>

        {/* STATUS HEADER */}
        <h2>Payment Status</h2>

        {/* DYNAMIC STATUS MESSAGE */}
        {/* Shows current verification status or result */}
        <p>{message}</p>

        {/* LOADING INDICATOR */}
        {/* Display during verification process */}
        {loading && <div className="loading-spinner">Verifying...</div>}

        {/* NAVIGATION ACTIONS */}
        {/* Provide manual navigation options for user control */}
        <div className="payment-actions">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Back to Home
          </button>
        </div>

        {/* SESSION ID REFERENCE */}
        {/* Display session ID for customer support and troubleshooting */}
        {sessionId && (
          <div className="session-info">
            <p>Reference ID: {sessionId}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;