import ReactMarkdown from 'react-markdown';
import "./AiResponseCard.css"


const AiResponseCard = ({res}) => {
  // Handle error object
  if (res && res.error) {
    return (
      <div className="ai-response-message">
        <div className="ai-response-avatar">
          <div className="avatar-icon">🤖</div>
        </div>
        <div className="ai-response-content error">
          <div className="ai-response-text">
            <div className="error-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Error</span>
            </div>
            <p>{res.error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="ai-response-message">
      <div className="ai-response-avatar">
        <div className="avatar-icon">🤖</div>
      </div>
      
      <div className="ai-response-content">
        <div className="ai-response-text">
          <ReactMarkdown
            components={{
              code: ({inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="code-block">
                    <div className="code-header">
                      <span>{match[1]}</span>
                      <button className="copy-button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5.00005C7.01165 5.00082 6.49359 5.01338 6.09202 5.21799C5.71569 5.40973 5.40973 5.71569 5.21799 6.09202C5 6.51984 5 7.07989 5 8.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V8.2C19 7.07989 19 6.51984 18.782 6.09202C18.5903 5.71569 18.2843 5.40973 17.908 5.21799C17.5064 5.01338 16.9884 5.00082 16 5.00005" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 3.2C8 2.0799 8 1.51984 8.21799 1.09202C8.40973 0.715695 8.71569 0.40973 9.09202 0.217987C9.51984 0 10.0799 0 11.2 0H15.8C16.9201 0 17.4802 0 17.908 0.217987C18.2843 0.40973 18.5903 0.715695 18.782 1.09202C19 1.51984 19 2.0799 19 3.2C19 4.3201 19 4.88016 18.782 5.30798C18.5903 5.68431 18.2843 5.99027 17.908 6.18201C17.4802 6.4 16.9201 6.4 15.8 6.4H11.2C10.0799 6.4 9.51984 6.4 9.09202 6.18201C8.71569 5.99027 8.40973 5.68431 8.21799 5.30798C8 4.88016 8 4.3201 8 3.2Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </div>
                ) : (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                );
              },
              table: ({children}) => (
                <div className="table-container">
                  <table>{children}</table>
                </div>
              ),
              a: (props) => (
                <a className="markdown-link" target="_blank" rel="noopener noreferrer" {...props} />
              )
            }}
          >
            {res.response || "No response available at the moment. Please try again."}
          </ReactMarkdown>
        </div>
        
        <div className="response-actions">
          <button className="action-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 10C4 11.1046 4.89543 12 6 12C7.10457 12 8 11.1046 8 10C8 8.89543 7.10457 8 6 8C4.89543 8 4 8.89543 4 10Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 10C20 11.1046 20.8954 12 22 12C23.1046 12 24 11.1046 24 10C24 8.89543 23.1046 8 22 8C20.8954 8 20 8.89543 20 10Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className="action-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 10C4 11.1046 4.89543 12 6 12C7.10457 12 8 11.1046 8 10C8 8.89543 7.10457 8 6 8C4.89543 8 4 8.89543 4 10Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 10C20 11.1046 20.8954 12 22 12C23.1046 12 24 11.1046 24 10C24 8.89543 23.1046 8 22 8C20.8954 8 20 8.89543 20 10Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button className="action-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 10C4 11.1046 4.89543 12 6 12C7.10457 12 8 11.1046 8 10C8 8.89543 7.10457 8 6 8C4.89543 8 4 8.89543 4 10Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 10C20 11.1046 20.8954 12 22 12C23.1046 12 24 11.1046 24 10C24 8.89543 23.1046 8 22 8C20.8954 8 20 8.89543 20 10Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AiResponseCard