// User Types
export interface User {
  _id: string;
  username: string;
  email: string;
  hasOrganization: boolean;
  organizationId: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  currentPlan: PlanType;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Organization Types
export interface Organization {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  content: string;
  qrDataUrl: string;
  businessType: string;
  businessDescription: string;
  categories: string[];
  createdAt: Date;
}

// Feedback Types
export interface Feedback {
  _id: string;
  organizationId: string;
  projectKey: string;
  text: string;
  category: string;
  rating: number;
  sentiment: Sentiment;
  urgency: Urgency;
  keyPoints: string[];
  keywords: string[];
  confidence: number;
  rawAnalysis: Record<string, unknown>;
  createdAt: Date;
}

// Subscription Types
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'inactive' | 'trialing';
export type PlanType = 'basic' | 'pro' | null;

// AI Analysis Types
export type Sentiment = 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
export type Urgency = 'Low' | 'Medium' | 'High';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Organization Types
export interface CreateOrgRequest {
  name: string;
  slug: string;
  businessType: string;
  businessDescription: string;
}

// Feedback Types
export interface SubmitFeedbackRequest {
  text: string;
}

export interface FeedbackQueryParams {
  page?: number;
  limit?: number;
  sentiment?: Sentiment;
  category?: string;
  urgency?: Urgency;
}

// Analytics Types
export interface SentimentData {
  name: string;
  value: number;
}

export interface CategoryData {
  name: string;
  count: number;
}

export interface TrendData {
  date: string;
  Positive: number;
  Negative: number;
  Neutral: number;
  Mixed: number;
}

export interface HeatmapData {
  category: string;
  sentiment: Sentiment;
  count: number;
}

export interface IssueData {
  text: string;
  category: string;
  urgency: Urgency;
  sentiment: Sentiment;
  count: number;
}

export interface AlertData {
  text: string;
  category: string;
  urgency: Urgency;
  sentiment: Sentiment;
  createdAt: Date;
}

export interface RecommendationData {
  title: string;
  reason: string;
  action: string;
  priority: number;
}

// AI Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

// Dashboard Types
export interface DashboardData {
  organization: Organization;
  totalFeedback: number;
  recentFeedback: Feedback[];
}

// Business Types
export const BUSINESS_TYPES = [
  'SaaS',
  'E-commerce',
  'Restaurant',
  'Healthcare',
  'Education',
  'Finance',
  'Real Estate',
  'Retail',
  'Manufacturing',
  'Logistics',
  'Media',
  'Entertainment',
  'Travel',
  'Automotive',
  'Legal',
  'Marketing',
  'Consulting',
  'Non-profit',
  'Government',
  'Agriculture',
  'Energy',
  'Telecommunications',
  'Construction',
  'Food & Beverage',
  'Fashion',
  'Sports',
  'Other',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
