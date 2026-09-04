import { Link } from '@tanstack/react-router';
import {
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Smartphone,
  ArrowRight,
  Star,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Collect Feedback Anywhere',
    description: 'QR codes, links, and embeddable widgets make it easy for customers to share their thoughts.',
  },
  {
    icon: Zap,
    title: 'Instant AI Analysis',
    description: 'Gemini AI categorizes, analyzes sentiment, detects urgency, and extracts key insights in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Analytics',
    description: 'Track sentiment trends, category breakdowns, recurring issues, and priority alerts on beautiful dashboards.',
  },
  {
    icon: Smartphone,
    title: 'AI Chat Assistant',
    description: 'Ask questions about your feedback in natural language. Get data-driven answers instantly.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant, end-to-end encryption, and granular access controls for your data.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign roles, and collaborate on insights together.',
  },
];

const pricing = [
  {
    name: 'Basic',
    price: 29,
    description: 'Perfect for small businesses getting started',
    features: [
      'Unlimited feedback collection',
      'AI categorization & sentiment',
      'Basic analytics dashboard',
      'QR code generation',
      'Email notifications',
      'Up to 1,000 responses/month',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: 79,
    description: 'For growing teams needing deeper insights',
    features: [
      'Everything in Basic',
      'AI Chat Assistant (InsightBot)',
      'Advanced analytics & heatmaps',
      'Priority alerts & recurring issues',
      'AI growth recommendations',
      'Team collaboration (up to 10)',
      'Custom branding',
      'API access',
      'Up to 10,000 responses/month',
    ],
    cta: 'Get Started',
    popular: true,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-bold text-xl">FeedbackAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#features" className="text-foreground hover:text-foreground transition-colors">About</a>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth/login" className="text-foreground hover:text-foreground transition-colors hidden sm:block">
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="btn-brand hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-primary text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: AI Chat Assistant now available
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Turn Customer Feedback into{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Actionable Insights
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground max-w-3xl mx-auto mb-10">
            Collect feedback via QR codes, analyze instantly with AI, and get actionable growth recommendations.
            No more guessing what your customers want.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/auth/register"
              className="btn-brand text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </Link>
            <Link
              to="/auth/register"
              className="w-full sm:w-auto border-2 border-input px-8 py-4 rounded-lg text-foreground font-semibold text-lg hover:border-slate-500 hover:text-foreground transition-all"
            >
              View Demo
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to understand your customers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help you collect, analyze, and act on customer feedback.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 rounded-xl bg-card border border-border hover:border-input transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that&apos;s right for your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-xl ${
                  plan.popular
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-card border border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth/register"
                  className={`w-full py-3 px-4 rounded-lg text-center font-semibold transition-all ${
                    plan.popular
? 'btn-brand'
                  : 'bg-secondary border border-input text-foreground hover:bg-muted hover:border-input hover:text-foreground'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by teams everywhere</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what our customers have to say about their experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">
                  "FeedbackAI completely changed how we understand our customers. The AI insights are spot on and have helped us improve our product significantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-foreground font-medium">JD</span>
                  </div>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-muted-foreground text-sm">CEO at TechStart</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to understand your customers better?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of businesses using FeedbackAI to turn feedback into growth.
          </p>
          <Link
            to="/auth/register"
            className="btn-brand text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-foreground" />
                </div>
                <span className="font-bold text-xl">FeedbackAI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Turn customer feedback into actionable insights with AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><span className="text-muted-foreground">Integrations</span></li>
                <li><span className="text-muted-foreground">API Docs</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><span className="text-muted-foreground">About</span></li>
                <li><span className="text-muted-foreground">Blog</span></li>
                <li><span className="text-muted-foreground">Careers</span></li>
                <li><span className="text-muted-foreground">Contact</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li><span className="text-muted-foreground">Privacy Policy</span></li>
                <li><span className="text-muted-foreground">Terms of Service</span></li>
                <li><span className="text-muted-foreground">Security</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} FeedbackAI. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener">
                Twitter
              </a>
              <a href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener">
                GitHub
              </a>
              <a href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors" target="_blank" rel="noopener">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}