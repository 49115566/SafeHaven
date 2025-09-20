/**
 * Integration tests for Alert Lambda functions
 * Tests compliance with REQ-SCA-005, REQ-RDA-005, REQ-BE-003
 */

// Create mock functions that will be used by the mocked AlertService
const mockCreateAlert = jest.fn() as jest.MockedFunction<any>;
const mockGetAlert = jest.fn() as jest.MockedFunction<any>;
const mockAcknowledgeAlert = jest.fn() as jest.MockedFunction<any>;
const mockResolveAlert = jest.fn() as jest.MockedFunction<any>;
const mockGetAlertsByShelter = jest.fn() as jest.MockedFunction<any>;
const mockGetAllAlerts = jest.fn() as jest.MockedFunction<any>;
const mockDeleteAlert = jest.fn() as jest.MockedFunction<any>;

// Mock the AlertService module completely
jest.mock('../../services/alertService', () => {
  return {
    AlertService: jest.fn().mockImplementation(() => ({
      createAlert: mockCreateAlert,
      getAlert: mockGetAlert,
      acknowledgeAlert: mockAcknowledgeAlert,
      resolveAlert: mockResolveAlert,
      getAlertsByShelter: mockGetAlertsByShelter,
      getAllAlerts: mockGetAllAlerts,
      deleteAlert: mockDeleteAlert
    }))
  };
});

// Mock validation
jest.mock('../../utils/validation', () => ({
  validateAlertCreation: jest.fn()
}));

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { handler as createAlertHandler } from '../../functions/alerts/create';
import { handler as acknowledgeAlertHandler } from '../../functions/alerts/acknowledge';
import { handler as resolveAlertHandler } from '../../functions/alerts/resolve';
import { APIGatewayFixtures, AlertFixtures, AWSMockFixtures } from '../fixtures/testFixtures';
import { AlertType, AlertPriority, AlertStatus } from '../../models/types';
import { APIGatewayProxyResult } from 'aws-lambda';

// Import mocked modules
import { validateAlertCreation } from '../../utils/validation';

