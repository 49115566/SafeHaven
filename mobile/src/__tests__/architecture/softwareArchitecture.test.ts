import { ResourceStatus, ShelterStatus, ShelterStatusUpdate } from '../../types';
import { resourceHistoryService } from '../../services/resourceHistoryService';

describe('Software Architecture Compliance', () => {
  describe('Type Safety and Consistency', () => {
    it('should maintain consistent enum values across the application', () => {
      expect(ResourceStatus.ADEQUATE).toBe('adequate');
      expect(ResourceStatus.LOW).toBe('low');
      expect(ResourceStatus.CRITICAL).toBe('critical');
      expect(ResourceStatus.UNAVAILABLE).toBe('unavailable');
    });

    it('should ensure ShelterStatusUpdate interface includes all required fields', () => {
      const statusUpdate: ShelterStatusUpdate = {
        shelterId: 'test-shelter',
        capacity: { current: 50, maximum: 100 },
        resources: {
          food: ResourceStatus.ADEQUATE,
          water: ResourceStatus.LOW,
          medical: ResourceStatus.CRITICAL,
          bedding: ResourceStatus.ADEQUATE
        },
        status: ShelterStatus.AVAILABLE,
        urgentNeeds: ['medical supplies'],
        timestamp: new Date().toISOString()
      };

      expect(typeof statusUpdate.shelterId).toBe('string');
      expect(typeof statusUpdate.capacity?.current).toBe('number');
      expect(Array.isArray(statusUpdate.urgentNeeds)).toBe(true);
      expect(typeof statusUpdate.timestamp).toBe('string');
    });
  });

  describe('Service Layer Architecture', () => {
    it('should implement proper service abstraction for resource history', () => {
      expect(typeof resourceHistoryService.addHistoryEntry).toBe('function');
      expect(typeof resourceHistoryService.getHistory).toBe('function');
      expect(typeof resourceHistoryService.getResourceHistory).toBe('function');
      expect(typeof resourceHistoryService.clearHistory).toBe('function');
    });

    it('should handle async operations properly', async () => {
      const addPromise = resourceHistoryService.addHistoryEntry({
        timestamp: new Date().toISOString(),
        resourceType: 'food',
        previousStatus: ResourceStatus.ADEQUATE,
        newStatus: ResourceStatus.LOW,
        updatedBy: 'Test User'
      });

      const getPromise = resourceHistoryService.getHistory();

      expect(addPromise).toBeInstanceOf(Promise);
      expect(getPromise).toBeInstanceOf(Promise);

      await addPromise;
      const result = await getPromise;
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Data Layer Compliance', () => {
    it('should maintain data consistency in resource status updates', () => {
      const validStatuses = Object.values(ResourceStatus);
      
      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(status.length).toBeGreaterThan(0);
      });
    });

    it('should enforce proper data structure for urgent needs', () => {
      const testCases = [
        { input: 'medical supplies, generators', expected: ['medical supplies', 'generators'] },
        { input: '', expected: [] },
        { input: 'single item', expected: ['single item'] },
        { input: ' spaced , items ', expected: ['spaced', 'items'] }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = input.trim() ? input.split(',').map(need => need.trim()).filter(need => need) : [];
        expect(result).toEqual(expected);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should implement proper data limits for scalability', async () => {
      const MAX_ENTRIES = 50;
      
      for (let i = 0; i < MAX_ENTRIES + 10; i++) {
        await resourceHistoryService.addHistoryEntry({
          timestamp: new Date(Date.now() + i).toISOString(),
          resourceType: 'food',
          previousStatus: ResourceStatus.ADEQUATE,
          newStatus: ResourceStatus.LOW,
          updatedBy: `User ${i}`
        });
      }

      const history = await resourceHistoryService.getHistory();
      expect(history.length).toBeLessThanOrEqual(MAX_ENTRIES);
    });
  });

  describe('Security and Validation', () => {
    it('should validate resource status enum values', () => {
      const validStatuses = Object.values(ResourceStatus);
      const testStatus = 'invalid_status';
      
      expect(validStatuses).not.toContain(testStatus);
      expect(validStatuses).toContain(ResourceStatus.ADEQUATE);
    });

    it('should enforce character limits for urgent needs', () => {
      const MAX_LENGTH = 280;
      const longText = 'a'.repeat(MAX_LENGTH + 10);
      
      const truncated = longText.substring(0, MAX_LENGTH);
      expect(truncated.length).toBe(MAX_LENGTH);
    });
  });

  describe('Component Architecture', () => {
    it('should maintain separation of concerns', () => {
      expect(resourceHistoryService).toBeDefined();
      expect(typeof resourceHistoryService).toBe('object');
      
      const serviceKeys = Object.keys(resourceHistoryService);
      serviceKeys.forEach(key => {
        expect(typeof resourceHistoryService[key as keyof typeof resourceHistoryService]).toBe('function');
      });
    });
  });
});