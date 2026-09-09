import { create } from 'zustand';
import type { Feedback } from '@/features/feedback/types';

interface FeedbackState {
  feedbacks: Feedback[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: {
    sentiment?: string;
    category?: string;
    urgency?: string;
    status?: string;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  setFeedbacks: (feedbacks: Feedback[], totalCount: number, totalPages: number) => void;
  addFeedback: (feedback: Feedback) => void;
  updateFeedback: (id: string, data: Partial<Feedback>) => void;
  removeFeedback: (id: string) => void;
  setPage: (page: number) => void;
  setFilters: (filters: FeedbackState['filters']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFeedbacks: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedbacks: [],
  totalCount: 0,
  currentPage: 1,
  totalPages: 0,
  filters: {},
  isLoading: false,
  error: null,

  setFeedbacks: (feedbacks, totalCount, totalPages) => set({
    feedbacks,
    totalCount,
    totalPages,
  }),

  addFeedback: (feedback) => set((state) => ({
    feedbacks: [feedback, ...state.feedbacks],
    totalCount: state.totalCount + 1,
  })),

  updateFeedback: (id, data) => set((state) => ({
    feedbacks: state.feedbacks.map((f) => f.id === id ? { ...f, ...data } : f),
  })),

  removeFeedback: (id) => set((state) => ({
    feedbacks: state.feedbacks.filter((f) => f.id !== id),
    totalCount: state.totalCount - 1,
  })),

  setPage: (page) => set({ currentPage: page }),

  setFilters: (filters) => set({ filters, currentPage: 1 }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearFeedbacks: () => set({
    feedbacks: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
  }),
}));