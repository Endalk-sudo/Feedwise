import axios from "axios"
import { useState ,useEffect } from "react";
import { useParams } from 'react-router-dom';
import Rating from "./Rating";
import "./Feedback.css";

const Feedback = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [selectedRating, setSelectedRating] = useState(0);

    const [logo, setLogo] = useState(null);
    const [orgName, setOrgName] = useState('');
    const [loadingOrg, setLoadingOrg] = useState(true);
    const [orgError, setOrgError] = useState('');
  
    const {slug} = useParams();
    const MIN_LEN = 15;


    useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoadingOrg(true);
        setOrgError('');
        const res = await axios.get(`http://localhost:5000/api/feedback/${slug}`);
        setOrgName(res.data.orgName);
        setLogo(res.data.orgLogo);
      } catch (err) {
        console.error("Error fetching organization:", err);
        const errorMessage = err.response?.data?.message || 
                           err.response?.status === 404 ? 
                           "Organization not found. Please check the URL." :
                           "Failed to load organization information. Please try again.";
        setOrgError(errorMessage);
      } finally {
        setLoadingOrg(false);
      }
    };

    if (slug) {
      fetchOrg();
    }
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const text = feedback.trim();

    try {
      const res = await axios.post(`http://localhost:5000/api/feedback/${slug}`, {
        text,
        rating: selectedRating
      });
      
      setIsSubmitted(true);
      console.log("feedback", res.data);
    } catch (error) {
      console.log("Error submitting Feedback", error.message);
      setError(error.response?.data?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmitting(false);
    setFeedback('');
    setSelectedRating(0);
  };

  const handleRetry = async () => {
    try {
      setLoadingOrg(true);
      setOrgError('');
      const res = await axios.get(`http://localhost:5000/api/feedback/${slug}`);
      setOrgName(res.data.orgName);
      setLogo(res.data.orgLogo);
    } catch (err) {
      console.error("Error fetching organization:", err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.status === 404 ? 
                         "Organization not found. Please check the URL." :
                         "Failed to load organization information. Please try again.";
      setOrgError(errorMessage);
    } finally {
      setLoadingOrg(false);
    }
  };

  return (
    <section className="feedback-page" aria-live="polite">
      {isSubmitted ? (
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
        <section className="feedback-container ">
          {loadingOrg ? (
            <div className="feedback-loading" role="status" aria-label="Loading organization information">
              <div className="spinner"></div>
              <p>Loading organization information...</p>
            </div>
          ) : orgError ? (
            <div className="feedback-error-container">
              <h2>Error Loading Organization</h2>
              <p className="feedback-error">{orgError}</p>
              <button 
                className="feedback-back-btn" 
                onClick={handleRetry}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <header className="feedback-header">
                <div className="org-card">
                  <div className="org-logo">
                    <img src={logo} alt="organization logo" />
                  </div>
                  <h1>{orgName}</h1>
                </div>

                <h2 id="feedback-title" className="feedback-title">Share Your Experience</h2>
                <p className="feedback-subtitle">Your anonymous feedback helps us improve.</p>
              </header>

              <article className="feedback-card" aria-labelledby="feedback-title">
                <Rating 
                  selectedRating={selectedRating} 
                  setSelectedRating={setSelectedRating} 
                />
                
                <form onSubmit={handleSubmit} className="feedback-form" noValidate>
                  <label htmlFor="feedback-input" className="feedback-label">Share your thoughts</label>

                  <textarea
                    className="feedback-textarea"
                    name="feedback"
                    id="feedback-input"
                    placeholder="Tell us about your experience - what did you enjoy, what could we improve, or any suggestions you have..."
                    required
                    minLength={MIN_LEN}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    aria-invalid={feedback.length > 0 && feedback.length < MIN_LEN}
                    aria-describedby="feedback-helper"
                    disabled={submitting}
                  />

                  <p id="feedback-helper" className="feedback-helper">
                    {feedback.length < MIN_LEN
                      ? `Please enter at least ${MIN_LEN} characters.`
                      : "Looks good. You can submit now." }
                  </p>

                  {submitting && (
                    <div className="feedback-submitting" role="status" aria-label="Submitting feedback">
                      <div className="spinner small"></div>
                      <p>Analyzing your feedback...</p>
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="feedback-error">
                      {error}
                    </p>
                  )}

                  <button
                    className="feedback-submit"
                    type="submit"
                    disabled={submitting || feedback.trim().length < MIN_LEN || selectedRating === 0}
                    aria-busy={submitting}
                  >
                    {submitting ? "Analyzing & Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              </article>
            </>
          )}
        </section>
      )}
    </section>
  );
};

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