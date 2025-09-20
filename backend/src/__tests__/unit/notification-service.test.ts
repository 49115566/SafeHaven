import { NotificationService } from '../../services/notificationService';

// Simple mock without complex objects
jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => ({
    send: jest.fn()
  })),
  PublishCommand: jest.fn()
}));

describe('NotificationService - Lean Tests', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    process.env.ALERT_TOPIC_ARN = 'test-topic';
    notificationService = new NotificationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic initialization', () => {
    it('should create NotificationService instance', () => {
      expect(notificationService).toBeInstanceOf(NotificationService);
    });

    it('should have required methods', () => {
      expect(typeof notificationService.broadcastShelterUpdate).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables', () => {
      delete process.env.ALERT_TOPIC_ARN;
      expect(() => new NotificationService()).not.toThrow();
    });
  });
});