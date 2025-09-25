import { Link } from 'react-router-dom';
import "./PaymentCanceled.css"

/**
 * PAYMENT CANCELED COMPONENT FUNCTION
 *
 * Displays cancellation confirmation and provides navigation options.
 * Enhanced component with improved messaging, animations, and user experience.
 *
 * @returns {JSX.Element} Payment cancellation status interface
 */
const PaymentCanceled = () => {
  return (
    <div className="payment-status">
      <div className="payment-status-card">
        <div className="icon-container">
          <WarnIcon />
        </div>
        <h2>Payment Failed</h2>

        <p>We're sorry, but your subscription payment couldn't be processed at this time.</p>
        <p>No charges were made to your account. Please check your payment details and try again, or contact support if the issue persists.</p>

        <div className="payment-actions">
          <button className='btn payment-retry-btn' aria-label="Retry subscription payment">
            Retry Payment
          </button>
          <Link to="/" className="btn btn-primary" aria-label="Return to home page">
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;

const WarnIcon = ()=>{
  return(
    <svg class="warn-pulse" role="img" aria-label="Warning" viewBox="0 0 24 24" width="64" height="64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4.5c-.6 0-1.2.35-1.5.9L3.4 18.3c-.62 1.13.1 2.7 1.5 2.7h14.2c1.4 0 2.12-1.57 1.5-2.7L13.5 5.4c-.3-.55-.9-.9-1.5-.9z"/>
      <line x1="12" y1="9" x2="12" y2="14" />
      <circle cx="12" cy="17.5" r="0.7" fill="currentColor" stroke="none"></circle>
    </svg>
  )
}