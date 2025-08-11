import "./FeedbackCard.css"

/**
 * FeedbackCard Component
 *
 * Purpose: Displays individual feedback items in a visually appealing card format
 *
 * Props:
 * - feedbackText (string): The actual feedback content from the user
 * - date (string): The date when the feedback was submitted
 *
 * Design Philosophy:
 * - Uses a card-based design for visual separation and hierarchy
 * - Implements subtle animations and hover effects for better user experience
 * - Responsive design that works well on both mobile and desktop
 *
 * Usage:
 * <FeedbackCard feedbackText="Great service!" date="2024-01-15" />
 */
const FeedbackCard = ({feedbackText,date}) => {
  return (
    <div className="feedback-card">
        {/* Main feedback content - displayed prominently */}
        <p className="feedback-text">{feedbackText}</p>
        
        {/* Date metadata - displayed as a subtle tag */}
        <p className="feedback-date">{date}</p>
    </div>
  )
}

export default FeedbackCard