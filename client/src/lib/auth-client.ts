import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client for frontend
 * Handles all authentication operations
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  fetchOptions: {
    credentials: 'include',
  },
});

// Export commonly used methods (only what the client actually provides)
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  deleteUser,
  revokeSession,
} = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];