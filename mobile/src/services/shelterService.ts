import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShelterStatusUpdate, Shelter } from '../types';

const API_BASE_URL = 'http://localhost:3001'; // Update to deployed backend URL as needed

export const shelterService = {
  /**
   * Update shelter status
   */
  updateStatus: async (shelterId: string, statusUpdate: Omit<ShelterStatusUpdate, 'shelterId' | 'timestamp'>): Promise<Shelter> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
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

      return response.data.data;
    } catch (error: any) {
      console.error('Shelter status update error:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(error.response?.data?.error?.message || 'Failed to update shelter status');
    }
  },

  /**
   * Get shelter details
   */
  getShelter: async (shelterId: string): Promise<Shelter> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${API_BASE_URL}/shelters/${shelterId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Get shelter error:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch shelter data');
    }
  }
};