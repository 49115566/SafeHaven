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
    const resolvedBy = event.requestContext.authorizer?.userId || 'unknown-user';

    // Resolve alert using AlertService
    const updatedAlert = await alertService.resolveAlert(alertId, resolvedBy);

    if (!updatedAlert) {
      return responseHelper.notFound('Alert not found');
    }

    return responseHelper.success({
      message: 'Alert resolved successfully',
      alert: updatedAlert
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return responseHelper.notFound('Alert not found');
      }
      if (error.message.includes('already resolved')) {
        return responseHelper.badRequest('Alert has already been resolved');
      }
    }
    
    return responseHelper.internalError('Failed to resolve alert');
  }
};