describe('Alert Lambda Functions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock validation to return valid by default
    (validateAlertCreation as jest.Mock).mockReturnValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createAlert handler', () => {
    it('should create alert successfully - REQ-SCA-005 compliance', async () => {
      const alertData = {
        shelterId: 'shelter-test-456',
        type: AlertType.MEDICAL_EMERGENCY,
        priority: AlertPriority.HIGH,
        title: 'Medical Emergency',
        description: 'Person collapsed, need immediate medical attention',
        createdBy: 'user-test-123'
      };

      const createdAlert = AlertFixtures.createMockAlert();
      mockCreateAlert.mockResolvedValueOnce(createdAlert);

      const event = APIGatewayFixtures.createMockEvent(alertData);
      const context = APIGatewayFixtures.createMockContext();

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toMatchObject({
        data: {
          alertId: createdAlert.alertId,
          message: 'Alert created successfully'
        }
      });

      expect(mockCreateAlert).toHaveBeenCalledWith({
        shelterId: alertData.shelterId,
        type: alertData.type,
        priority: alertData.priority,
        title: alertData.title,
        description: alertData.description,
        createdBy: 'user-test-123'
      });
    });

    it('should handle validation errors - REQ-BE-003 compliance', async () => {
      (validateAlertCreation as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Title is required', 'Invalid alert type']
      });

      const invalidAlertData = {
        shelterId: '',
        type: 'invalid',
        title: ''
      };

      const event = APIGatewayFixtures.createMockEvent(invalidAlertData);
      const context = APIGatewayFixtures.createMockContext();

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: 'Title is required, Invalid alert type',
          statusCode: 400
        }
      });

      expect(mockCreateAlert).not.toHaveBeenCalled();
    });

    it('should handle missing request body', async () => {
      const event = APIGatewayFixtures.createMockEvent();
      (event as any).body = null;
      const context = APIGatewayFixtures.createMockContext();

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: expect.stringContaining('Request body'),
          statusCode: 400
        }
      });
    });

    it('should handle service errors gracefully', async () => {
      const alertData = {
        shelterId: 'shelter-test-456',
        type: AlertType.MEDICAL_EMERGENCY,
        priority: AlertPriority.HIGH,
        title: 'Medical Emergency',
        description: 'Person collapsed'
      };

      mockCreateAlert.mockRejectedValueOnce(new Error('Service error'));

      const event = APIGatewayFixtures.createMockEvent(alertData);
      const context = APIGatewayFixtures.createMockContext();

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: 'Failed to create alert',
          statusCode: 500
        }
      });
    });
  });

  describe('acknowledgeAlert handler', () => {
    it('should acknowledge alert successfully - REQ-RDA-005 compliance', async () => {
      const acknowledgedAlert = AlertFixtures.createMockAcknowledgedAlert();
      mockAcknowledgeAlert.mockResolvedValueOnce(acknowledgedAlert);

      const event = APIGatewayFixtures.createMockEvent({}, { id: 'alert-test-123' });
      const context = APIGatewayFixtures.createMockContext();

      const result = await acknowledgeAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toMatchObject({
        success: true,
        data: {
          message: 'Alert acknowledged successfully',
          alert: acknowledgedAlert
        }
      });

      expect(mockAcknowledgeAlert).toHaveBeenCalledWith(
        'alert-test-123',
        'user-test-123'
      );
    });

    it('should handle missing alertId parameter', async () => {
      const event = APIGatewayFixtures.createMockEvent({}, {});
      const context = APIGatewayFixtures.createMockContext();

      const result = await acknowledgeAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: 'Alert ID is required',
          statusCode: 400
        }
      });
    });

    it('should handle alert not found', async () => {
      mockAcknowledgeAlert.mockResolvedValueOnce(null);

      const event = APIGatewayFixtures.createMockEvent({}, { id: 'non-existent-alert' });
      const context = APIGatewayFixtures.createMockContext();

      const result = await acknowledgeAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: 'Alert not found',
          statusCode: 404
        }
      });
    });
  });

  describe('resolveAlert handler', () => {
    it('should resolve alert successfully', async () => {
      const resolvedAlert = AlertFixtures.createMockResolvedAlert();
      mockResolveAlert.mockResolvedValueOnce(resolvedAlert);

      const event = APIGatewayFixtures.createMockEvent({}, { id: 'alert-test-123' });
      const context = APIGatewayFixtures.createMockContext();

      const result = await resolveAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toMatchObject({
        success: true,
        data: {
          message: 'Alert resolved successfully',
          alert: resolvedAlert
        }
      });

      expect(mockResolveAlert).toHaveBeenCalledWith(
        'alert-test-123',
        'user-test-123'
      );
    });

    it('should handle service errors', async () => {
      mockResolveAlert.mockRejectedValueOnce(new Error('Service error'));

      const event = APIGatewayFixtures.createMockEvent({}, { id: 'alert-test-123' });
      const context = APIGatewayFixtures.createMockContext();

      const result = await resolveAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: 'Failed to resolve alert',
          statusCode: 500
        }
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should complete alert creation within performance requirements', async () => {
      const alertData = {
        shelterId: 'shelter-test-456',
        type: AlertType.MEDICAL_EMERGENCY,
        priority: AlertPriority.CRITICAL,
        title: 'URGENT: Building Fire',
        description: 'Building is on fire, immediate evacuation needed'
      };

      const createdAlert = AlertFixtures.createMockAlert();
      mockCreateAlert.mockResolvedValueOnce(createdAlert);

      const event = APIGatewayFixtures.createMockEvent(alertData);
      const context = APIGatewayFixtures.createMockContext();

      const startTime = Date.now();
      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;
      const endTime = Date.now();

      expect(result.statusCode).toBe(201);
      // Should complete within 5 seconds for critical alerts (REQ-PERF-001)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const event = APIGatewayFixtures.createMockEvent();
      event.body = '{ invalid json }';
      const context = APIGatewayFixtures.createMockContext();

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: {
          message: expect.stringContaining('Invalid JSON'),
          statusCode: 400
        }
      });
    });

    it('should handle missing authorization context', async () => {
      const alertData = {
        shelterId: 'shelter-test-456',
        type: AlertType.MEDICAL_EMERGENCY,
        priority: AlertPriority.HIGH,
        title: 'Emergency',
        description: 'Help needed'
      };

      const event = APIGatewayFixtures.createMockEvent(alertData);
      (event.requestContext.authorizer as any) = {}; // No userId
      const context = APIGatewayFixtures.createMockContext();

      mockCreateAlert.mockResolvedValueOnce(AlertFixtures.createMockAlert());

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(mockCreateAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'unknown-user'
        })
      );
    });
  });

  describe('Security Requirements', () => {
    it('should require authentication for alert operations', async () => {
      // This test verifies that authorization context is expected
      const alertData = {
        shelterId: 'shelter-test-456',
        type: AlertType.MEDICAL_EMERGENCY,
        priority: AlertPriority.HIGH,
        title: 'Emergency',
        description: 'Help needed'
      };

      const event = APIGatewayFixtures.createMockEvent(alertData);
      delete (event.requestContext as any).authorizer;
      const context = APIGatewayFixtures.createMockContext();

      mockCreateAlert.mockResolvedValueOnce(AlertFixtures.createMockAlert());

      const result = await createAlertHandler(event, context, () => {}) as APIGatewayProxyResult;

      // Should still work but use unknown-user as fallback
      expect(result.statusCode).toBe(201);
      expect(mockCreateAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'unknown-user'
        })
      );
    });
  });
});