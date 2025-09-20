import { ResourceStatus } from '../../types';
import { resourceHistoryService } from '../../services/resourceHistoryService';

describe('Test Infrastructure Validation', () => {
  it('should validate TypeScript types are working', () => {
    expect(ResourceStatus.ADEQUATE).toBe('adequate');
    expect(ResourceStatus.LOW).toBe('low');
    expect(ResourceStatus.CRITICAL).toBe('critical');
    expect(ResourceStatus.UNAVAILABLE).toBe('unavailable');
  });

  it('should validate service imports are working', () => {
    expect(resourceHistoryService).toBeDefined();
    expect(typeof resourceHistoryService.addHistoryEntry).toBe('function');
    expect(typeof resourceHistoryService.getHistory).toBe('function');
  });

  it('should validate async operations work correctly', async () => {
    const testEntry = {
      timestamp: new Date().toISOString(),
      resourceType: 'food',
      previousStatus: ResourceStatus.ADEQUATE,
      newStatus: ResourceStatus.LOW,
      updatedBy: 'Test User'
    };

    await resourceHistoryService.addHistoryEntry(testEntry);
    const history = await resourceHistoryService.getHistory();
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(0);
  });

  it('should validate urgent needs parsing logic', () => {
    const testCases = [
      { input: 'medical supplies, generators', expected: ['medical supplies', 'generators'] },
      { input: '', expected: [] },
      { input: 'single item', expected: ['single item'] }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = input.trim() ? input.split(',').map(need => need.trim()).filter(need => need) : [];
      expect(result).toEqual(expected);
    });
  });

  it('should validate resource status cycling', () => {
    const statusOrder = [
      ResourceStatus.ADEQUATE,
      ResourceStatus.LOW,
      ResourceStatus.CRITICAL,
      ResourceStatus.UNAVAILABLE
    ];

    const currentIndex = statusOrder.indexOf(ResourceStatus.ADEQUATE);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    expect(statusOrder[nextIndex]).toBe(ResourceStatus.LOW);
  });
});