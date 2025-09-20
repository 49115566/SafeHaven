import { ShelterService } from '../../services/shelterService';

// Simple mock without complex objects
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn()
    }))
  }
}));

// Mock the types to avoid import issues
jest.mock('../../models/types', () => ({}));

describe('ShelterService - Lean Tests', () => {
  let ShelterService: any;
  let shelterService: any;

  beforeAll(async () => {
    // Dynamically import to avoid type issues
    const module = await import('../../services/shelterService');
    ShelterService = module.ShelterService;
  });

  beforeEach(() => {
    process.env.SHELTERS_TABLE = 'test-table';
    if (ShelterService) {
      shelterService = new ShelterService();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic initialization', () => {
    it('should create ShelterService instance', () => {
      expect(shelterService).toBeDefined();
      expect(shelterService.constructor.name).toBe('ShelterService');
    });

    it('should have required methods', () => {
      expect(typeof shelterService.createShelter).toBe('function');
      expect(typeof shelterService.getShelter).toBe('function');
      expect(typeof shelterService.getAllShelters).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables', () => {
      delete process.env.SHELTERS_TABLE;
      expect(() => new ShelterService()).not.toThrow();
    });
  });
});