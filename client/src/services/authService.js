import api from './api';

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    // Normalize error message
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    console.log("register-error",errorMessage)
    throw new Error(errorMessage);
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Store access token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    
    return response.data;
  } catch (error) {
    // Normalize error message
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    throw new Error(errorMessage);
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('accessToken');
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    // Normalize error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
    throw new Error(errorMessage);
  }
};