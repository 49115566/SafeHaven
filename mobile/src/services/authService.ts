import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkError, AuthenticationError, ValidationError, withRetry } from '../utils/errorHandler';

const API_BASE_URL = 'http://localhost:3001/auth'; // Update to deployed backend URL as needed

// Configure axios defaults
axios.defaults.timeout = 10000;

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return withRetry(async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/login`, credentials);
        
        if (!response.data?.success) {
          throw new AuthenticationError(response.data?.error?.message || 'Login failed');
        }
        
        const { user, token } = response.data.data;
        await AsyncStorage.setItem('authToken', token);
        return { user, token };
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError('Unable to connect to server');
        }
        
        if (error.response?.status === 401) {
          throw new AuthenticationError(error.response.data?.error?.message || 'Invalid credentials');
        }
        
        if (error.response?.status === 400) {
          throw new ValidationError(error.response.data?.error?.message || 'Invalid input', error.response.data?.error?.details);
        }
        
        if (error.response?.status >= 500) {
          throw new NetworkError('Server error. Please try again later.');
        }
        
        throw error;
      }
    }, 2, 1000, { action: 'login', timestamp: new Date().toISOString() });
  },

  register: async (userData: any) => {
    return withRetry(async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/register`, userData);
        
        if (!response.data?.success) {
          throw new ValidationError(response.data?.error?.message || 'Registration failed', response.data?.error?.details);
        }
        
        const { user, token } = response.data.data;
        await AsyncStorage.setItem('authToken', token);
        return { user, token };
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError('Unable to connect to server');
        }
        
        if (error.response?.status === 400) {
          throw new ValidationError(error.response.data?.error?.message || 'Invalid registration data', error.response.data?.error?.details);
        }
        
        if (error.response?.status === 409) {
          throw new ValidationError('Email already exists');
        }
        
        if (error.response?.status >= 500) {
          throw new NetworkError('Server error. Please try again later.');
        }
        
        throw error;
      }
    }, 2, 1000, { action: 'register', timestamp: new Date().toISOString() });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      return true;
    } catch (error) {
      console.warn('Failed to clear auth token:', error);
      return true; // Don't fail logout on storage error
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  },

  verifyToken: async (token: string) => {
    return withRetry(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data?.success) {
          throw new AuthenticationError('Token verification failed');
        }
        
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new AuthenticationError('Token expired or invalid');
        }
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError('Unable to connect to server');
        }
        
        throw error;
      }
    }, 2, 1000, { action: 'verifyToken', timestamp: new Date().toISOString() });
  }
};