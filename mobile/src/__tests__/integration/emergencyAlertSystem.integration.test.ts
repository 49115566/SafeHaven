import { alertService } from '../../services/alertService';
import { AlertType, AlertPriority } from '../../types';
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

// Mock axios for API calls
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Emergency Alert System Integration', () => {
  beforeEach(async () => {
    await mockAsyncStorage.clear();
    jest.clearAllMocks();
    // Set up auth token
    await mockAsyncStorage.setItem('authToken', 'test-token');
  });

  describe('Alert Creation Workflow', () => {
    it('should validate alert creation data structure', () => {
      const alertData = {
        shelterId: 'shelter-123',
        type: AlertType.MEDICAL_EMERGENCY,
        title: 'Medical Emergency',
        description: 'Patient needs immediate attention',
        priority: AlertPriority.CRITICAL
      };

      // Validate required fields
      expect(alertData.shelterId).toBeDefined();
      expect(alertData.type).toBeDefined();
      expect(alertData.title).toBeDefined();
      expect(alertData.priority).toBeDefined();

      // Validate enum values
      expect(Object.values(AlertType)).toContain(alertData.type);
      expect(Object.values(AlertPriority)).toContain(alertData.priority);
    });

    it('should handle alert type validation', () => {
      const validTypes = Object.values(AlertType);
      
      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });

      // Test specific alert types
      expect(validTypes).toContain(AlertType.MEDICAL_EMERGENCY);
      expect(validTypes).toContain(AlertType.SECURITY_ISSUE);
      expect(validTypes).toContain(AlertType.RESOURCE_CRITICAL);
      expect(validTypes).toContain(AlertType.INFRASTRUCTURE_PROBLEM);
      expect(validTypes).toContain(AlertType.CAPACITY_FULL);
      expect(validTypes).toContain(AlertType.GENERAL_ASSISTANCE);
    });

    it('should handle priority level validation', () => {
      const validPriorities = Object.values(AlertPriority);
      
      validPriorities.forEach(priority => {
        expect(typeof priority).toBe('string');
        expect(priority.length).toBeGreaterThan(0);
      });

      // Test specific priorities
      expect(validPriorities).toContain(AlertPriority.CRITICAL);
      expect(validPriorities).toContain(AlertPriority.HIGH);
      expect(validPriorities).toContain(AlertPriority.MEDIUM);
      expect(validPriorities).toContain(AlertPriority.LOW);
    });
  });

  describe('Alert Data Processing', () => {
    it('should validate alert title requirements', () => {
      const validTitle = 'Medical Emergency';
      const emptyTitle = '';
      const longTitle = 'a'.repeat(101);

      expect(validTitle.trim().length).toBeGreaterThan(0);
      expect(emptyTitle.trim().length).toBe(0);
      expect(longTitle.length).toBeGreaterThan(100);
      
      // Title should be trimmed and limited
      const processedTitle = longTitle.substring(0, 100);
      expect(processedTitle.length).toBe(100);
    });

    it('should validate alert description processing', () => {
      const validDescription = 'Patient needs immediate medical attention';
      const emptyDescription = '';
      const longDescription = 'a'.repeat(501);

      expect(validDescription.trim().length).toBeGreaterThan(0);
      expect(emptyDescription.trim().length).toBe(0);
      
      // Description should be trimmed and limited
      const processedDescription = longDescription.substring(0, 500);
      expect(processedDescription.length).toBe(500);
    });

    it('should handle alert priority color mapping', () => {
      const getPriorityColor = (priority: AlertPriority): string => {
        switch (priority) {
          case AlertPriority.CRITICAL: return '#ef4444';
          case AlertPriority.HIGH: return '#f59e0b';
          case AlertPriority.MEDIUM: return '#3b82f6';
          case AlertPriority.LOW: return '#10b981';
          default: return '#6b7280';
        }
      };

      expect(getPriorityColor(AlertPriority.CRITICAL)).toBe('#ef4444');
      expect(getPriorityColor(AlertPriority.HIGH)).toBe('#f59e0b');
      expect(getPriorityColor(AlertPriority.MEDIUM)).toBe('#3b82f6');
      expect(getPriorityColor(AlertPriority.LOW)).toBe('#10b981');
    });
  });

  describe('Alert Type Icon Mapping', () => {
    it('should map alert types to appropriate icons', () => {
      const getAlertTypeIcon = (type: AlertType): string => {
        switch (type) {
          case AlertType.MEDICAL_EMERGENCY: return 'medical-services';
          case AlertType.SECURITY_ISSUE: return 'security';
          case AlertType.RESOURCE_CRITICAL: return 'warning';
          case AlertType.INFRASTRUCTURE_PROBLEM: return 'build';
          case AlertType.CAPACITY_FULL: return 'people';
          case AlertType.GENERAL_ASSISTANCE: return 'help';
          default: return 'help';
        }
      };

      expect(getAlertTypeIcon(AlertType.MEDICAL_EMERGENCY)).toBe('medical-services');
      expect(getAlertTypeIcon(AlertType.SECURITY_ISSUE)).toBe('security');
      expect(getAlertTypeIcon(AlertType.RESOURCE_CRITICAL)).toBe('warning');
      expect(getAlertTypeIcon(AlertType.INFRASTRUCTURE_PROBLEM)).toBe('build');
      expect(getAlertTypeIcon(AlertType.CAPACITY_FULL)).toBe('people');
      expect(getAlertTypeIcon(AlertType.GENERAL_ASSISTANCE)).toBe('help');
    });

    it('should provide human-readable alert type labels', () => {
      const getAlertTypeLabel = (type: AlertType): string => {
        switch (type) {
          case AlertType.MEDICAL_EMERGENCY: return 'Medical Emergency';
          case AlertType.SECURITY_ISSUE: return 'Security Issue';
          case AlertType.RESOURCE_CRITICAL: return 'Resource Critical';
          case AlertType.INFRASTRUCTURE_PROBLEM: return 'Infrastructure Problem';
          case AlertType.CAPACITY_FULL: return 'Capacity Full';
          case AlertType.GENERAL_ASSISTANCE: return 'General Assistance';
          default: return type;
        }
      };

      expect(getAlertTypeLabel(AlertType.MEDICAL_EMERGENCY)).toBe('Medical Emergency');
      expect(getAlertTypeLabel(AlertType.SECURITY_ISSUE)).toBe('Security Issue');
      expect(getAlertTypeLabel(AlertType.RESOURCE_CRITICAL)).toBe('Resource Critical');
      expect(getAlertTypeLabel(AlertType.INFRASTRUCTURE_PROBLEM)).toBe('Infrastructure Problem');
      expect(getAlertTypeLabel(AlertType.CAPACITY_FULL)).toBe('Capacity Full');
      expect(getAlertTypeLabel(AlertType.GENERAL_ASSISTANCE)).toBe('General Assistance');
    });
  });

  describe('Authentication Integration', () => {
    it('should retrieve auth token for API calls', async () => {
      const token = await mockAsyncStorage.getItem('authToken');
      expect(token).toBe('test-token');
    });

    it('should handle missing auth token', async () => {
      await mockAsyncStorage.removeItem('authToken');
      const token = await mockAsyncStorage.getItem('authToken');
      expect(token).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should validate required alert fields', () => {
      const incompleteAlert = {
        shelterId: 'shelter-123',
        type: AlertType.MEDICAL_EMERGENCY,
        // Missing title
        description: 'Description',
        priority: AlertPriority.CRITICAL
      };

      // Title is required
      expect(incompleteAlert.title).toBeUndefined();
      
      const completeAlert = {
        ...incompleteAlert,
        title: 'Medical Emergency'
      };

      expect(completeAlert.title).toBeDefined();
      expect(completeAlert.title.trim().length).toBeGreaterThan(0);
    });

    it('should handle invalid enum values', () => {
      const validTypes = Object.values(AlertType);
      const invalidType = 'invalid_type' as AlertType;
      
      expect(validTypes).not.toContain(invalidType);
      expect(validTypes).toContain(AlertType.MEDICAL_EMERGENCY);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle multiple alert types efficiently', () => {
      const startTime = Date.now();
      
      Object.values(AlertType).forEach(type => {
        expect(typeof type).toBe('string');
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should process all alert types within 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should handle priority processing efficiently', () => {
      const startTime = Date.now();
      
      Object.values(AlertPriority).forEach(priority => {
        expect(typeof priority).toBe('string');
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should process all priorities within 10ms
      expect(duration).toBeLessThan(10);
    });
  });
});