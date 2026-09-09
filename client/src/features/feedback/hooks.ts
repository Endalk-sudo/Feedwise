import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useFeedbackStore } from '@/lib/stores/feedback.store';
import { useUIStore } from '@/lib/stores/ui.store';
import type { Feedback, FeedbackListResponse, FeedbackStats, SentimentTrend, CategoryBreakdown, HeatmapData, TopIssue, Alert, Recommendation, AIChatResponse } from './types';

/**
 * Unwrap the standard server envelope: { success: true, data: T }.
 * (axios response body lives at res.data, payload at res.data.data.)
 */
function unwrapData<T>(request: Promise<{ data: { data: T } }>): Promise<T> {
  return request.then((res) => res.data.data);
}

/**
 * Hook to fetch feedbacks with pagination and filters.
 * Syncs the feedback store via effects (no onSuccess in useQuery under v5).
 */
export function useFeedbacks(slug: string) {
  const { currentPage, filters, setFeedbacks, setLoading, setError } = useFeedbackStore();

  const query = useQuery<FeedbackListResponse>({
    queryKey: ['feedbacks', slug, currentPage, filters],
    queryFn: () =>
      unwrapData<FeedbackListResponse>(
        apiClient.feedback.getAll(slug, { page: currentPage, ...filters }),
      ),
    enabled: !!slug,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (query.data) {
      setFeedbacks(query.data.feedbacks, query.data.total, query.data.totalPages);
      setLoading(false);
    }
  }, [query.data, setFeedbacks, setLoading]);

  useEffect(() => {
    if (query.error) {
      setError(query.error instanceof Error ? query.error.message : 'Failed to fetch feedbacks');
      setLoading(false);
    }
  }, [query.error, setError, setLoading]);

  return query;
}

/**
 * Hook to submit new feedback
 */
export function useSubmitFeedback(slug: string) {
  const queryClient = useQueryClient();
  const { addFeedback } = useFeedbackStore();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (text: string) => unwrapData<Feedback>(apiClient.feedback.submit(slug, text)),
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
    queryFn: () => unwrapData<FeedbackStats>(apiClient.feedback.getStats(slug)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch sentiment trends
 */
export function useSentimentTrends(slug: string, days: number = 30) {
  return useQuery<SentimentTrend[]>({
    queryKey: ['sentiment-trends', slug, days],
    queryFn: () => unwrapData<SentimentTrend[]>(apiClient.analytics.getSentiment(slug, days)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch category breakdown
 */
export function useCategoryBreakdown(slug: string) {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', slug],
    queryFn: () => unwrapData<CategoryBreakdown[]>(apiClient.analytics.getCategories(slug)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch heatmap data
 */
export function useHeatmap(slug: string) {
  return useQuery<HeatmapData[]>({
    queryKey: ['heatmap', slug],
    queryFn: () => unwrapData<HeatmapData[]>(apiClient.analytics.getHeatmap(slug)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch top issues
 */
export function useTopIssues(slug: string) {
  return useQuery<TopIssue[]>({
    queryKey: ['top-issues', slug],
    queryFn: () => unwrapData<TopIssue[]>(apiClient.analytics.getIssues(slug)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch alerts
 */
export function useAlerts(slug: string, days: number = 15) {
  return useQuery<Alert[]>({
    queryKey: ['alerts', slug, days],
    queryFn: () => unwrapData<Alert[]>(apiClient.analytics.getAlerts(slug, days)),
    enabled: !!slug,
  });
}

/**
 * Hook to fetch recommendations (Pro only)
 */
export function useRecommendations(slug: string) {
  return useQuery<Recommendation[]>({
    queryKey: ['recommendations', slug],
    queryFn: () => unwrapData<Recommendation[]>(apiClient.analytics.getRecommendations(slug)),
    enabled: !!slug,
  });
}

/**
 * Hook for AI chat
 */
export function useAIChat(slug: string) {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (message: string) => unwrapData<AIChatResponse>(apiClient.ai.chat(slug, message)),
    onError: (error) => {
      addToast({ message: error instanceof Error ? error.message : 'Failed to send message', type: 'error' });
    },
  });
}


/**
 * Close-the-loop: mark feedback resolved / in progress / ignored, optional reply & note.
 */
export function useUpdateFeedbackStatus(slug: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      ownerReply?: string | null;
      internalNote?: string | null;
    }) => unwrapData(apiClient.feedback.updateStatus(slug, id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks', slug] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats', slug] });
      addToast({ message: 'Feedback updated', type: 'success' });
    },
    onError: (error) => {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to update feedback',
        type: 'error',
      });
    },
  });
}
