import { resourceHistoryService } from '../../services/resourceHistoryService';
import { ResourceStatus } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage with proper storage simulation
jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      storage = {};
      return Promise.resolve();
    }),
  };
});

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Enhanced Status Updates Integration', () => {
  beforeEach(async () => {
    await mockAsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Resource History Integration', () => {
    it('should track resource changes end-to-end', async () => {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        resourceType: 'food',
        previousStatus: ResourceStatus.ADEQUATE,
        newStatus: ResourceStatus.LOW,
        updatedBy: 'John Doe'
      };

      await resourceHistoryService.addHistoryEntry(historyEntry);
      const history = await resourceHistoryService.getHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(historyEntry);
    });

    it('should handle bulk updates with multiple history entries', async () => {
      const baseEntry = {
        timestamp: new Date().toISOString(),
        updatedBy: 'John Doe'
      };

      const entries = [
        { ...baseEntry, resourceType: 'food', previousStatus: ResourceStatus.ADEQUATE, newStatus: ResourceStatus.CRITICAL },
        { ...baseEntry, resourceType: 'water', previousStatus: ResourceStatus.LOW, newStatus: ResourceStatus.CRITICAL },
        { ...baseEntry, resourceType: 'medical', previousStatus: ResourceStatus.ADEQUATE, newStatus: ResourceStatus.CRITICAL },
        { ...baseEntry, resourceType: 'bedding', previousStatus: ResourceStatus.ADEQUATE, newStatus: ResourceStatus.CRITICAL }
      ];

      for (const entry of entries) {
        await resourceHistoryService.addHistoryEntry(entry);
      }

      const history = await resourceHistoryService.getHistory();
      expect(history).toHaveLength(4);
      
      const resourceTypes = history.map(h => h.resourceType);
      expect(resourceTypes).toContain('food');
      expect(resourceTypes).toContain('water');
      expect(resourceTypes).toContain('medical');
      expect(resourceTypes).toContain('bedding');
    });

    it('should respect 50-entry history limit', async () => {
      for (let i = 0; i < 55; i++) {
        await resourceHistoryService.addHistoryEntry({
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          resourceType: 'food',
          previousStatus: ResourceStatus.ADEQUATE,
          newStatus: ResourceStatus.LOW,
          updatedBy: `User ${i}`
        });
      }

      const history = await resourceHistoryService.getHistory();
      expect(history).toHaveLength(50);
      expect(history[0].updatedBy).toBe('User 54');
    });
  });

  describe('Urgent Needs Processing', () => {
    it('should parse comma-separated urgent needs correctly', () => {
      const urgentNeedsText = 'medical supplies, generators, blankets';
      const parsed = urgentNeedsText.split(',').map(need => need.trim()).filter(need => need);
      
      expect(parsed).toEqual(['medical supplies', 'generators', 'blankets']);
    });

    it('should handle empty urgent needs', () => {
      const urgentNeedsText = '';
      const parsed = urgentNeedsText.trim() ? urgentNeedsText.split(',').map(need => need.trim()).filter(need => need) : [];
      
      expect(parsed).toEqual([]);
    });
  });

  describe('Resource Status Cycling', () => {
    it('should cycle through statuses correctly', () => {
      const statusOrder = [
        ResourceStatus.ADEQUATE,
        ResourceStatus.LOW,
        ResourceStatus.CRITICAL,
        ResourceStatus.UNAVAILABLE
      ];

      let currentIndex = statusOrder.indexOf(ResourceStatus.ADEQUATE);
      let nextIndex = (currentIndex + 1) % statusOrder.length;
      expect(statusOrder[nextIndex]).toBe(ResourceStatus.LOW);

      currentIndex = statusOrder.indexOf(ResourceStatus.UNAVAILABLE);
      nextIndex = (currentIndex + 1) % statusOrder.length;
      expect(statusOrder[nextIndex]).toBe(ResourceStatus.ADEQUATE);
    });
  });
});