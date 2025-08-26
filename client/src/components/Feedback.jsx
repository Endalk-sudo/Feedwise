import axios from "axios"
import { useState } from "react";
import { useParams } from 'react-router-dom';
// Import component-scoped, mobile-first stylesheet
import "./Feedback.css";

/**
 * Feedback component
 * - Mobile-first UI optimized for small screens
 * - Semantic markup (section/article/header) for better structure and accessibility
 * - Client-side validation with helpful messages
 * - Async submit state handling and basic error reporting
 */ 
const Feedback = () => {
    // Component State
    const [isSubmited, setIsSubmited] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
  
    const {slug} = useParams();

    
    const MIN_LEN = 15; // Minimum characters for feedback text

  /**
   * Handles the form submission.
   * - Uses the Form Actions pattern (form action={handleSubmit}) supported by React Router / modern React
   * - Progressive enhancement: reads from FormData but falls back to local state
   */
  const handleSubmit = async (formData) => {
    setError("");
    setSubmitting(true);

    // Prefer the form's POSTed value; fallback to controlled state for robustness
    const text = formData.get('feedback') ?? feedback;
    text.trim();

    const submitFeedback = async()=>{
      try {
        const res = await axios.post(`http://localhost:5000/api/feedback/${slug}`,{text})
        
        setIsSubmited(true)
        // Return the server's response (usually includes success message and feedback ID)
        console.log("feedback", res.data);
      } catch (error) {
         // If anything goes wrong (network error, server down, etc.)
        console.log("Error submitting Feedback", error.message);
        setError(error.message)
      }
    }

   submitFeedback();
};

  const handleReset = () => {
    setIsSubmited(false);
    setSubmitting(false);
    setFeedback(''); // Reset feedback text
  };

  return (
    // aria-live polite announces success to assistive tech without being disruptive
    <section className="feedback-page" aria-live="polite">
      {isSubmited ? (
        // Success state: visually distinct card with short thank-you copy
        <div className="feedback-success" role="status" aria-label="Feedback submitted">
          <SuccessIcon />
          <h2 className="feedback-success-title">Thank you for your feedback</h2>
          <p className="feedback-success-msg">
            We appreciate your time. Your input helps us improve the experience.
          </p>
          <button
          className="feedback-back-btn"
          onClick={handleReset}>Go Back</button>
        </div>
      ) : (
        // Form card with clear hierarchy and spacing; optimized for mobile-first
        <article className="feedback-card" aria-labelledby="feedback-title">
          <header className="feedback-header">
            <h1 id="feedback-title" className="feedback-title">Share Your Experience</h1>
            <p className="feedback-subtitle">Your anonymous feedback helps us improve.</p>
          </header>

          {/* Use the action handler for submission; noValidate defers validation to our logic */}
          <form action={handleSubmit} className="feedback-form" noValidate>
            <label htmlFor="feedback-input" className="feedback-label">Share your thoughts</label>

            {/* Controlled textarea provides instant validation feedback and better UX on mobile */}
            <textarea
              className="feedback-textarea"
              name="feedback"
              id="feedback-input"
              placeholder="Tell us about your experience - what did you enjoy, what could we improve, or any suggestions you have..."
              required
              minLength={MIN_LEN}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              // Mark invalid as user types if under minimum length
              aria-invalid={feedback.length > 0 && feedback.length < MIN_LEN}
              aria-describedby="feedback-helper"
              disabled={submitting}
            />

            {/* Helper text communicates validation rules and current state */}
            <p id="feedback-helper" className="feedback-helper">
              {feedback.length < MIN_LEN
                ? `Please enter at least ${MIN_LEN} characters.`
                : "Looks good. You can submit now."}
            </p>

            {/* Error message region announced to screen readers */}
            {error && (
              <p role="alert" className="feedback-helper" style={{ color: "var(--color-error)" }}>
                {error}
              </p>
            )}

            {/* Disable submit while submitting or if below minimum characters */}
            <button
              className="feedback-submit"
              type="submit"
              disabled={submitting || feedback.trim().length < MIN_LEN}
              aria-busy={submitting}
            >
              {submitting ? " Submitting..." : "Submit Feedback"}
            </button>
          </form>
        </article>
      )}
    </section>
  );
};


/**
 * SuccessIcon component
 * - Displays a checkmark icon in the success state
 */
const SuccessIcon = () => (
  <svg
    className="feedback-success-icon"
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Feedback;