import { APIGatewayProxyHandler } from 'aws-lambda';
import { ShelterService } from '../../services/shelterService';
import { responseHelper } from '../../utils/responseHelper';

const shelterService = new ShelterService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const shelterId = event.pathParameters?.shelterId;
    
    if (!shelterId) {
      return responseHelper.badRequest('Shelter ID is required');
    }
    
    const shelter = await shelterService.getShelter(shelterId);
    
    if (!shelter) {
      return responseHelper.notFound('Shelter not found');
    }
    
    return responseHelper.success(shelter);
  } catch (error) {
    console.error('Error getting shelter:', error);
    return responseHelper.internalError('Failed to get shelter');
  }
};