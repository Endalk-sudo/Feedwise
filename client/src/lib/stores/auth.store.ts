import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from 'better-auth';

interface ExtendedUser extends User {
  organization?: {
    id: string;
    slug: string;
    name: string;
    currentPlan: string;
    subscriptionStatus: string;
  };
}

interface ExtendedSession extends Session {
  user: ExtendedUser;
}

interface AuthState {
  session: ExtendedSession | null;
  user: ExtendedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: ExtendedSession | null) => void;
  setUser: (user: ExtendedUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setSession: (session) => set({
        session,
        user: session?.user || null,
        isAuthenticated: !!session,
        isLoading: false,
      }),

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({
        session: null,
        user: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);