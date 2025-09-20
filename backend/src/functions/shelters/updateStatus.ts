import { APIGatewayProxyHandler } from 'aws-lambda';
import { ShelterService } from '../../services/shelterService';
import { NotificationService } from '../../services/notificationService';
import { responseHelper } from '../../utils/responseHelper';
import { validateShelterStatusUpdate } from '../../utils/validation';
import { withErrorHandler, ValidationError, NotFoundError, DatabaseError } from '../../utils/errorHandler';

const shelterService = new ShelterService();
const notificationService = new NotificationService();

export const handler: APIGatewayProxyHandler = withErrorHandler(async (event) => {
  const shelterId = event.pathParameters?.shelterId;
  
  if (!shelterId) {
    throw new ValidationError('Shelter ID is required');
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (parseError) {
    throw new ValidationError('Invalid JSON in request body');
  }
  
  // Validate the update payload
  const validation = validateShelterStatusUpdate(body);
  if (!validation.isValid) {
    throw new ValidationError('Invalid update data', validation.errors);
  }

  // Update shelter status
  const updatedShelter = await shelterService.updateShelterStatus(shelterId, {
    ...body,
    shelterId,
    timestamp: new Date().toISOString()
  });

  if (!updatedShelter) {
    throw new NotFoundError('Shelter not found');
  }

  // Extract WebSocket endpoint information for real-time broadcasting
  const websocketEndpoint = event.requestContext ? {
    domainName: event.requestContext.domainName || 'unknown',
    stage: event.requestContext.stage || 'dev'
  } : undefined;

  try {
    // Send real-time notification to all connected responders
    await notificationService.broadcastShelterUpdate(updatedShelter, websocketEndpoint);
  } catch (notificationError) {
    // Log notification error but don't fail the request
    console.error('Failed to send real-time notification:', notificationError);
  }

  return responseHelper.success(updatedShelter);
}, 'shelter-updateStatus');