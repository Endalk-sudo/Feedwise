import React from 'react'
import "./AiResponseCard.css"

/**
 * AI Response Card Component
 *
 * This component renders the AI assistant's response messages in the chat interface.
 * It displays the AI's message with a distinctive avatar and styling to differentiate
 * it from user messages. The component follows a left-aligned layout for clear visual
 * hierarchy in the conversation.
 *
 * Features:
 * - Glass-morphism effect with backdrop blur
 * - Smooth slide-in animation
 * - Responsive design that adapts to different screen sizes
 * - Professional avatar with gradient background
 * - Timestamp display for message tracking
 *
 * @returns {JSX.Element} The AI response card component
 */
const AiResponseCard = ({res}) => {
  console.log(res);
  return (
    <div className="ai-response-message">
      {/* AI avatar with bot icon - provides visual identity for the AI assistant */}
      <div className="ai-response-avatar">🤖</div>
      
      {/* Message content container with glass-morphism effect */}
      <div className="ai-response-content">
        {/* AI response text - the main content of the message */}
        <div className="ai-response-text">
          {res}
        </div>
        {/* Message timestamp - shows when the AI response was generated */}
        <div className="ai-response-time">Just now</div>
      </div>
    </div>
  )
}

export default AiResponseCard
