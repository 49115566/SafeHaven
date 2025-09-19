import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const body = JSON.parse(event.body || '{}');

    console.log(`WebSocket default handler - Connection: ${connectionId}, Body:`, body);

    return {
      statusCode: 200,
      body: 'Message received'
    };

  } catch (error) {
    console.error('Error handling WebSocket default message:', error);
    return {
      statusCode: 500,
      body: 'Failed to process message'
    };
  }
};