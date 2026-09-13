import {
  BarChart3,
  MessageSquare,
  Shield,
  Smartphone,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: FeatureItem[] = [
  {
    icon: MessageSquare,
    title: 'Collect Feedback Anywhere',
    description:
      'QR codes, links, and embeddable widgets make it easy for customers to share their thoughts.',
  },
  {
    icon: Zap,
    title: 'Instant AI Analysis',
    description:
      'Gemini AI categorizes, analyzes sentiment, detects urgency, and extracts key insights in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Analytics',
    description:
      'Track sentiment trends, category breakdowns, recurring issues, and priority alerts on beautiful dashboards.',
  },
  {
    icon: Smartphone,
    title: 'AI Chat Assistant',
    description:
      'Ask questions about your feedback in natural language. Get data-driven answers instantly.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'End-to-end encryption and granular access controls keep your data safe and secure.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign roles, and collaborate on insights together.',
  },
];

export interface PricingPlan {
  name: string;
  plan: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const pricing: PricingPlan[] = [
  {
    name: 'Basic',
    plan: 'basic',
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
    plan: 'pro',
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

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'FeedbackAI cut our response analysis time from hours to seconds. The AI categorization is incredibly accurate.',
    name: 'Sarah Chen',
    role: 'Head of Product at NovaTech',
    initials: 'SC',
  },
  {
    quote:
      'We identified our top 3 customer pain points in the first week. The sentiment trends helped us prioritize our roadmap.',
    name: 'Marcus Rodriguez',
    role: 'Customer Success Lead at BrightLocal',
    initials: 'MR',
  },
  {
    quote:
      'The QR code feedback collection is a game changer for our restaurants. Customers love the simplicity.',
    name: 'Emily Park',
    role: 'Operations Manager at FreshBites',
    initials: 'EP',
  },
];

export interface Stat {
  value: string;
  label: string;
}

export const stats: Stat[] = [
  { value: '~10s', label: 'Median AI analysis time per response' },
  { value: '24/7', label: 'Urgency monitoring with instant alerts' },
  { value: '6+', label: 'Insight dimensions on every response' },
  { value: '14-day', label: 'Free trial on every plan, no card required' },
];

export interface Step {
  step: string;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    step: '01',
    title: 'Customers scan & share',
    description:
      'Print your QR code or share your link. Customers leave feedback in seconds — no app, no account needed.',
  },
  {
    step: '02',
    title: 'AI analyzes instantly',
    description:
      'Gemini scores sentiment, satisfaction, category, urgency, and retention risk the moment feedback arrives.',
  },
  {
    step: '03',
    title: 'You act with confidence',
    description:
      'Get urgency alerts, a daily digest, and an AI assistant that answers questions about your own data.',
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: 'How do customers leave feedback?',
    answer:
      'Each organization gets a unique QR code and shareable link. Customers scan, write their thoughts, optionally leave a star rating — no app install or account required.',
  },
  {
    question: 'What does the AI actually analyze?',
    answer:
      'Every response gets sentiment, a 1–5 satisfaction estimate, category, urgency, fixable-problem detection, retention risk, keywords, and a suggested action — in seconds.',
  },
  {
    question: 'Is there really a free trial?',
    answer:
      'Yes. Every plan includes a 14-day free trial with no credit card required. Cancel anytime from the billing portal.',
  },
  {
    question: 'How do urgency alerts work?',
    answer:
      'High-urgency or low-satisfaction feedback triggers an immediate email to your team, plus a daily digest summarizing everything new.',
  },
  {
    question: 'Can my team collaborate in Feedwise?',
    answer:
      'Yes. Invite staff by email with owner, admin, or member roles, add internal notes and owner replies, and verify AI corrections together.',
  },
];
