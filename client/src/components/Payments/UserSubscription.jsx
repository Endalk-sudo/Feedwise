/**
 * USER SUBSCRIPTION COMPONENT - Active Subscription Management Interface
 *
 * This component displays and manages active user subscriptions, providing access to
 * Stripe's billing portal for subscription modifications. It demonstrates data presentation,
 * API integration, and user interaction patterns for subscription management.
 *
 * Key Features:
 * - Display current subscription details (plan, status, billing)
 * - Integration with Stripe Billing Portal for management
 * - Status formatting and visual indicators
 * - Date formatting for billing periods
 * - Error handling for portal access failures
 * - Loading states during portal creation
 *
 * Subscription Management Flow:
 * 1. Display current subscription information
 * 2. User clicks "Manage Subscription" button
 * 3. Create billing portal session via API
 * 4. Redirect to Stripe's hosted billing portal
 * 5. User can update payment methods, cancel, or modify subscription
 * 6. Return to application when done
 *
 * React Patterns Demonstrated:
 * - Props-based data passing (subscription object)
 * - useState for local component state management
 * - Async/await for API calls with error handling
 * - Utility functions for data formatting
 * - Conditional rendering based on subscription status
 * - Event handlers for user interactions
 *
 * Data Presentation:
 * - Plan name and current status
 * - Billing period end date
 * - Price and billing interval
 * - Status-based styling and labels
 *
 * Business Logic:
 * - Subscription status determines available actions
 * - Price display converts cents to dollars
 * - Portal access provides self-service management
 * - Error handling maintains user trust
 *
 * Integration Points:
 * - API service: Billing portal session creation
 * - Stripe Billing Portal: Hosted subscription management
 * - Subscription data: Passed as props from parent component
 * - Window object: Direct navigation to portal URL
 *
 * Security Considerations:
 * - Portal URLs are temporary and user-specific
 * - No sensitive billing data displayed in component
 * - API calls require authentication
 * - Error messages don't expose sensitive information
 *
 * User Experience:
 * - Clear subscription information display
 * - Intuitive "Manage Subscription" action
 * - Loading feedback during portal creation
 * - Seamless transition to Stripe's interface
 * - Easy return path to application
 */

import React, { useState } from 'react';
import api from '../../services/api';

/**
 * USER SUBSCRIPTION COMPONENT FUNCTION
 *
 * Displays active subscription details and provides management access.
 * Receives subscription data as props and handles billing portal integration.
 *
 * @param {Object} subscription - Subscription data object from API
 * @param {string} subscription.planId - Plan identifier (basic, pro, enterprise)
 * @param {string} subscription.status - Current subscription status
 * @param {string} subscription.currentPeriodEnd - Billing period end date
 * @param {number} subscription.amount - Price in cents
 * @param {string} subscription.interval - Billing interval (month, year)
 * @returns {JSX.Element} Subscription management interface
 */
const UserSubscription = ({ subscription }) => {
  // LOADING STATE
  // Controls button disabled state during portal creation
  const [loading, setLoading] = useState(false);

  // ERROR STATE
  // Stores error messages from failed portal creation
  const [error, setError] = useState('');

  /**
   * BILLING PORTAL HANDLER
   *
   * Creates a Stripe billing portal session and redirects user to manage subscription.
   * Handles the complete flow from API call to portal redirect.
   *
   * Portal Creation Process:
   * 1. Clear previous errors and set loading state
   * 2. Call API to create billing portal session
   * 3. Redirect browser to portal URL
   * 4. Portal handles all subscription management
   * 5. User returns to application when done
   */
  const handleManageSubscription = async () => {
    setLoading(true); // Show loading state
    setError(''); // Clear previous errors

    try {
      // CREATE BILLING PORTAL SESSION
      // API call to generate secure portal URL
      const res = await api.post('/payments/create-billing-portal-session');

      // REDIRECT TO PORTAL
      // Navigate browser to Stripe's hosted billing portal
      window.location.href = res.data.url;
    } catch (error) {
      // ERROR HANDLING
      // Log error and show user-friendly message
      console.error('Error creating billing portal session:', error);
      setError('Failed to open billing portal. Please try again.');
    } finally {
      // CLEAR LOADING STATE
      // Re-enable button regardless of outcome
      setLoading(false);
    }
  };

  /**
   * DATE FORMATTING UTILITY
   *
   * Converts ISO date string to localized date format for display.
   *
   * @param {string} dateString - ISO date string from subscription data
   * @returns {string} Formatted date string (e.g., "12/25/2023")
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  /**
   * STATUS LABEL UTILITY
   *
   * Converts Stripe status codes to user-friendly labels.
   * Provides consistent status display across the application.
   *
   * @param {string} status - Stripe subscription status code
   * @returns {string} Human-readable status label
   */
  const getStatusLabel = (status) => {
    const statusMap = {
      active: 'Active',
      past_due: 'Past Due',
      canceled: 'Canceled',
      incomplete: 'Incomplete',
      incomplete_expired: 'Incomplete Expired',
      trialing: 'Trialing',
      unpaid: 'Unpaid',
    };
    return statusMap[status] || status; // Fallback to original status if not mapped
  };

  // RENDER SUBSCRIPTION MANAGEMENT INTERFACE
  return (
    <div className="subscription-details">
      {/* SECTION HEADER */}
      <h2>Your Subscription</h2>

      {/* ERROR DISPLAY */}
      {/* Show error messages if portal creation fails */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* SUBSCRIPTION INFORMATION CARD */}
      <div className="subscription-card">
        <div className="subscription-info">
          {/* PLAN NAME */}
          {/* Display current subscription plan */}
          <h3>{subscription.planId}</h3>

          {/* SUBSCRIPTION STATUS */}
          {/* Status with conditional styling based on state */}
          <p>
            <strong>Status:</strong>{" "}
            <span className={`status status-${subscription.status}`}>
              {getStatusLabel(subscription.status)}
            </span>
          </p>

          {/* BILLING PERIOD END */}
          {/* When current billing cycle expires */}
          <p>
            <strong>Current Period End:</strong>{" "}
            {formatDate(subscription.currentPeriodEnd)}
          </p>

          {/* PRICE INFORMATION */}
          {/* Display cost and billing frequency */}
          <p>
            <strong>Price:</strong> ${subscription.amount / 100} / {subscription.interval}
          </p>
        </div>

        {/* MANAGEMENT ACTION BUTTON */}
        {/* Access Stripe Billing Portal for subscription management */}
        <button
          onClick={handleManageSubscription}
          disabled={loading} // Prevent multiple clicks during loading
          className="btn btn-primary"
        >
          {/* CONDITIONAL BUTTON TEXT */}
          {loading ? 'Loading...' : 'Manage Subscription'}
        </button>
      </div>
    </div>
  );
};

export default UserSubscription;