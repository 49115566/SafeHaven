import AsyncStorage from '@react-native-async-storage/async-storage';
import { resourceHistoryService, ResourceHistoryEntry } from '../resourceHistoryService';
import { ResourceStatus } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('ResourceHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockHistoryEntry: ResourceHistoryEntry = {
    timestamp: '2025-01-01T10:00:00Z',
    resourceType: 'food',
    previousStatus: ResourceStatus.ADEQUATE,
    newStatus: ResourceStatus.LOW,
    updatedBy: 'John Doe'
  };

  describe('addHistoryEntry', () => {
    it('should add new entry to empty history', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockResolvedValue();

      await resourceHistoryService.addHistoryEntry(mockHistoryEntry);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'resourceHistory',
        JSON.stringify([mockHistoryEntry])
      );
    });

    it('should limit history to 50 entries', async () => {
      const existingHistory = Array(50).fill(null).map((_, i) => ({
        ...mockHistoryEntry,
        timestamp: `2025-01-01T${String(i).padStart(2, '0')}:00:00Z`
      }));
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingHistory));

      await resourceHistoryService.addHistoryEntry(mockHistoryEntry);

      const savedHistory = JSON.parse(mockAsyncStorage.setItem.mock.calls[0][1]);
      expect(savedHistory).toHaveLength(50);
      expect(savedHistory[0]).toEqual(mockHistoryEntry);
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await resourceHistoryService.addHistoryEntry(mockHistoryEntry);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await resourceHistoryService.getHistory();

      expect(result).toEqual([]);
    });

    it('should return parsed history', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockHistoryEntry]));

      const result = await resourceHistoryService.getHistory();

      expect(result).toEqual([mockHistoryEntry]);
    });
  });

  describe('getResourceHistory', () => {
    it('should filter history by resource type', async () => {
      const foodEntry = { ...mockHistoryEntry, resourceType: 'food' };
      const waterEntry = { ...mockHistoryEntry, resourceType: 'water' };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([foodEntry, waterEntry]));

      const result = await resourceHistoryService.getResourceHistory('food');

      expect(result).toEqual([foodEntry]);
    });
  });

  describe('clearHistory', () => {
    it('should remove history from storage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await resourceHistoryService.clearHistory();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('resourceHistory');
    });
  });
});