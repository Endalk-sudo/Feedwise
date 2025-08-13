import "./UserPromptCard.css"

/**
 * User Prompt Card Component
 *
 * This component renders the user's message prompts in the chat interface.
 * It displays the user's message with a distinctive avatar and styling to differentiate
 * it from AI responses. The component follows a right-aligned layout for clear visual
 * hierarchy in the conversation.
 *
 * Features:
 * - Glass-morphism effect with backdrop blur
 * - Smooth slide-in animation
 * - Responsive design that adapts to different screen sizes
 * - Professional avatar with gradient background
 * - Distinctive color scheme to separate from AI messages
 *
 * @returns {JSX.Element} The user prompt card component
 */
const UserPromptCard = ({prompt}) => {

  return (
    <div className="user-message-container">
      {/* User message content container with glass-morphism effect */}
      <div className="user-message-content">
        {/* User message text - the main content of the message */}
        <div className="user-message-text">
          {prompt}
        </div>
      </div>
      {/* User avatar with person icon - provides visual identity for the user */}
      <div className="user-message-avatar">👤</div>
    </div>
  )
}

export default UserPromptCard