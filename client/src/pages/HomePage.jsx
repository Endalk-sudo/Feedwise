// Import the CSS for styling the HomePage
import "./HomePage.css";
// Import the AI image asset used in the solution section
import aiImage from "../assets/Gemini_Generated_Image_d20azfd20azfd20a.png"
import { useState } from "react";
import { Link } from "react-router-dom";



// HomePage component renders the main landing page for the FeedbackAI app
const HomePage = () => {
  const [isOpen ,setIsOpen] = useState(false);

  const toggle =()=> {
    setIsOpen((p)=>!p);
  }
  return (
    <>
      {/* Navigation Bar: Contains logo, navigation links, and CTA button */}
      <nav className="navbar">
        <div className="ai-logo">
            Feedback<span className="logo-color">AI</span>
        </div>
        <ul className={`nav-links ${isOpen ? "expand" : ""}`}>
          <li><a href="#features" onClick={() => setIsOpen(false)}>Features</a></li>
          <li><a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a></li>
          <li><a href="#login" onClick={() => setIsOpen(false)}>Login</a></li>
         <Link to="/auth" className="link" onClick={() => setIsOpen(false)}>
             <button className="btn cta-primary-btn">Get Started →</button>
         </Link>
        </ul>
        <button
          onClick={toggle}
          className="open"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="nav-links"
          tabIndex={0}
          role="button"
        >
          {isOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"   /* 1 */
              strokeWidth="2"         /* 2 */
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      <main>
        {/* Hero Section: Main headline, subheading, and primary call-to-action buttons */}
        <section className="hero">
          <h1 className="hero-heading">
            Stop Guessing What Your Customers Want. <span>Start Growing.</span>
          </h1>
          <p className="hero-sub-heading">
            FeedbackAI captures the honest, anonymous feedback you're missing and transforms it into your personal AI business consultant. Get instant summaries, deep insights, and clear, step-by-step action plans to improve your business today.
          </p>
          <div className="cta-btn-container">
             <Link className="btn cta-primary-btn cta-main-btn" to="/auth">Get Started for Free →</Link> 
              <button className="btn cta-secondary-btn"> Watch a 2-Min Demo</button>
          </div> 
        </section>

        {/* Problem Section: Highlights common issues businesses face with customer feedback */}
        <section className="problem-section">
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
              <h3>Silence Isn't Golden</h3>
              <p>Most customers won't complain directly. They just leave. You're left wondering why.</p>
            </div>
            <div className="problem-item">
              <h3>Fear Holds Them Back</h3>
              <p>Traditional feedback forms feel risky. Customers worry about being judged or identified, so they give vague, polite answers—or none at all.</p>
            </div>
            <div className="problem-item">
              <h3>Data Overload, Zero Clarity</h3>
              <p>Even if you get feedback, you're buried in spreadsheets and random comments. It's impossible to see the patterns and know what to fix first.</p>
            </div>
            <div className="problem-item">
              <h3>Paralysis by Analysis</h3>
              <p>You have the data, but no clear next steps. You feel stuck, unsure how to turn complaints into real, revenue-driving improvements.</p>
            </div>
          </div>
        </section>

        {/* Solution Section: Explains how FeedbackAI solves these problems */}
        <section className="solution-section">
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
                  <img src={aiImage} alt="ai-image" />
              </div>
            </div>

            {/* List of solution features offered by FeedbackAI */}
            <div className="solution-items-container">
              <div className="solution-item">
                <h3>
                  Get Brutally Honest Feedback
                </h3>
                <p>
                  Our simple, anonymous QR codes and links encourage customers to share what they truly think in under 30 seconds
                </p>
              </div>
              <div className="solution-item">
                <h3>
                  Your AI Analyst Works Instantly
                </h3>
                <p>
                  Forget spreadsheets. Our AI reads every piece of feedback, automatically categorizes it by theme (like "Pricing," "Customer Service," or "Product Quality"), and summarizes the key takeaways.
                </p>
              </div>
              <div className="solution-item">
                <h3>
                  Consult Your Personal AI Coach
                </h3>
                <p>
                  Go beyond summaries. Ask your AI direct questions like, "What are the top 3 complaints about our checkout process?" or "Suggest three ways to improve customer loyalty based on recent feedback."
                </p>
              </div>
              <div className="solution-item">
                <h3>
                  Never Wonder "What's Next?"
                </h3>
                <p>
                  FeedbackAI doesn't just give you data; it gives you a plan. Receive prioritized, actionable steps and guides tailored specifically to your business goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section: Details all the main features of FeedbackAI */}
        <section className="features-section" id="features">
              <div className="feature-content">
                  <h2>Everything You Need to Become a Customer-Centric Business</h2>
              </div>

              <div className="features-card-container">
                  {/* Each feature-card highlights a unique feature of the product */}
                  <div className="feature-card">
                    <h3>
                      Effortless Anonymous Feedback
                    </h3>
                    <p>
                      Get 3x more honest feedback with a simple link or QR code that customers actually use.
                    </p>
                  </div>

                  <div className="feature-card">
                    <h3>
                      The 24/7 AI Analyst
                    </h3>
                    <p>
                      Feedback is instantly organized by sentiment and theme, saving you hours of manual work and revealing hidden patterns.
                    </p>
                  </div>

                  <div className="feature-card">
                    <h3>
                       The Clarity Dashboard
                    </h3>
                    <p>
                      See every customer voice, trend, and priority in one clean, beautiful interface. No more messy data.
                    </p>
                  </div>

                  <div className="feature-card">
                    <h3>
                       Your Personal AI Business Coach
                    </h3>
                    <p>
                      Go beyond data. Chat with your AI to brainstorm solutions, understand customer emotion, and strategize your next move.
                    </p>
                  </div>

                  <div className="feature-card">
                    <h3>
                       Automated Action Plans
                    </h3>
                    <p>
                      Receive personalized, step-by-step guides created by the AI. It doesn’t just analyze the problem—it tells you exactly how to fix it.
                    </p>
                  </div>
                  <div className="feature-card">
                    <h3>
                       How It Works Guide
                    </h3>
                    <p>
                      Go from zero to action plan in 3 simple steps: Share, Analyze, and Act.
                    </p>
                  </div>
              </div>
        </section>

        {/* Social Proof Section: Shows a testimonial from a real user */}
        <section className="sp-section">
          <div className="sp-container">
            <h2>Don't Just Take Our Word For It</h2>
            <p>“Within 2 weeks of using FeedbackAI, we uncovered a recurring issue with our checkout process we never knew existed. The AI didn't just flag it—it gave us an exact, 3-step plan to fix it. Our customer satisfaction score jumped by 35% the next month.”</p>
            <div className="custommer-detailes">
                <p>Jane D.</p>
                <p className="color">Beta User & Coffee Shop Owner</p>
            </div>
          </div>
        </section>

        {/* Pricing Section: Outlines the pricing plans available */}
        <section className="pricing-section" id="pricing">
          <div className="pricing-content">
            <h2>Choose the Plan That Grows With You</h2>
            <p>Simple, transparent pricing. No hidden fees. Cancel anytime.</p>
          </div>

          <div className="pricing-cards-container">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3 className="plan-name">Starter</h3>
                <p className="plan-description">Perfect for getting started with customer feedback.</p>
                <p className="price">$0</p>
              </div>
              <ul className="features-list">
                <li>Collect up to 50 feedbacks/month</li>
                <li>Basic AI Summaries</li>
                <li>1 Dashboard User</li>
              </ul>
              <button className="btn cta-primary-btn pricing-cta-btn">Start for Free</button>
            </div>

            {/* Pro Plan (Most Popular) */}
            <div className="pricing-card popular">
              <div className="card-header">
                <h3 className="plan-name">Pro</h3>
                <p className="plan-description">For businesses ready to turn insights into action.</p>
                <p className="price">$29 <span>/ month</span></p>
              </div>
              <ul className="features-list">
                <li>Unlimited Feedback Collection</li>
                <li>AI Chat Consultant</li>
                <li>Actionable Insights & Guides</li>
                <li>Unlimited Dashboard Users</li>
              </ul>
              <button className="btn cta-primary-btn pricing-cta-btn">Start Your Pro Trial</button>
            </div>

            {/* Business Plan */}
            <div className="pricing-card">
              <div className="card-header">
                <h3 className="plan-name">Business</h3>
                <p className="plan-description">For teams that need advanced analytics and support.</p>
                <p className="price">$79 <span>/ month</span></p>
              </div>
              <ul className="features-list">
                <li>Everything in Pro, plus:</li>
                <li>Advanced AI Consulting Features</li>
                <li>API Access & Integrations</li>
                <li>Priority Support</li>
              </ul>
              <button className="btn cta-primary-btn pricing-cta-btn">Talk to Sales</button>
            </div>
          </div>
          
        </section>

        {/* Closing Section: Final call-to-action for users to sign up */}
        <section className="closing-section">
            <h2>
              Your Best Business Decisions Are Waiting in Your Customer Feedback.
            </h2>
            <p>
              Unlock them with FeedbackAI. Get your free account today and start listening to what truly matters.
            </p>
            <button className="closing-btn cta-primary-btn btn">
             Get Your Free Account Now
            </button>
        </section>
      </main>

      {/* Footer: Modern minimalist design with great UI/UX */}
      <footer className="footer">
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
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
              <a href="#"><i className="fab fa-facebook"></i></a>
            </div>
          </div>
        </div>
        
        {/* Copyright Line */}
        <div className="footer-bottom">
          <p>© 2025 FeedbackAI. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}

// Export the HomePage component as default
export default HomePage