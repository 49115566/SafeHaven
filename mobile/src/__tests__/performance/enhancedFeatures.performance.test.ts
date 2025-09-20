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

describe('Enhanced Features Performance Tests', () => {
  beforeEach(async () => {
    await mockAsyncStorage.clear();
  });

  describe('Resource History Performance', () => {
    it('should handle large history operations efficiently', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await resourceHistoryService.addHistoryEntry({
          timestamp: new Date(Date.now() + i).toISOString(),
          resourceType: 'food',
          previousStatus: ResourceStatus.ADEQUATE,
          newStatus: ResourceStatus.LOW,
          updatedBy: `User ${i}`
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000);
    });

    it('should retrieve history efficiently', async () => {
      for (let i = 0; i < 50; i++) {
        await resourceHistoryService.addHistoryEntry({
          timestamp: new Date(Date.now() + i).toISOString(),
          resourceType: 'food',
          previousStatus: ResourceStatus.ADEQUATE,
          newStatus: ResourceStatus.LOW,
          updatedBy: `User ${i}`
        });
      }

      const startTime = Date.now();
      const history = await resourceHistoryService.getHistory();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(history.length).toBe(50);
    });

    it('should maintain 50-entry limit for performance', async () => {
      for (let i = 0; i < 100; i++) {
        await resourceHistoryService.addHistoryEntry({
          timestamp: new Date(Date.now() + i).toISOString(),
          resourceType: 'food',
          previousStatus: ResourceStatus.ADEQUATE,
          newStatus: ResourceStatus.LOW,
          updatedBy: `User ${i}`
        });
      }

      const history = await resourceHistoryService.getHistory();
      expect(history.length).toBe(50);
    });
  });

  describe('Data Processing Performance', () => {
    it('should parse urgent needs efficiently', () => {
      const testData = 'medical supplies, generators, blankets, food, water';
      const startTime = Date.now();
      
      const parsed = testData.split(',').map(need => need.trim()).filter(need => need);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(10);
      expect(parsed).toEqual(['medical supplies', 'generators', 'blankets', 'food', 'water']);
    });
  });
});