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
        const res = await api.get("http://localhost:5000/api/feedback/me");
        
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
    return <div className="feedback-container">Loading feedback...</div>;
  }

  if (error) {
    return <div className="feedback-container error-message">{error}</div>;
  }

  return (
    <div className="feedback-container">
        <div className="feedback-header">
          <div className="feedback-header-title">
            <div className="feedback-header-icon" aria-hidden="true">💬</div>
            <h1>All Feedback</h1>
            <span className="feedback-count">{feedbacks.length}</span>
          </div>
        </div>

        <div className="all-feedbacks">
          {feedbacks.map((fb) => (
            <FeedbackCard
              key={fb._id}
              feedbackText={fb.text}
              date={fb.createdAt}
              category={fb.category}
              rating={fb.rating}
            />
          ))}
        </div>
    </div>
  );
};

export default AllFeedbacks;