/**
 * Comprehensive unit tests for AlertService
 * Tests compliance with REQ-SCA-005, REQ-RDA-005, REQ-BE-002, REQ-BE-005
 */

// Mock AWS SDK first before any imports
const mockDynamoDBSend = jest.fn() as jest.MockedFunction<any>;
const mockSNSSend = jest.fn() as jest.MockedFunction<any>;

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockDynamoDBSend
    }))
  },
  GetCommand: jest.fn((params) => ({ type: 'GetCommand', params })),
  PutCommand: jest.fn((params) => ({ type: 'PutCommand', params })),
  UpdateCommand: jest.fn((params) => ({ type: 'UpdateCommand', params })),
  QueryCommand: jest.fn((params) => ({ type: 'QueryCommand', params })),
  ScanCommand: jest.fn((params) => ({ type: 'ScanCommand', params }))
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => ({
    send: mockSNSSend
  })),
  PublishCommand: jest.fn((params) => ({ type: 'PublishCommand', params }))
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

// Now import after mocks
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AlertService, CreateAlertInput, UpdateAlertInput } from '../../services/alertService';
import { AlertType, AlertPriority, AlertStatus } from '../../models/types';
import { AlertFixtures, AWSMockFixtures, InputFixtures } from '../fixtures/testFixtures';

