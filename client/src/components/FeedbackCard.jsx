import { useState, useCallback } from "react";
import "./FeedbackCard.css";

// SVG Icons for better quality and theming
const CategoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 005.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 00-2.122-.879H5.25zM6.375 7.5a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
  </svg>
);

const DateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
  </svg>
);

const RatingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

// Star rating component
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={`star ${index < fullStars ? 'full' : (index === fullStars && hasHalfStar ? 'half' : 'empty')}`}>
          ★
        </span>
      ))}
      <span className="rating-value">{rating.toFixed(1)}</span>
    </div>
  );
};

/**
 * FeedbackCard Component
 *
 * Purpose: Displays individual feedback items in a visually appealing card format
 *
 * Props:
 * - feedbackText (string): The actual feedback content from the user
 * - date (string): The date when the feedback was submitted
 * - category (string): The category of the feedback
 * - rating (number): The rating from 1 to 5
 *
 * Design Philosophy:
 * - Uses a card-based design for visual separation and hierarchy
 * - Implements subtle animations and hover effects for better user experience
 * - Responsive design that works well on both mobile and desktop
 *
 * Usage:
 * <FeedbackCard feedbackText="Great service!" date="2024-01-15" category="Service" rating={4.5} />
 */
const FeedbackCard = ({ feedbackText, date, category, rating = 5 }) => {
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
      {/* Rating display at the top right */}
      <div className="feedback-rating">
        <RatingIcon />
        <StarRating rating={rating} />
      </div>
      
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

      {/* Meta data footer */}
      <div className="feedback-meta-data">
        <div className="meta-item">
          <CategoryIcon />
          <span>{category}</span>
        </div>
        
        <div className="meta-item">
          <DateIcon />
          <span>{date}</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;