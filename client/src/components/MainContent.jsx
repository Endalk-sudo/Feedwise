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
    <main className="content">
      <div className="dashboard-header card">
        <h1 className="main-heading">Dashboard</h1>
      </div>

      <div className="qr-container card">
        <div className="qr-content">
          <h2 className="qr-heading">Share your feedback link</h2>
          <p>Scan this QR code or share the link with your customers to collect feedback.</p>
          <div className="btn-container">
            <button className="btn btn-one" onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button className="btn btn-two" onClick={downloadQR}>
              Download QR
            </button>
          </div>
        </div>

        <div className="qr-code">
          <img src={qrCode} alt="feedback qr code" />
        </div>
      </div>

      <div className="feedback-overview card">
        <div className="total-feedback">
          <div className="feedback-icon">📊</div>
          <div className="feedback-content">
            <p>Total Feedback Received</p>
            <h1>{totalFeedbacks}</h1>
          </div>
        </div>
      </div>

      <div className="latest-feedback card">
        <div className="feedback-section-header">
          <h3>Latest Feedback</h3>
          <button className="view-all-btn">View All</button>
        </div>
        
        <div className="feedback-list">
          {error && (
            <p role="alert" className="feedback-helper" style={{ color: "var(--color-error)" }}>
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