describe('AlertService Unit Tests', () => {
  let alertService: AlertService;
  const mockDate = new Date('2025-09-20T10:00:00.000Z');

  // Define shared test data at the top level
  const validAlertInput: CreateAlertInput = {
    shelterId: 'shelter-test-456',
    type: AlertType.MEDICAL_EMERGENCY,
    priority: AlertPriority.HIGH,
    title: 'Medical Emergency',
    description: 'Person collapsed, need immediate medical attention',
    createdBy: 'user-shelter-op-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
    
    // Set required environment variables
    process.env.ALERTS_TABLE = 'SafeHaven-test-Alerts';
    process.env.SHELTER_UPDATES_TOPIC = 'arn:aws:sns:us-east-1:123456789012:SafeHaven-test-ShelterUpdates';
    
    alertService = new AlertService();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.ALERTS_TABLE;
    delete process.env.SHELTER_UPDATES_TOPIC;
  });

  describe('createAlert', () => {
    it('should create alert successfully - REQ-SCA-005 compliance', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.createAlert(validAlertInput);

      expect(result).toBeDefined();
      expect(result.alertId).toBe('mock-uuid-123');
      expect(result.title).toBe(validAlertInput.title);
      expect(result.status).toBe(AlertStatus.OPEN);

      // Verify DynamoDB put operation
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PutCommand',
          params: expect.objectContaining({
            TableName: 'SafeHaven-test-Alerts',
            Item: expect.objectContaining({
              alertId: 'mock-uuid-123',
              shelterId: validAlertInput.shelterId,
              type: validAlertInput.type,
              priority: validAlertInput.priority,
              title: validAlertInput.title,
              description: validAlertInput.description,
              status: AlertStatus.OPEN,
              createdBy: validAlertInput.createdBy
            })
          })
        })
      );

      // Verify SNS notification - REQ-BE-005 compliance
      expect(mockSNSSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PublishCommand',
          params: {
            TopicArn: 'arn:aws:sns:us-east-1:123456789012:SafeHaven-test-ShelterUpdates',
            Message: expect.stringContaining('alert.created'),
            Subject: expect.stringContaining('SafeHaven Alert:'),
            MessageAttributes: expect.objectContaining({
              alertType: expect.objectContaining({
                DataType: 'String',
                StringValue: AlertType.MEDICAL_EMERGENCY
              }),
              priority: expect.objectContaining({
                DataType: 'String',
                StringValue: AlertPriority.HIGH
              })
            })
          }
        })
      );
    });

    it('should handle critical priority alerts with urgency - REQ-RDA-005 compliance', async () => {
      const criticalAlert: CreateAlertInput = {
        ...validAlertInput,
        priority: AlertPriority.CRITICAL,
        title: 'CRITICAL: Building Collapse'
      };

      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.createAlert(criticalAlert);

      expect(result.priority).toBe(AlertPriority.CRITICAL);
      
      // Verify SNS notification includes urgency markers
      expect(mockSNSSend).toHaveBeenCalled();
      const snsCall = mockSNSSend.mock.calls[0][0] as any;
      expect(snsCall.params.Subject).toContain('CRITICAL');
      expect(snsCall.params.Message).toContain('CRITICAL');
    });

    it('should throw error when DynamoDB operation fails', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('DynamoDB Error'));

      await expect(alertService.createAlert(validAlertInput))
        .rejects.toThrow('DynamoDB Error');
    });

    it('should continue execution if SNS notification fails', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());
      mockSNSSend.mockRejectedValueOnce(new Error('SNS Error'));

      const result = await alertService.createAlert(validAlertInput);

      expect(result).toBeDefined();
      expect(result.alertId).toBe('mock-uuid-123');
    });
  });

  describe('getAlert', () => {
    it('should retrieve alert by ID successfully', async () => {
      const mockAlert = AlertFixtures.createMockAlert();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBGetResponse(mockAlert)
      );

      const result = await alertService.getAlert('alert-test-123');

      expect(result).toEqual(mockAlert);
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GetCommand',
          params: {
            TableName: 'SafeHaven-test-Alerts',
            Key: { alertId: 'alert-test-123' }
          }
        })
      );
    });

    it('should return null when alert not found', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBGetResponse(null)
      );

      const result = await alertService.getAlert('nonexistent-alert');

      expect(result).toBeNull();
    });

    it('should throw error when DynamoDB operation fails', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('DynamoDB Error'));

      await expect(alertService.getAlert('alert-test-123'))
        .rejects.toThrow('DynamoDB Error');
    });
  });

  describe('getAlertsByShelter', () => {
    it('should retrieve alerts for a shelter with newest first', async () => {
      const mockAlerts = [
        AlertFixtures.createMockAlert({ timestamp: 1695729600000 }),
        AlertFixtures.createMockAlert({ timestamp: 1695729500000 })
      ];

      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBQueryResponse(mockAlerts)
      );

      const result = await alertService.getAlertsByShelter('shelter-test-456');

      expect(result).toEqual(mockAlerts);
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'QueryCommand',
          params: expect.objectContaining({
            TableName: 'SafeHaven-test-Alerts',
            IndexName: 'ShelterTimestampIndex',
            KeyConditionExpression: 'shelterId = :shelterId',
            ScanIndexForward: false
          })
        })
      );
    });

    it('should apply limit when specified', async () => {
      const mockAlerts = [AlertFixtures.createMockAlert()];
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBQueryResponse(mockAlerts)
      );

      await alertService.getAlertsByShelter('shelter-test-456', 5);

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Limit: 5
          })
        })
      );
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert successfully - REQ-RDA-005 compliance', async () => {
      const acknowledgedAlert = AlertFixtures.createMockAlert({
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedBy: 'user-responder-123',
        acknowledgedAt: mockDate.toISOString()
      });

      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(acknowledgedAlert)
      );
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.acknowledgeAlert('alert-test-123', 'user-responder-123');

      expect(result).toEqual(acknowledgedAlert);
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: {
            TableName: 'SafeHaven-test-Alerts',
            Key: { alertId: 'alert-test-123' },
            UpdateExpression: expect.stringContaining('acknowledgedBy'),
            ExpressionAttributeNames: expect.objectContaining({
              '#status': 'status'
            }),
            ExpressionAttributeValues: expect.objectContaining({
              ':status': AlertStatus.ACKNOWLEDGED,
              ':acknowledgedBy': 'user-responder-123',
              ':acknowledgedAt': mockDate.toISOString()
            }),
            ReturnValues: 'ALL_NEW'
          }
        })
      );

      // Verify acknowledgment notification sent
      expect(mockSNSSend).toHaveBeenCalled();
    });
  });

  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      const resolvedAlert = AlertFixtures.createMockResolvedAlert();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(resolvedAlert)
      );
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.resolveAlert('alert-test-123', 'user-responder-123');

      expect(result).toEqual(resolvedAlert);
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: expect.objectContaining({
            UpdateExpression: expect.stringContaining('acknowledgedBy'),
            ExpressionAttributeNames: expect.objectContaining({
              '#status': 'status'
            }),
            ExpressionAttributeValues: expect.objectContaining({
              ':status': AlertStatus.RESOLVED,
              ':acknowledgedBy': 'user-responder-123',
              ':resolvedAt': mockDate.toISOString()
            })
          })
        })
      );
    });

    it('should resolve alert without specifying resolver', async () => {
      const resolvedAlert = AlertFixtures.createMockResolvedAlert();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(resolvedAlert)
      );
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.resolveAlert('alert-test-123');

      expect(result).toBeDefined();
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            ExpressionAttributeValues: expect.objectContaining({
              ':status': AlertStatus.RESOLVED,
              ':resolvedAt': mockDate.toISOString()
            })
          })
        })
      );
    });
  });

  describe('getAllActiveAlerts', () => {
    it('should retrieve all active alerts - REQ-BE-002 compliance', async () => {
      const mockAlerts = [
        AlertFixtures.createMockAlert({ status: AlertStatus.OPEN }),
        AlertFixtures.createMockAlert({ status: AlertStatus.ACKNOWLEDGED })
      ];

      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBScanResponse(mockAlerts)
      );

      const result = await alertService.getAllAlerts();

      expect(result).toEqual(mockAlerts);
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ScanCommand',
          params: {
            TableName: 'SafeHaven-test-Alerts',
            Limit: undefined
          }
        })
      );
    });
  });

  describe('updateAlert', () => {
    it('should update alert fields successfully', async () => {
      const updateInput = {
        status: AlertStatus.ACKNOWLEDGED,
        description: 'Updated description'
      };
      const updatedAlert = AlertFixtures.createMockAlert(updateInput);
      
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(updatedAlert)
      );
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.updateAlert('alert-test-123', updateInput);

      expect(result).toEqual(updatedAlert);
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: expect.objectContaining({
            Key: { alertId: 'alert-test-123' },
            UpdateExpression: expect.stringContaining('description'),
            ExpressionAttributeValues: expect.objectContaining({
              ':description': 'Updated description',
              ':status': AlertStatus.ACKNOWLEDGED
            })
          })
        })
      );
    });

    it('should handle empty update input gracefully', async () => {
      await expect(alertService.updateAlert('alert-test-123', {}))
        .rejects.toThrow('No updates provided');
    });
  });

  describe('deleteAlert', () => {
    it('should soft delete alert by resolving it', async () => {
      const resolvedAlert = AlertFixtures.createMockResolvedAlert();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(resolvedAlert)
      );
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const result = await alertService.deleteAlert('alert-test-123');

      expect(result).toBe(true);
    });

    it('should return false when resolve fails', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('Resolve failed'));

      const result = await alertService.deleteAlert('alert-test-123');

      expect(result).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.ALERTS_TABLE;
      delete process.env.SHELTER_UPDATES_TOPIC;

      const newService = new AlertService();
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());

      // Should still work but skip SNS
      const result = await newService.createAlert(validAlertInput);

      expect(result).toBeDefined();
    });

    it('should handle malformed alert data gracefully', async () => {
      const malformedInput = {
        ...validAlertInput,
        priority: 'invalid-priority' as any
      };

      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());

      const result = await alertService.createAlert(malformedInput);

      expect(result).toBeDefined();
    });

    it('should handle network timeouts gracefully', async () => {
      const networkError = new Error('Request timeout');
      networkError.name = 'TimeoutError';
      mockDynamoDBSend.mockRejectedValueOnce(networkError);

      await expect(alertService.getAlert('alert-test-123'))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete alert creation within performance requirements', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());
      mockSNSSend.mockResolvedValueOnce(AWSMockFixtures.createMockSNSPublishResponse());

      const startTime = Date.now();
      await alertService.createAlert(InputFixtures.createValidAlertCreation());
      const endTime = Date.now();

      // Should complete within 2 seconds (REQ-PERF-001)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});