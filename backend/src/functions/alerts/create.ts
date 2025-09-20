import { APIGatewayProxyHandler } from 'aws-lambda';
import { AlertService } from '../../services/alertService';
import { responseHelper } from '../../utils/responseHelper';
import { validateAlertCreation } from '../../utils/validation';
import { AuthService } from '../../services/authService';

const alertService = new AlertService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Check if request body exists
    if (!event.body) {
      return responseHelper.badRequest('Request body is required');
    }

    let alertData;
    try {
      alertData = JSON.parse(event.body);
    } catch (jsonError) {
      return responseHelper.badRequest('Invalid JSON in request body');
    }

    // Validate input
    const validation = validateAlertCreation(alertData);
    if (!validation.isValid) {
      return responseHelper.badRequest(validation.errors.join(', '));
    }

    // Get user context from authorizer (TODO: implement proper auth context extraction)
    const createdBy = event.requestContext.authorizer?.userId || 'unknown-user';

    // Create alert using AlertService
    const alert = await alertService.createAlert({
      shelterId: alertData.shelterId,
      type: alertData.type,
      priority: alertData.priority,
      title: alertData.title,
      description: alertData.description,
      createdBy: createdBy
    });

    return responseHelper.success({
      alertId: alert.alertId,
      message: 'Alert created successfully',
      alert
    }, 201);

  } catch (error) {
    console.error('Error creating alert:', error);
    return responseHelper.internalError('Failed to create alert');
  }
};