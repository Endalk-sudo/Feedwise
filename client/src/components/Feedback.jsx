import axios from "axios"
import { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import "./Feedback.css";

const ANALYSIS_STEPS = [
  "Reading feedback...",
  "Analyzing sentiment...",
  "Extracting keywords...",
  "Categorizing...",
  "Finalizing..."
];

const Feedback = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [feedback, setFeedback] = useState('');

  const [logo, setLogo] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [orgError, setOrgError] = useState('');

  const { slug } = useParams();
  const MIN_LEN = 15;


  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoadingOrg(true);
        setOrgError('');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/${slug}`);
        console.log("Organization data from API:", res.data); // <-- Add this line
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

  useEffect(() => {
    let interval;
    if (submitting) {
      interval = setInterval(() => {
        setAnalysisStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(interval);
  }, [submitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const text = feedback.trim();

    try {
      // Minimum loading time to show animation (optional, but good for UX)
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000));

      const request = axios.post(`${import.meta.env.VITE_API_URL}/api/feedback/${slug}`, {
        text
      });

      const [res] = await Promise.all([request, minLoadTime]);

      setIsSubmitted(true);
      toast.success("Feedback submitted successfully!");
      console.log("feedback", res.data);
    } catch (error) {
      console.log("Error submitting Feedback", error.message);
      const msg = error.response?.data?.message || "Failed to submit feedback. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmitting(false);
    setFeedback('');
  };

  const handleRetry = async () => {
    try {
      setLoadingOrg(true);
      setOrgError('');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback/${slug}`);
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
                      : "Looks good. You can submit now."}
                  </p>

                  {submitting && (
                    <div className="feedback-submitting" role="status" aria-label="Submitting feedback">
                      <div className="spinner small"></div>
                      <p>{ANALYSIS_STEPS[analysisStep]}</p>
                    </div>
                  )}


                  <button
                    className="feedback-submit"
                    type="submit"
                    disabled={submitting || feedback.trim().length < MIN_LEN}
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