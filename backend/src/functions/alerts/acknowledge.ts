import { APIGatewayProxyHandler } from 'aws-lambda';
import { AlertService } from '../../services/alertService';
import { responseHelper } from '../../utils/responseHelper';

const alertService = new AlertService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const alertId = event.pathParameters?.id;
    
    if (!alertId) {
      return responseHelper.badRequest('Alert ID is required');
    }
    
    // Get user context from authorizer (TODO: implement proper auth context extraction)
    const acknowledgedBy = event.requestContext.authorizer?.userId || 'unknown-user';

    // Acknowledge alert using AlertService
    const updatedAlert = await alertService.acknowledgeAlert(alertId, acknowledgedBy);

    if (!updatedAlert) {
      return responseHelper.notFound('Alert not found');
    }

    return responseHelper.success({
      message: 'Alert acknowledged successfully',
      alert: updatedAlert
    });

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return responseHelper.notFound('Alert not found');
      }
      if (error.message.includes('already acknowledged')) {
        return responseHelper.badRequest('Alert has already been acknowledged');
      }
    }
    
    return responseHelper.internalError('Failed to acknowledge alert');
  }
};