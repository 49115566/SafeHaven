import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShelterStatusUpdate } from '../types';

const PENDING_UPDATES_KEY = 'pendingStatusUpdates';
const LAST_SYNC_KEY = 'lastSyncTimestamp';

export interface PendingUpdate {
  id: string;
  update: ShelterStatusUpdate;
  retryCount: number;
  createdAt: string;
}

export const offlineService = {
  /**
   * Check if device is online by attempting a simple network request
   */
  isOnline: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  /**
   * Add update to offline queue
   */
  queueUpdate: async (update: ShelterStatusUpdate): Promise<void> => {
    try {
      const existingUpdates = await offlineService.getPendingUpdates();
      
      const pendingUpdate: PendingUpdate = {
        id: `${update.shelterId}_${Date.now()}`,
        update,
        retryCount: 0,
        createdAt: new Date().toISOString()
      };

      const updatedQueue = [...existingUpdates, pendingUpdate];
      await AsyncStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Failed to queue update:', error);
    }
  },

  /**
   * Get all pending updates
   */
  getPendingUpdates: async (): Promise<PendingUpdate[]> => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_UPDATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get pending updates:', error);
      return [];
    }
  },

  /**
   * Remove update from queue
   */
  removeUpdate: async (updateId: string): Promise<void> => {
    try {
      const existingUpdates = await offlineService.getPendingUpdates();
      const filteredUpdates = existingUpdates.filter(u => u.id !== updateId);
      await AsyncStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(filteredUpdates));
    } catch (error) {
      console.error('Failed to remove update:', error);
    }
  },

  /**
   * Increment retry count for a failed update
   */
  incrementRetryCount: async (updateId: string): Promise<void> => {
    try {
      const existingUpdates = await offlineService.getPendingUpdates();
      const updatedQueue = existingUpdates.map(update => 
        update.id === updateId 
          ? { ...update, retryCount: update.retryCount + 1 }
          : update
      );
      await AsyncStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Failed to increment retry count:', error);
    }
  },

  /**
   * Clear all pending updates (for successful sync)
   */
  clearPendingUpdates: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(PENDING_UPDATES_KEY);
    } catch (error) {
      console.error('Failed to clear pending updates:', error);
    }
  },

  /**
   * Update last sync timestamp
   */
  updateLastSync: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update last sync:', error);
    }
  },

  /**
   * Get last sync timestamp
   */
  getLastSync: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch (error) {
      console.error('Failed to get last sync:', error);
      return null;
    }
  }
};