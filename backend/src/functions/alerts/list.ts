import { APIGatewayProxyHandler } from 'aws-lambda';
import { AlertService } from '../../services/alertService';
import { responseHelper } from '../../utils/responseHelper';
import { AlertStatus, AlertPriority } from '../../models/types';

const alertService = new AlertService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { shelterId, status, priority, limit } = event.queryStringParameters || {};
    
    let alerts;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    
    if (shelterId) {
      // Get alerts for specific shelter
      alerts = await alertService.getAlertsByShelter(shelterId, limitNum);
    } else {
      // Get all alerts with optional filtering
      const statusFilter = status ? status as AlertStatus : undefined;
      const priorityFilter = priority ? priority as AlertPriority : undefined;
      alerts = await alertService.getAllAlerts(statusFilter, priorityFilter, limitNum);
    }

    return responseHelper.success({
      alerts,
      count: alerts.length,
      filters: {
        shelterId: shelterId || null,
        status: status || null,
        priority: priority || null,
        limit: limitNum || null
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return responseHelper.internalError('Failed to fetch alerts');
  }
};