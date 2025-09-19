import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;

    console.log(`WebSocket connection closed: ${connectionId}`);

    return {
      statusCode: 200,
      body: 'Disconnected'
    };

  } catch (error) {
    console.error('Error handling WebSocket disconnect:', error);
    return {
      statusCode: 500,
      body: 'Failed to disconnect'
    };
  }
};