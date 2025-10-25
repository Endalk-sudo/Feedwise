import api from "../services/api.js";
import "./AllFeedbacks.css";
import FeedbackCard from "./FeedbackCard";
import { useEffect, useState, useCallback } from "react";

const AllFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const fetchFeedbacks = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const res = await api.get(`/feedback/me?page=${pageNum}&limit=10`);

      if (append) {
        setFeedbacks(prev => [...prev, ...res.data.feedbacks]);
        setHasMore(res.data.hasMore);
      } else {
        setFeedbacks(res.data.feedbacks);
        setHasMore(res.data.hasMore);
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setError("Failed to load feedback. Please try again later.");
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Trigger when user is near bottom (100px from bottom)
    if (scrollTop + windowHeight >= documentHeight - 100) {
      setPage(prev => {
        const nextPage = prev + 1;
        fetchFeedbacks(nextPage, true);
        return nextPage;
      });
    }
  }, [loadingMore, hasMore, fetchFeedbacks]);

  useEffect(() => {
    fetchFeedbacks(1, false);
  }, [fetchFeedbacks]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
 
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

          {loadingMore && (
            <div className="loading-more">
              <div className="loading-spinner"></div>
              <span>Loading more feedback...</span>
            </div>
          )}

          {!hasMore && feedbacks.length > 0 && (
            <div className="no-more-feedback">
              <span>You've reached the end of your feedback!</span>
            </div>
          )}
        </div>
    </div>
  );
};

export default AllFeedbacks;