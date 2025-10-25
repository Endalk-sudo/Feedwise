import api from "../services/api.js";
import "./AllFeedbacks.css";
import FeedbackCard from "./FeedbackCard";
import { useEffect, useState } from "react";

const AllFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAllFeedback = async () => {
      try {
        const res = await api.get("/feedback/me");
        
        setFeedbacks(res.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
        setError("Failed to load feedback. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFeedback();
  }, []); 
 
  if (isLoading) {
    return <div className="all-feedbacks-container">Loading feedback...</div>;
  }

  if (error) {
    return <div className="all-feedbacks-container error-state">{error}</div>;
  }

  return (
    <div className="all-feedbacks-container">
        <div className="feedbacks-header">
          <div className="header-content">
            <div className="feedback-icon" aria-hidden="true">💬</div>
            <h1>All Feedback</h1>
            <span className="total-feedback-count">{feedbacks.length}</span>
          </div>
        </div>

        <div className="feedbacks-grid">
          {feedbacks.map((fb) => (
            <FeedbackCard
              key={fb._id}
              feedbackText={fb.text}
              date={fb.createdAt}
              category={fb.category}
              rating={fb.rating}
              sentiment={fb.sentiment}
            />
          ))}
        </div>
    </div>
  );
};

export default AllFeedbacks;