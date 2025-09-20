import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AlertType, AlertPriority } from '../types';

const API_BASE_URL = 'http://localhost:3001/alerts';

export interface CreateAlertRequest {
  shelterId: string;
  type: AlertType;
  title: string;
  description: string;
  priority: AlertPriority;
}

export const alertService = {
  createAlert: async (alertData: CreateAlertRequest): Promise<Alert> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(`${API_BASE_URL}`, alertData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.alert;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create alert');
    }
  },

  getAlerts: async (shelterId: string): Promise<Alert[]> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}?shelterId=${shelterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.alerts || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts');
    }
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.patch(`${API_BASE_URL}/${alertId}/acknowledge`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to acknowledge alert');
    }
  }
};