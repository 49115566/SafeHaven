import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResourceStatus } from '../types';

export interface ResourceHistoryEntry {
  timestamp: string;
  resourceType: string;
  previousStatus: ResourceStatus;
  newStatus: ResourceStatus;
  updatedBy: string;
}

const RESOURCE_HISTORY_KEY = 'resourceHistory';
const MAX_HISTORY_ENTRIES = 50;

export const resourceHistoryService = {
  /**
   * Add a resource status change to history
   */
  addHistoryEntry: async (entry: ResourceHistoryEntry): Promise<void> => {
    try {
      const existingHistory = await resourceHistoryService.getHistory();
      const newHistory = [entry, ...existingHistory].slice(0, MAX_HISTORY_ENTRIES);
      await AsyncStorage.setItem(RESOURCE_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to add resource history entry:', error);
    }
  },

  /**
   * Get resource history
   */
  getHistory: async (): Promise<ResourceHistoryEntry[]> => {
    try {
      const stored = await AsyncStorage.getItem(RESOURCE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get resource history:', error);
      return [];
    }
  },

  /**
   * Get history for specific resource type
   */
  getResourceHistory: async (resourceType: string): Promise<ResourceHistoryEntry[]> => {
    try {
      const history = await resourceHistoryService.getHistory();
      return history.filter(entry => entry.resourceType === resourceType);
    } catch (error) {
      console.error('Failed to get resource history:', error);
      return [];
    }
  },

  /**
   * Clear all history
   */
  clearHistory: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(RESOURCE_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear resource history:', error);
    }
  }
};