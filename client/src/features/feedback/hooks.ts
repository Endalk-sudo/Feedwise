import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useFeedbackStore } from '@/lib/stores/feedback.store';
import { useUIStore } from '@/lib/stores/ui.store';
import type { FeedbackListResponse, FeedbackStats, SentimentTrend, CategoryBreakdown, HeatmapData, TopIssue, Alert, Recommendation } from './types';

/**
 * Hook to fetch feedbacks with pagination and filters
 */
export function useFeedbacks(slug: string) {
  const { currentPage, filters, setFeedbacks, setLoading, setError } = useFeedbackStore();

  return useQuery<FeedbackListResponse>({
    queryKey: ['feedbacks', slug, currentPage, filters],
    queryFn: () => apiClient.feedback.getAll(slug, { page: currentPage, ...filters }).then((res) => res.data),
    enabled: !!slug,
    placeholderData: (previous) => previous,
    onSuccess: (data) => {
      setFeedbacks(data.feedbacks, data.total, data.totalPages);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch feedbacks');
      setLoading(false);
    },
  });
}

/**
 * Hook to submit new feedback
 */
export function useSubmitFeedback(slug: string) {
  const queryClient = useQueryClient();
  const { addFeedback } = useFeedbackStore();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (text: string) => apiClient.feedback.submit(slug, text).then((res) => res.data),
    onSuccess: (newFeedback) => {
      addFeedback(newFeedback);
      queryClient.invalidateQueries({ queryKey: ['feedbacks', slug] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats', slug] });
      addToast({ message: 'Feedback submitted successfully!', type: 'success' });
    },
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to submit feedback', type: 'error' });
    },
  });
}

/**
 * Hook to fetch feedback stats
 */
export function useFeedbackStats(slug: string) {
  return useQuery<FeedbackStats>({
    queryKey: ['feedback-stats', slug],
    queryFn: () => apiClient.feedback.getStats(slug).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch sentiment trends
 */
export function useSentimentTrends(slug: string, days: number = 30) {
  return useQuery<SentimentTrend[]>({
    queryKey: ['sentiment-trends', slug, days],
    queryFn: () => apiClient.analytics.getSentiment(slug, days).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch category breakdown
 */
export function useCategoryBreakdown(slug: string) {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', slug],
    queryFn: () => apiClient.analytics.getCategories(slug).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch heatmap data
 */
export function useHeatmap(slug: string) {
  return useQuery<HeatmapData[]>({
    queryKey: ['heatmap', slug],
    queryFn: () => apiClient.analytics.getHeatmap(slug).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch top issues
 */
export function useTopIssues(slug: string) {
  return useQuery<TopIssue[]>({
    queryKey: ['top-issues', slug],
    queryFn: () => apiClient.analytics.getIssues(slug).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch alerts
 */
export function useAlerts(slug: string, days: number = 15) {
  return useQuery<Alert[]>({
    queryKey: ['alerts', slug, days],
    queryFn: () => apiClient.analytics.getAlerts(slug, days).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch recommendations (Pro only)
 */
export function useRecommendations(slug: string) {
  return useQuery<Recommendation[]>({
    queryKey: ['recommendations', slug],
    queryFn: () => apiClient.analytics.getRecommendations(slug).then((res) => res.data),
    enabled: !!slug,
  });
}

/**
 * Hook for AI chat
 */
export function useAIChat(slug: string) {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (message: string) => apiClient.ai.chat(slug, message).then((res) => res.data),
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to send message', type: 'error' });
    },
  });
}