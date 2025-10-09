import api from "../services/api.js";
import { useState, useEffect } from "react";
import "./MainContent.css";
import FeedbackCard from "./FeedbackCard";
import { formatTimeAgo, sortFeedbackByTime } from "../utils/timeUtils";

function MainContent() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [feedbackLink, setFeedbackLink] = useState('http://localhost:5173/feedback');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const copyLink = () => {
    navigator.clipboard.writeText(feedbackLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }; 

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'feedback-qr-code.png';
    link.click();
  };

  const totalFeedbacks = feedbacks.length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/user/dashboard`);
        
        const data = response.data;
        console.log("data =>", data);
        
        setQrCode(data.org.qrDataUrl);
        setFeedbackLink(data.org.content);
        const sortedFeedbacks = sortFeedbackByTime(data.feedbacks);
        setFeedbacks(sortedFeedbacks);
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    };
    
    fetchData();
  }, []);

  return (
    <main className="main-dashboard-content">
      <div className="dashboard-title-section dashboard-card">
        <h1 className="dashboard-title">Dashboard</h1>
      </div>

      <div className="qr-share-section dashboard-card">
        <div className="qr-info">
          <h2 className="qr-title">Share your feedback link</h2>
          <p>Scan this QR code or share the link with your customers to collect feedback.</p>
          <div className="button-group">
            <button className="action-button primary-button" onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button className="action-button secondary-button" onClick={downloadQR}>
              Download QR
            </button>
          </div>
        </div>

        <div className="qr-image">
          <img src={qrCode} alt="feedback qr code" />
        </div>
      </div>

      <div className="feedback-stats dashboard-card">
        <div className="total-feedback-stats">
          <div className="stats-icon">📊</div>
          <div className="stats-content">
            <p>Total Feedback Received</p>
            <h1>{totalFeedbacks}</h1>
          </div>
        </div>
      </div>

      <div className="recent-feedback dashboard-card">
        <div className="section-header">
          <h3>Latest Feedback</h3>
          <button className="view-all-button">View All</button>
        </div>

        <div className="feedback-items">
          {error && (
            <p role="alert" className="error-message" style={{ color: "var(--color-error)" }}>
              {error}
            </p>
          )}
          {feedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback._id}
              feedbackText={feedback.text}
              date={formatTimeAgo(feedback.createdAt)}
              category={feedback.category}
              rating={feedback.rating}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default MainContent;