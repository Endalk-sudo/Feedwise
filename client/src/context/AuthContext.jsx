import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as loginUser, logout as logoutUser, getProfile, register as registerUser } from '../services/authService.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  /* State Values */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial app load
  const [isSubmitting, setIsSubmitting] = useState(false); // Form submission status
  const [serverError, setServerError] = useState(null); // Global error message
  const [validationErrors, setValidationErrors] = useState({}); // Field-specific errors

  // Derived state
  const isAuthenticated = !!user;

  // Check if user is logged in on initial load
  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getProfile();
      setUser(response.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Utility to parse errors from backend
  const handleAuthError = (error) => {
    const responseData = error.response?.data;

    // 1. Validation Errors (409 Conflict, 400 Bad Request with errors array)
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      const fieldErrors = {};
      responseData.errors.forEach(err => {
        fieldErrors[err.field] = err.message;
      });
      setValidationErrors(fieldErrors);
    }

    // 2. Global Server Error (Message string)
    const globalMessage = responseData?.message || error.message || 'An unexpected error occurred';
    setServerError(globalMessage);

    throw new Error(globalMessage);
  };

  const login = async (credentials) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setValidationErrors({});

      const response = await loginUser(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setValidationErrors({});

      const response = await registerUser(userData);

      // Auto-login logic
      if (response.accessToken && response.user) {
        localStorage.setItem('accessToken', response.accessToken);
        setUser(response.user);
      }

      return response;
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      setValidationErrors({});

      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw on logout, just cleanup locally
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      setIsSubmitting(false);
    }
  };

  const clearError = useCallback(() => {
    setServerError(null);
    setValidationErrors({});
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    isSubmitting,
    serverError,
    validationErrors,
    login,
    register,
    logout,
    clearError,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };