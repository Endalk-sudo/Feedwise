import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authClient, type Session, type User } from '@/lib/auth-client';
export interface ActiveOrganization {
  id: string;
  slug: string;
  name: string;
  currentPlan: string | null;
}

interface AuthState {
  session: Session['session'] | null;
  user: User | null;
  activeOrganization: ActiveOrganization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  setActiveOrganization: (org: ActiveOrganization | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      activeOrganization: null,
      isLoading: true,
      isAuthenticated: false,

      setSession: (session) =>
        set({
          session: session?.session ?? null,
          user: session?.user ?? null,
          isAuthenticated: !!session,
          isLoading: false,
        }),

      setActiveOrganization: (activeOrganization) => set({ activeOrganization }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          session: null,
          user: null,
          activeOrganization: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      // v2: drop pre-2026-09 persisted state — activeOrganization from an
      // older session could belong to a different account, which made every
      // org-scoped request 403 after logging in with another user.
      version: 2,
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        activeOrganization: state.activeOrganization,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

/**
 * Sync the Better Auth session into the zustand store.
 * Mount once at the app root (dashboard layout) or in pages that need auth.
 */
export function useSyncSession() {
  const { data, isPending } = authClient.useSession();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (!isPending) {
      setSession(data);
    }
  }, [data, isPending, setSession]);

  return { session: data, isPending };
}

/** Slug for org-scoped queries: explicit org wins, else the active one. */
export function useOrgSlug(explicitSlug?: string): string {
  const activeOrganization = useAuthStore((state) => state.activeOrganization);
  return explicitSlug ?? activeOrganization?.slug ?? '';
}
