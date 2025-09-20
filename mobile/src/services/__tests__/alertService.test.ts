import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { alertService } from '../alertService';
import { AlertType, AlertPriority } from '../../types';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('mock-token')),
}));

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create alert successfully', async () => {
      const mockAlert = {
        alertId: 'alert-123',
        shelterId: 'shelter-1',
        type: AlertType.MEDICAL_EMERGENCY,
        title: 'Medical Emergency',
        description: 'Patient needs immediate attention',
        priority: AlertPriority.CRITICAL,
        status: 'open',
        createdAt: '2025-01-01T10:00:00Z'
      };

      mockAxios.post.mockResolvedValue({ data: { alert: mockAlert } });

      const alertData = {
        shelterId: 'shelter-1',
        type: AlertType.MEDICAL_EMERGENCY,
        title: 'Medical Emergency',
        description: 'Patient needs immediate attention',
        priority: AlertPriority.CRITICAL
      };

      const result = await alertService.createAlert(alertData);

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('authToken');
      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/alerts',
        alertData,
        {
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockAlert);
    });

    it('should handle API errors', async () => {
      mockAxios.post.mockRejectedValue({
        response: { data: { message: 'Invalid alert data' } }
      });

      const alertData = {
        shelterId: 'shelter-1',
        type: AlertType.MEDICAL_EMERGENCY,
        title: 'Medical Emergency',
        description: 'Patient needs immediate attention',
        priority: AlertPriority.CRITICAL
      };

      await expect(alertService.createAlert(alertData)).rejects.toThrow('Invalid alert data');
    });
  });

  describe('getAlerts', () => {
    it('should fetch alerts successfully', async () => {
      const mockAlerts = [
        {
          alertId: 'alert-1',
          shelterId: 'shelter-1',
          type: AlertType.MEDICAL_EMERGENCY,
          title: 'Medical Emergency',
          priority: AlertPriority.CRITICAL,
          status: 'open'
        }
      ];

      mockAxios.get.mockResolvedValue({ data: { alerts: mockAlerts } });

      const result = await alertService.getAlerts('shelter-1');

      expect(mockAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/alerts?shelterId=shelter-1',
        {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        }
      );
      expect(result).toEqual(mockAlerts);
    });

    it('should return empty array when no alerts data', async () => {
      mockAxios.get.mockResolvedValue({ data: {} });

      const result = await alertService.getAlerts('shelter-1');

      expect(result).toEqual([]);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert successfully', async () => {
      mockAxios.patch.mockResolvedValue({ data: {} });

      await alertService.acknowledgeAlert('alert-123');

      expect(mockAxios.patch).toHaveBeenCalledWith(
        'http://localhost:3001/alerts/alert-123/acknowledge',
        {},
        {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        }
      );
    });

    it('should handle acknowledge errors', async () => {
      mockAxios.patch.mockRejectedValue({
        response: { data: { message: 'Alert not found' } }
      });

      await expect(alertService.acknowledgeAlert('invalid-id')).rejects.toThrow('Alert not found');
    });
  });
});