export interface Feedback {
  id: string;
  organizationId: string;
  userId: string | null;
  projectKey: string;
  text: string;
  category: string;
  rating: number;
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | null;
  urgency: 'Low' | 'Medium' | 'High' | null;
  keyPoints: string[];
  keywords: string[];
  confidence: number | null;
  rawAnalysis: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface FeedbackStats {
  total: number;
  bySentiment: { sentiment: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byUrgency: { urgency: string; count: number }[];
  recentCount: number;
}

export interface SentimentTrend {
  date: string;
  Positive: number;
  Negative: number;
  Neutral: number;
  Mixed: number;
}

export interface CategoryBreakdown {
  name: string;
  count: number;
}

export interface HeatmapData {
  category: string;
  sentiment: string;
  count: number;
}

export interface TopIssue {
  text: string;
  category: string;
  urgency: string;
  sentiment: string;
  count: number;
}

export interface Alert {
  id: string;
  text: string;
  category: string;
  urgency: string;
  sentiment: string;
  createdAt: string;
}

export interface Recommendation {
  title: string;
  reason: string;
  action: string;
  priority: number;
}

export interface AIChatResponse {
  reply: string;
}