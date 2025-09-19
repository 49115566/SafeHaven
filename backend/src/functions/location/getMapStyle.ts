import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseHelper } from '../../utils/responseHelper';
import { locationService } from '../../services/locationService';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const mapStyle = await locationService.getMapStyle();
    
    if (!mapStyle) {
      return responseHelper.error('Failed to retrieve map style');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        style: Buffer.from(mapStyle).toString('base64'),
      }),
    };

  } catch (error) {
    console.error('Error getting map style:', error);
    return responseHelper.error('Failed to get map style');
  }
};