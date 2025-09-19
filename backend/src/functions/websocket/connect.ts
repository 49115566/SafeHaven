import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const timestamp = new Date().toISOString();

    // Store connection information in DynamoDB
    // Note: We would need a Connections table for this in production
    console.log(`WebSocket connection established: ${connectionId}`);

    return {
      statusCode: 200,
      body: 'Connected'
    };

  } catch (error) {
    console.error('Error handling WebSocket connection:', error);
    return {
      statusCode: 500,
      body: 'Failed to connect'
    };
  }
};