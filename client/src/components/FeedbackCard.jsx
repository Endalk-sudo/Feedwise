import { useState, useCallback } from "react";
import "./FeedbackCard.css";

/**
 * FeedbackCard Component
 *
 * Purpose: Displays individual feedback items in a visually appealing card format
 *
 * Props:
 * - feedbackText (string): The actual feedback content from the user
 * - date (string): The date when the feedback was submitted
 * - category (string): The category of the feedback
 *
 * Design Philosophy:
 * - Uses a card-based design for visual separation and hierarchy
 * - Implements subtle animations and hover effects for better user experience
 * - Responsive design that works well on both mobile and desktop
 *
 * Usage:
 * <FeedbackCard feedbackText="Great service!" date="2024-01-15" category="Service" />
 */
const FeedbackCard = ({ feedbackText, date, category }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Improved text truncation logic
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  
  // Memoized toggle function to prevent unnecessary re-renders
  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);
  
  // Determine if text should be truncated
  const shouldTruncate = feedbackText && feedbackText.length > 100;
  const displayText = isExpanded || !shouldTruncate ? feedbackText : truncateText(feedbackText);
  
  return (
    <div className="feedback-card">
        {/* Main feedback content - displayed prominently */}
        <p className="feedback-text">
          {displayText}
          
          {shouldTruncate && (
            <button
              className="expanded-btn"
              onClick={toggle}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Show less feedback content" : "Show more feedback content"}
            >
              {isExpanded ? "See Less" : "See More"}
            </button>
          )}
        
        </p>

        {/* Date metadata - displayed as a subtle tag */}
        <div className="feedback-meta-data">
          <p className="feedback-category">{category}</p>
          <p className="feedback-date">{date}</p>
        </div>
    </div>
  );
};

export default FeedbackCard;