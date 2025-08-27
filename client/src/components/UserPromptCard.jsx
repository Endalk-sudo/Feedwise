import "./UserPromptCard.css"


const UserPromptCard = ({prompt}) => {
  return (
    <div className="user-message-container">
      <div className="user-message-content">
        <div className="user-message-text">
          {prompt}
        </div>
        
        <div className="message-meta">
          <span className="message-time">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="read-indicator">
            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      <div className="user-message-avatar">
        <div className="avatar-icon">👤</div>
      </div>
    </div>
  )
}

export default UserPromptCard