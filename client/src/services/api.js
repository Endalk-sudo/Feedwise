import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
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
    
    // If error is due to expired access token and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("response interceptor is fired")
      try {
        // Try to refresh the token
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, {}, {
          withCredentials: true
        });
        
        const newAccessToken = response.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;