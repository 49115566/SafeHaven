import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseHelper } from '../../utils/responseHelper';
import { locationService } from '../../services/locationService';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { query, maxResults = 10 } = JSON.parse(event.body || '{}');
    
    if (!query) {
      return responseHelper.badRequest('Query parameter is required');
    }

    const results = await locationService.searchPlaces(query, maxResults);
    
    return responseHelper.success({
      query,
      results,
      count: results.length,
    });

  } catch (error) {
    console.error('Error searching places:', error);
    return responseHelper.error('Failed to search places');
  }
};