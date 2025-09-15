import { useState, useRef, useEffect } from "react"
import AiResponseCard from "../components/AiResponseCard"
import UserPromptCard from "../components/UserPromptCard"
import { useAuth } from "../context/AuthContext" // Fixed import
import api from "../services/api.js"
import "./AiPage.css"

const WelcomeMessage = () => {
    return (
        <div className="ai-response-message">
            <div className="ai-response-avatar">
                <div className="avatar-icon">🤖</div>
            </div>
            
            <div className="ai-response-content">
                <div className="ai-response-text">
                    <p>Hello! I'm InsightBot, your AI assistant for customer feedback analysis.</p>
                    <p>I can help you analyze trends, extract insights, and answer questions about your feedback data.</p>
                </div>
                <div className="suggestion-chips">
                    <div className="chip">Show me recent feedback trends</div>
                    <div className="chip">Analyze sentiment from last week</div>
                    <div className="chip">What are customers complaining about?</div>
                </div>
            </div>
        </div>
    )
}

const AiPage = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const { user } = useAuth(); // Fixed to use useAuth hook
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const prompt = formData.get('user-prompt');
        
        if (!prompt.trim()) return;
        
        // Add user message
        setMessages(prev => [...prev, { type: 'user', content: prompt, id: Date.now() }]);
        setIsLoading(true);
        
        // Clear the input field
        event.target.reset();
        
        try {
            const response = await api.post("http://localhost:5000/api/ai", 
                { user, prompt }
            );
            
            console.log("response data =>", response.data);
            setMessages(prev => [...prev, { type: 'ai', content: response.data, id: Date.now() + 1 }]);
        } catch(err) {
            console.log("error from ai", err.message);
            setMessages(prev => [...prev, { 
                type: 'ai', 
                content: { error: "Sorry, I'm having trouble connecting right now. Please try again." }, 
                id: Date.now() + 1 
            }]);
        } finally {
            setIsLoading(false);
        }
        
        scrollToBottom();
    }

    return (
        <section className="ai-app">
            <div className="ai-container">
                <div className="ai-chat-header">
                    <div className="header-content">
                        <div className="bot-avatar">
                            <div className="avatar-pulse"></div>
                            <div className="bot-icon">🤖</div>
                        </div>
                        
                        <div className="header-text">
                            <h1>InsightBot AI Assistant</h1>
                            <p>Analyze customer feedback and extract valuable insights</p>
                            <div className="status-indicator">
                                <div className="status-dot"></div>
                                <span>Online</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="ai-play-ground">
                    <div className="chat-messages">
                        <WelcomeMessage />
                        
                        {messages.map((msg) => (
                            msg.type === 'user' ? 
                                <UserPromptCard key={msg.id} prompt={msg.content} /> : 
                                <AiResponseCard key={msg.id} res={msg.content} />
                        ))}
                        
                        {isLoading && (
                            <div className="ai-response-message loading">
                                <div className="ai-response-avatar">
                                    <div className="avatar-icon">🤖</div>
                                </div>
                                <div className="ai-response-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} id="ai-form" className="ai-form">
                    <div className="input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            name="user-prompt"
                            id="chat-input"
                            placeholder="Ask something about your feedback..."
                            autoComplete="off"
                        />
                        <button type="submit" className="ai-chat-send-btn">
                            <span className="btn-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default AiPage;