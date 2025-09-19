import { APIGatewayProxyHandler } from 'aws-lambda';
import { ShelterService } from '../../services/shelterService';
import { responseHelper } from '../../utils/responseHelper';
import { validateShelterCreation } from '../../utils/validation';

const shelterService = new ShelterService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const shelterData = JSON.parse(event.body || '{}');
    
    // Validate input
    const validation = validateShelterCreation(shelterData);
    if (!validation.isValid) {
      return responseHelper.badRequest('Validation failed', validation.errors);
    }
    
    // Set defaults
    const shelterInput = {
      ...shelterData,
      operatorId: 'user-123', // TODO: Get from auth context
      capacity: {
        current: 0,
        maximum: shelterData.capacity.maximum
      },
      resources: {
        food: 'adequate',
        water: 'adequate', 
        medical: 'adequate',
        bedding: 'adequate'
      },
      status: 'available',
      urgentNeeds: []
    };
    
    const shelter = await shelterService.createShelter(shelterInput);
    return responseHelper.success(shelter, 201);
  } catch (error) {
    console.error('Error creating shelter:', error);
    return responseHelper.internalError('Failed to create shelter');
  }
};