export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

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
  // Phase 1: structured satisfaction (distinct from sentiment tone).
  satisfactionEstimate?: number | null;
  fixableProblem?: boolean | null;
  concreteIssue?: string | null;
  retentionRisk?: 'Low' | 'Medium' | 'High' | null;
  verified?: boolean;
  keyPoints: string[];
  keywords: string[];
  themes?: string[];
  rootCause?: string | null;
  suggestedAction?: string | null;
  confidence: number | null;
  contextTags?: string[];
  status?: FeedbackStatus;
  ownerReply?: string | null;
  internalNote?: string | null;
  resolvedAt?: string | null;
  correctedByHuman?: boolean;
  rawAnalysis: Record<string, unknown> | null;
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
  byStatus?: { status: string; count: number }[];
  recentCount: number;
  resolvedCount?: number;
  highUrgencyOpen?: number;
  actedOnRate?: number;
  topActions?: Array<{
    id: string;
    text: string;
    category: string;
    sentiment: string | null;
    urgency: string | null;
    satisfactionEstimate?: number | null;
    fixableProblem?: boolean | null;
    retentionRisk?: string | null;
    suggestedAction: string | null;
    rootCause: string | null;
    status: string;
    confidence: number | null;
    createdAt: string;
  }>;
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
  urgency: string | null;
  sentiment: string | null;
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
