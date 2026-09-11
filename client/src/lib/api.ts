import axios from 'axios';
import { authClient } from './auth-client';

/**
 * Axios instance with interceptors
 * Works with Better Auth cookies automatically
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Better Auth handles cookies automatically
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired - redirect to login
      // Only redirect if not already on auth pages
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth/') && !currentPath.startsWith('/login')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Typed API functions for TanStack Query
 * These return axios promises that can be used directly as queryFn
 */
export const apiClient = {
  // Auth - uses Better Auth client directly
  auth: {
    getSession: () => authClient.getSession({ fetchOptions: { credentials: 'include' } }),
    signIn: (email: string, password: string) => authClient.signIn.email({ email, password }),
    signUp: (data: { email: string; password: string; name: string }) => authClient.signUp.email(data),
    signOut: () => authClient.signOut({ fetchOptions: { credentials: 'include' } }),
    updateUser: (data: { name?: string; image?: string }) => authClient.updateUser(data),
    changePassword: (data: { currentPassword: string; newPassword: string }) => authClient.changePassword(data),
  },

  // Organizations
  organizations: {
    create: (data: { name: string; slug: string; businessType: string; businessDescription: string }) =>
      api.post('/organization', data),
    getBySlug: (slug: string) => api.get(`/organization/${slug}`),
    getMyOrgs: () => api.get('/organization/my-orgs'),
    update: (slug: string, data: { name?: string; logo?: string }) => api.put(`/organization/${slug}`, data),
    uploadLogo: (slug: string, file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return api.post(`/settings/logo?slug=${slug}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    addMember: (slug: string, data: { email: string; role?: string }) =>
      api.post(`/organization/${slug}/members`, data),
    removeMember: (slug: string, userId: string) =>
      api.delete(`/organization/${slug}/members/${userId}`),
    updateMemberRole: (slug: string, userId: string, data: { role: string }) =>
      api.put(`/organization/${slug}/members/${userId}`, data),
  },

  // Feedback
  feedback: {
    submit: (
      slug: string,
      payload: { text: string; rating?: number; contextTags?: string[] } | string,
    ) =>
      api.post(
        `/feedback/${slug}`,
        typeof payload === 'string' ? { text: payload } : payload,
      ),
    getAll: (
      slug: string,
      params?: {
        page?: number;
        limit?: number;
        sentiment?: string;
        category?: string;
        urgency?: string;
        status?: string;
      },
    ) => api.get(`/feedback/${slug}`, { params }),
    getStats: (slug: string) => api.get(`/feedback/${slug}/stats`),
    getById: (slug: string, id: string) => api.get(`/feedback/${slug}/${id}`),
    updateStatus: (
      slug: string,
      id: string,
      data: { status?: string; ownerReply?: string | null; internalNote?: string | null },
    ) => api.patch(`/feedback/${slug}/${id}/status`, data),
    correct: (
      slug: string,
      id: string,
      data: {
        category?: string;
        sentiment?: string;
        urgency?: string;
        suggestedAction?: string;
        rootCause?: string;
      },
    ) => api.patch(`/feedback/${slug}/${id}/correct`, data),
  },

  // Analytics
  analytics: {
    getSentiment: (slug: string, days?: number) => api.get(`/analytics/${slug}/sentiment`, { params: { days } }),
    getCategories: (slug: string) => api.get(`/analytics/${slug}/categories`),
    getHeatmap: (slug: string) => api.get(`/analytics/${slug}/heatmap`),
    getIssues: (slug: string) => api.get(`/analytics/${slug}/issues`),
    getAlerts: (slug: string, days?: number) => api.get(`/analytics/${slug}/alerts`, { params: { days } }),
    getRecommendations: (slug: string) => api.get(`/analytics/${slug}/recommendations`),
  },

  // AI
  ai: {
    chat: (slug: string, message: string) => api.post(`/ai/${slug}/chat`, { message }),
  },

  // Payments
  payments: {
    createCheckout: (plan: 'basic' | 'pro') => api.post('/payments/checkout', { plan }),
    createPortal: () => api.post('/payments/portal'),
    verifySession: (sessionId: string) => api.get(`/payments/verify-session/${sessionId}`),
  },

  // Health (server mounts it at /health, outside /api)
  health: () => axios.get(`${import.meta.env.VITE_API_URL || ''}/health`),
};

export default api;