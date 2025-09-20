import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShelterStatusUpdate, Shelter } from '../types';
import { NetworkError, AuthenticationError, ValidationError, withRetry, OfflineError } from '../utils/errorHandler';
import { validateShelterStatusUpdate } from '../utils/validation';

const API_BASE_URL = 'http://localhost:3001'; // Update to deployed backend URL as needed

// Configure axios defaults
axios.defaults.timeout = 15000;

export const shelterService = {
  /**
   * Update shelter status
   */
  updateStatus: async (shelterId: string, statusUpdate: Omit<ShelterStatusUpdate, 'shelterId' | 'timestamp'>): Promise<Shelter> => {
    // Validate input
    const validation = validateShelterStatusUpdate({ ...statusUpdate, shelterId });
    if (!validation.isValid) {
      throw new ValidationError('Invalid shelter status update', validation.errors);
    }

    return withRetry(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new AuthenticationError('No authentication token found');
        }

        const payload: ShelterStatusUpdate = {
          ...statusUpdate,
          shelterId,
          timestamp: new Date().toISOString()
        };

        const response = await axios.put(
          `${API_BASE_URL}/shelters/${shelterId}/status`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.error?.message || 'Update failed');
        }

        return response.data.data;
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError('Unable to connect to server');
        }
        
        if (error.code === 'ECONNABORTED') {
          throw new NetworkError('Request timeout. Please try again.');
        }
        
        if (!navigator.onLine) {
          throw new OfflineError('No internet connection. Update will be saved when online.');
        }
        
        if (error.response?.status === 401) {
          throw new AuthenticationError('Authentication failed. Please log in again.');
        }
        
        if (error.response?.status === 403) {
          throw new AuthenticationError('You do not have permission to update this shelter.');
        }
        
        if (error.response?.status === 404) {
          throw new ValidationError('Shelter not found');
        }
        
        if (error.response?.status === 400) {
          throw new ValidationError(error.response.data?.error?.message || 'Invalid update data', error.response.data?.error?.details);
        }
        
        if (error.response?.status >= 500) {
          throw new NetworkError('Server error. Please try again later.');
        }
        
        throw error;
      }
    }, 3, 2000, { action: 'updateShelterStatus', shelterId, timestamp: new Date().toISOString() });
  },

  /**
   * Get shelter details
   */
  getShelter: async (shelterId: string): Promise<Shelter> => {
    if (!shelterId || typeof shelterId !== 'string') {
      throw new ValidationError('Valid shelter ID is required');
    }

    return withRetry(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new AuthenticationError('No authentication token found');
        }

        const response = await axios.get(
          `${API_BASE_URL}/shelters/${shelterId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.error?.message || 'Failed to fetch shelter');
        }

        return response.data.data;
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError('Unable to connect to server');
        }
        
        if (error.code === 'ECONNABORTED') {
          throw new NetworkError('Request timeout. Please try again.');
        }
        
        if (error.response?.status === 401) {
          throw new AuthenticationError('Authentication failed. Please log in again.');
        }
        
        if (error.response?.status === 404) {
          throw new ValidationError('Shelter not found');
        }
        
        if (error.response?.status >= 500) {
          throw new NetworkError('Server error. Please try again later.');
        }
        
        throw error;
      }
    }, 3, 1000, { action: 'getShelter', shelterId, timestamp: new Date().toISOString() });
  },

  /**
   * Get all shelters (for responders)
   */
  getAllShelters: async (): Promise<Shelter[]> => {
    return withRetry(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new AuthenticationError('No authentication token found');
        }

        const response = await axios.get(
          `${API_BASE_URL}/shelters`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.error?.message || 'Failed to fetch shelters');
        }

        return response.data.data || [];
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new NetworkError('Unable to connect to server');
        }
        
        if (error.response?.status === 401) {
          throw new AuthenticationError('Authentication failed. Please log in again.');
        }
        
        if (error.response?.status >= 500) {
          throw new NetworkError('Server error. Please try again later.');
        }
        
        throw error;
      }
    }, 2, 1000, { action: 'getAllShelters', timestamp: new Date().toISOString() });
  }
};