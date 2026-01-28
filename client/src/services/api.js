import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Use relative path to leverage Vite proxy in development
  withCredentials: true // Important for cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // CRITICAL FIX: Don't attempt to refresh token for auth endpoints or logout
    // This prevents the infinite loop/refresh when login fails with 401
    if (originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/logout')) {
      return Promise.reject(error);
    }
    
    // If error is due to expired access token and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, 
          {}, 
          { withCredentials: true }
        );
        
        const newAccessToken = response.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear storage
        localStorage.removeItem('accessToken');
        
        // Only redirect if not already on login page to avoid infinite loops
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;