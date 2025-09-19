import { APIGatewayProxyHandler } from 'aws-lambda';
import { ShelterService } from '../../services/shelterService';
import { responseHelper } from '../../utils/responseHelper';

const shelterService = new ShelterService();

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const shelters = await shelterService.getAllShelters();
    return responseHelper.success(shelters);
  } catch (error) {
    console.error('Error listing shelters:', error);
    return responseHelper.internalError('Failed to list shelters');
  }
};