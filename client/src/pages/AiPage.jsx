import {useState} from "react"
import AiResponseCard from "../components/AiResponseCard"
import UserPromptCard from "../components/UserPromptCard"
import "./AiPage.css"

/**
 * AI Assistant Page Component
 *
 * This component renders the AI assistant interface with a modern, professional design.
 * Features include:
 * - Glass-morphism effects with backdrop filters
 * - Smooth animations and transitions
 * - Responsive design for mobile and desktop
 * - Professional chat interface with message bubbles
 * - Enhanced form controls with visual feedback
 * - Properly aligned input form with improved UX
 *
 * The design follows the existing color scheme from the design system,
 * using navy blue backgrounds with sky blue accents for a cohesive look.
 */

const WelcomeMessage = () => {
    return (
        <div className="ai-response-message">
            {/* Message avatar (AI bot icon) */}
            <div className="ai-response-avatar">🤖</div>
            
            {/* Message content container */}
            <div className="ai-response-content">
                {/* Welcome message text introducing the AI assistant */}
                <div className="ai-response-text">
                    Hello! I'm InsightBot, your AI assistant for customer feedback.
                    I can help you analyze trends, extract insights, and answer questions about your feedback data.
                </div>
                {/* Message timestamp showing when the message was sent */}
                <div className="ai-response-time">Just now</div>
            </div>
        </div>
    )
}

const AiPage = () => {
    const [message, setMessage] = useState([]);
    // const [error, setError] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();  // Prevent form from submitting normally
        const formData = new FormData(event.target);
        const prompt = formData.get('user-prompt');
        
        setMessage((mg)=>{
            return [...mg, <UserPromptCard key={new Date()} prompt={prompt}/>]
        })
         // Clear the input field
        event.target.reset();

        fetch("http://localhost:5000/api/ai",{
            method: "POST",
            headers :{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prompt)
        })
        .then((res)=> res.json())
        .then((resData)=>{
            setMessage((mg)=>{
                return [...mg, <AiResponseCard res={resData}/>]
            })
        })
        .catch((err)=>{
            console.log("error from ai", err.message);
            // setError(err.message)
        })

        
    }

    


    return (
        <section className="ai-app">
            {/* Main container for the AI chat interface */}
            <div className="ai-container">
                
                {/* Header section with bot avatar and title */}
                <div className="ai-chat-header">
                    {/* Header content container with flex layout */}
                    <div className="header-content">
                        {/* Bot avatar with animated pulse effect */}
                        <div className="bot-avatar">
                            {/* Bot icon using emoji for simplicity */}
                            <div className="bot-icon">🤖</div>
                        </div>
                        
                        {/* Header text section */}
                        <div className="header-text">
                            {/* Main title with gradient text effect */}
                            <h1>Ask InsightBot</h1>
                            {/* Description text explaining the AI assistant's purpose */}
                            <p>Your AI assistant for customer feedback analysis</p>
                        </div>
                    </div>
                </div>
                
                {/* Chat playground area - main chat interface */}
                <div className="ai-play-ground">
                    {/* Container for chat messages with scrolling capability */}
                    <div className="chat-messages">
                        <WelcomeMessage />
                        
                        {message}
                    </div>
                </div>
                
                {/* Enhanced input form for user messages - fixed positioning for better UX */}
                <form onSubmit={handleSubmit} id="ai-form" className="ai-form">
                    {/* Text input field for user messages */}
                    <input
                        type="text"
                        name="user-prompt"
                        id="chat-input"
                        placeholder="Ask something about your feedback..."
                        autoComplete="off"  // Disable browser autocomplete for better UX
                    />
                    
                    {/* Send button with icon and text */}
                    <button type="submit" className="ai-chat-send-btn btn">
                        {/* Button text for accessibility */}
                        <span className="btn-text">Send</span>
                        {/* Arrow icon indicating sending action */}
                        <span className="btn-icon">→</span>
                    </button>
                </form>
            </div>
        </section>
    )
}

// Export the component for use in the application
export default AiPage