import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3001/auth'; // Update to deployed backend URL as needed

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials);
      const { user, token } = response.data;
      await AsyncStorage.setItem('authToken', token);
      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      const { user, token } = response.data;
      await AsyncStorage.setItem('authToken', token);
      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    return true;
  },

  getToken: async () => {
    return await AsyncStorage.getItem('authToken');
  }
};