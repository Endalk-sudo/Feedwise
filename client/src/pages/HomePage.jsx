// Import the CSS for styling the HomePage
import "./HomePage.css";
// Import the AI image asset used in the solution section
import aiImage from "../assets/Gemini_Generated_Image_d20azfd20azfd20a.png"
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";

// HomePage component renders the main landing page for the FeedbackAI app
const HomePage = () => {
  
  const plans = [
    {
      id:"basic",
      name: "Basic",
      priceMonthly: 29,
      priceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID,
      tagline: "Feedback Clarity Without the Chaos",
      features: [
        "Generate unlimited QR codes & shareable links",
        "AI-powered feedback analysis before submission",
        "Automatic categorization & tagging of feedback",
        "Dashboard to view & track insights",
        "Export feedback reports (CSV/PDF)",
        "Email support"
      ],
      popular: false
    },
    {
      id:"pro",
      name: "Pro",
      priceMonthly: 79,
      priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
      tagline: "AI-Powered Growth Engine",
      features: [
        "Everything in Basic",
        "Access to AI Business Insight Bot",
        "Personalized growth recommendations from AI",
        "Advanced analytics (trends, sentiment, recurring issues)",
        "Team collaboration (add staff to dashboard)",
        "Priority support"
      ],
      popular: true
    }
  ];
  
  return (
    <>
      <NavBar />
      
      <main>
        {/* Hero Section: Main headline, subheading, and primary call-to-action buttons */}
        <section className="hero">
          <div className="container hero-content">
            <h1 className="hero-heading">
              Stop Guessing What Your Customers Want. <span className="accent-text">Start Growing.</span>
            </h1>
            <p className="hero-sub-heading">
              FeedbackAI captures the honest, anonymous feedback you're missing and transforms it into your personal AI business consultant. Get instant summaries, deep insights, and clear, step-by-step action plans to improve your business today.
            </p>
            <div className="cta-btn-container">
              <Link className="btn cta-primary-btn cta-main-button" to="/register">
                <span className="btn-text">Get Started</span>
              </Link>
              <Link className="btn cta-secondary-btn" to="/demo">
                <span className="btn-text">Watch a 2-Min Demo</span>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="trust-indicators">
              <div className="trust-item">
                <div className="trust-icon">✓</div>
                <span>Setup in 3 minutes</span>
              </div>
            </div>
          </div>
          <div className="hero-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </section>
        
        {/* Problem Section: Highlights common issues businesses face with customer feedback */}
        <section className="problem-section">
          <div className="container">
            <div className="problem-content">
              <h2>
                You're Flying Blind. Your Customers Have the Map.
              </h2>
              <p>
                Are you tired of making decisions based on guesswork? If you're not hearing what your customers <b>really</b> think, you're leaving growth on the table.
              </p>
            </div>
            
            {/* List of problems customers face with traditional feedback methods */}
            <div className="problem-items-container">
              <div className="problem-item">
                <div className="problem-icon problem-icon-red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h3>Silence Isn't Golden</h3>
                <p>Most customers won't complain directly. They just leave. You're left wondering why.</p>
                <div className="problem-highlight"></div>
              </div>
              
              <div className="problem-item">
                <div className="problem-icon problem-icon-red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h3>Fear Holds Them Back</h3>
                <p>Traditional feedback forms feel risky. Customers worry about being judged or identified, so they give vague, polite answers—or none at all.</p>
                <div className="problem-highlight"></div>
              </div>
              
              <div className="problem-item">
                <div className="problem-icon problem-icon-red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18"></path>
                    <path d="M7 7l10 10"></path>
                    <path d="M17 7l-10 10"></path>
                  </svg>
                </div>
                <h3>Data Overload, Zero Clarity</h3>
                <p>Even if you get feedback, you're buried in spreadsheets and random comments. It's impossible to see the patterns and know what to fix first.</p>
                <div className="problem-highlight"></div>
              </div>
              
              <div className="problem-item">
                <div className="problem-icon problem-icon-red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <h3>Paralysis by Analysis</h3>
                <p>You have the data, but no clear next steps. You feel stuck, unsure how to turn complaints into real, revenue-driving improvements.</p>
                <div className="problem-highlight"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Solution Section: Explains how FeedbackAI solves these problems */}
        <section className="solution-section">
          <div className="container">
            <div className="solution-content">
              <h2>
                From Feedback Chaos to Crystal-Clear Action.
              </h2>
              <p>
                FeedbackAI bridges the gap between customer silence and confident decision-making. We combine the power of anonymity with brilliant AI to give you an unbeatable advantage.
              </p>
            </div>
            
            <div className="solutions-container">
              {/* Image representing AI features */}
              <div className="solution-img-container">
                <div className="solution-img">
                  <img src={aiImage} alt="AI analyzing customer feedback" loading="lazy" />
                  <div className="solution-img-border"></div>
                </div>
              </div>
              
              {/* List of solution features offered by FeedbackAI */}
              <div className="solution-items-container">
                <div className="solution-item">
                  <div className="solution-icon solution-icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                      <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                    </svg>
                  </div>
                  <div className="solution-text">
                    <h3>
                      Get Brutally Honest Feedback
                    </h3>
                    <p>
                      Our simple, anonymous QR codes and links encourage customers to share what they truly think in under 30 seconds
                    </p>
                  </div>
                </div>
                
                <div className="solution-item">
                  <div className="solution-icon solution-icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </div>
                  <div className="solution-text">
                    <h3>
                      Your AI Analyst Works Instantly
                    </h3>
                    <p>
                      Forget spreadsheets. Our AI reads every piece of feedback, automatically categorizes it by theme, and summarizes the key takeaways.
                    </p>
                  </div>
                </div>
                
                <div className="solution-item">
                  <div className="solution-icon solution-icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div className="solution-text">
                    <h3>
                      Consult Your Personal AI Coach
                    </h3>
                    <p>
                      Go beyond summaries. Ask your AI direct questions like, "What are the top 3 complaints about our checkout process?"
                    </p>
                  </div>
                </div>
                
                <div className="solution-item">
                  <div className="solution-icon solution-icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div className="solution-text">
                    <h3>
                      Never Wonder "What's Next?"
                    </h3>
                    <p>
                      FeedbackAI doesn't just give you data; it gives you a plan. Receive prioritized, actionable steps tailored to your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section: Details all the main features of FeedbackAI */}
        <section className="features-section" id="features">
          <div className="container">
            <div className="feature-content">
              <h2>Everything You Need to Become a Customer-Centric Business</h2>
            </div>
            
            <div className="features-card-container">
              {/* Each feature-card highlights a unique feature of the product */}
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>
                  Effortless Anonymous Feedback
                </h3>
                <p>
                  Get 3x more honest feedback with a simple link or QR code that customers actually use.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <h3>
                  The 24/7 AI Analyst
                </h3>
                <p>
                  Feedback is instantly organized by sentiment and theme, saving you hours of manual work.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <h3>
                  The Clarity Dashboard
                </h3>
                <p>
                  See every customer voice, trend, and priority in one clean, beautiful interface.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                <h3>
                  Your Personal AI Business Coach
                </h3>
                <p>
                  Go beyond data. Chat with your AI to brainstorm solutions and strategize your next move.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <h3>
                  Automated Action Plans
                </h3>
                <p>
                  Receive personalized, step-by-step guides created by the AI to fix identified issues.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <h3>
                  How It Works Guide
                </h3>
                <p>
                  Go from zero to action plan in 3 simple steps: Share, Analyze, and Act.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Social Proof Section: Shows a testimonial from a real user */}
        <section className="sp-section">
          <div className="container">
            <div className="sp-container">
              <div className="quote-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5z"></path>
                  <path d="M18 9a2 2 0 0 1-2 2h-6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5z"></path>
                </svg>
              </div>
              <h2>Don't Just Take Our Word For It</h2>
              <p>"Within 2 weeks of using FeedbackAI, we uncovered a recurring issue with our checkout process we never knew existed. The AI didn't just flag it—it gave us an exact, 3-step plan to fix it. Our customer satisfaction score jumped by 35% the next month."</p>
              <div className="customer-details">
                <div className="customer-avatar">
                  <div className="avatar-placeholder">JD</div>
                </div>
                <div className="customer-info">
                  <p className="customer-name">Jane D.</p>
                  <p className="customer-title">Beta User & Coffee Shop Owner</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Section: Outlines the pricing plans available */}
        <section className="pricing-section" id="pricing">
          <div className="container">
            <div className="pricing-content">
              <h2>Choose the Plan That Grows With You</h2>
              <p>Simple, transparent pricing. No hidden fees. Cancel anytime.</p>
            </div>
            
            <div className="pricing-cards-container">
              {plans.map(plan => (
                <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                  {plan.popular && <div className="popular-badge">BEST VALUE</div>}
                  <div className="card-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <p className="plan-description">{plan.tagline}</p>
                    <p className="price">${plan.priceMonthly} <span>/ month</span></p>
                  </div>
                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <Link className="btn cta-primary-btn pricing-cta-btn" to="/payment">Subscribe Now</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Closing Section: Final call-to-action for users to sign up */}
        <section className="closing-section">
          <div className="container">
            <div className="closing-content">
              <h2>
                Your Best Business Decisions Are Waiting in Your Customer Feedback.
              </h2>
              <p>
                Unlock them with FeedbackAI. Get started today and start listening to what truly matters.
              </p>
              <Link className="closing-btn cta-primary-btn btn" to="/register">
                Get Started 
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer: Modern minimalist design with great UI/UX */}
      <footer className="footer">
        <div className="container">
          <div className="footer-container">
            {/* Brand Section */}
            <div className="footer-logo">
              <h2>Feedback<span className='logo-color'>AI</span></h2>
              <p>Stop Guessing. Start Growing.</p>
            </div>
            
            {/* Quick Links */}
            <div className="footer-links">
              <div className="footer-group">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#">Demo</a></li>
                </ul>
              </div>
              
              <div className="footer-group">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
              
              <div className="footer-group">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="footer-social">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="#" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a href="#" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright Line */}
        <div className="footer-bottom">
          <div className="container">
            <p>© 2025 FeedbackAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

// Export the HomePage component as default
export default HomePage