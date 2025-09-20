import { APIGatewayProxyHandler } from 'aws-lambda';
import { ShelterService } from '../../services/shelterService';
import { NotificationService } from '../../services/notificationService';
import { responseHelper } from '../../utils/responseHelper';
import { validateShelterStatusUpdate } from '../../utils/validation';

const shelterService = new ShelterService();
const notificationService = new NotificationService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const shelterId = event.pathParameters?.shelterId;
    
    if (!shelterId) {
      return responseHelper.badRequest('Shelter ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    
    // Validate the update payload
    const validation = validateShelterStatusUpdate(body);
    if (!validation.isValid) {
      return responseHelper.badRequest('Invalid update data', validation.errors);
    }

    // Update shelter status
    const updatedShelter = await shelterService.updateShelterStatus(shelterId, {
      ...body,
      shelterId,
      timestamp: new Date().toISOString()
    });

    if (!updatedShelter) {
      return responseHelper.notFound('Shelter not found');
    }

    // Extract WebSocket endpoint information for real-time broadcasting
    const websocketEndpoint = event.requestContext ? {
      domainName: event.requestContext.domainName || 'unknown',
      stage: event.requestContext.stage || 'dev'
    } : undefined;

    // Send real-time notification to all connected responders
    await notificationService.broadcastShelterUpdate(updatedShelter, websocketEndpoint);

    return responseHelper.success(updatedShelter);
  } catch (error) {
    console.error('Error updating shelter status:', error);
    return responseHelper.internalError('Failed to update shelter status');
  }
};