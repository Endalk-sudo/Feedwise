import "./PlansComponent.css"
 


const PlansComponent = ({loading,handleSubscribe})=>{
      // SUBSCRIPTION PLANS CONFIGURATION
      // Define available plans as data structure for easy maintenance and updates
      // Each plan includes pricing, features, and Stripe integration details
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
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`plan-card ${plan.popular ? 'popular' : ''}`}
          >
            <h3>{plan.name}</h3>
            <div className="price">
              {plan.priceMonthly}<span className="interval">/month</span>
            </div>
            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <span className="feature-check">✓ </span> {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.priceId, plan.id)}
              className={`subscribe-btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
              disabled={loading === plan.id} 
            >
              {loading === plan.id ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </>
    )
}


export default PlansComponent
