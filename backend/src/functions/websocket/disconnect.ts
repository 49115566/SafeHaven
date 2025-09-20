import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface ConnectionRecord {
  connectionId: string;
  userId: string;
  email: string;
  role: string;
  shelterId?: string;
  connectedAt: string;
  ttl: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
      console.error('No connection ID in disconnect event context');
      return {
        statusCode: 400,
        body: 'Invalid connection'
      };
    }

    // Get connection info before deleting for logging purposes
    const getCommand = new GetCommand({
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId }
    });

    let connectionInfo: ConnectionRecord | null = null;
    try {
      const getResult = await docClient.send(getCommand);
      connectionInfo = getResult.Item as ConnectionRecord | null;
    } catch (getError) {
      console.warn(`Could not retrieve connection info for ${connectionId}:`, getError);
      // Continue with deletion even if get fails
    }

    // Delete connection from DynamoDB
    const deleteCommand = new DeleteCommand({
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId }
    });

    await docClient.send(deleteCommand);

    if (connectionInfo) {
      console.log(`WebSocket connection closed: ${connectionId} for user ${connectionInfo.email} (${connectionInfo.role})`);
    } else {
      console.log(`WebSocket connection closed: ${connectionId} (user info not available)`);
    }

    return {
      statusCode: 200,
      body: 'Disconnected'
    };

  } catch (error) {
    console.error('Error handling WebSocket disconnect:', error);
    // Return success even if cleanup fails to avoid connection hanging
    return {
      statusCode: 200,
      body: 'Disconnected with errors'
    };
  }
};