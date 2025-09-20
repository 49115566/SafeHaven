import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Use AWS SDK v2 for API Gateway Management which is more compatible with serverless offline
import * as AWS from 'aws-sdk';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface WebSocketMessage {
  action: string;
  data?: any;
  target?: {
    type: 'all' | 'role' | 'user' | 'shelter';
    value?: string;
  };
}

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
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    
    if (!connectionId) {
      console.error('No connection ID in event context');
      return {
        statusCode: 400,
        body: 'Invalid connection'
      };
    }

    // Parse the incoming message
    let message: WebSocketMessage;
    try {
      message = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('Failed to parse WebSocket message:', parseError);
      return {
        statusCode: 400,
        body: 'Invalid message format'
      };
    }

    // Verify the connection exists and get user info
    const getConnectionCommand = new GetCommand({
      TableName: process.env.CONNECTIONS_TABLE,
      Key: { connectionId }
    });

    const connectionResult = await docClient.send(getConnectionCommand);
    
    if (!connectionResult.Item) {
      console.error(`Connection ${connectionId} not found in database`);
      return {
        statusCode: 404,
        body: 'Connection not found'
      };
    }

    const senderConnection = connectionResult.Item as ConnectionRecord;
    
    console.log(`Processing WebSocket message from ${senderConnection.email}: ${message.action}`);

    // Create API Gateway Management API client using AWS SDK v2 for better offline support
    const apiGwManagementApi = new AWS.ApiGatewayManagementApi({
      endpoint: `https://${domainName}/${stage}`,
      region: process.env.AWS_REGION
    });

    // Handle different message actions
    switch (message.action) {
      case 'broadcast':
        await handleBroadcast(message, senderConnection, docClient, apiGwManagementApi);
        break;
      
      case 'shelter_update':
        await handleShelterUpdate(message, senderConnection, docClient, apiGwManagementApi);
        break;
      
      case 'alert':
        await handleAlert(message, senderConnection, docClient, apiGwManagementApi);
        break;
      
      case 'ping':
        // Send pong back to sender for heartbeat
        await sendToConnection(apiGwManagementApi, connectionId, { action: 'pong', timestamp: new Date().toISOString() });
        break;
      
      default:
        console.log(`Unknown message action: ${message.action}`);
        await sendToConnection(apiGwManagementApi, connectionId, { 
          action: 'error', 
          error: `Unknown action: ${message.action}` 
        });
    }

    return {
      statusCode: 200,
      body: 'Message processed'
    };

  } catch (error) {
    console.error('Error handling WebSocket message:', error);
    return {
      statusCode: 500,
      body: 'Failed to process message'
    };
  }
};

async function handleBroadcast(
  message: WebSocketMessage, 
  sender: ConnectionRecord, 
  docClient: DynamoDBDocumentClient, 
  apiGwManagementApi: AWS.ApiGatewayManagementApi
) {
  // Get target connections based on message target
  const targetConnections = await getTargetConnections(message.target, docClient);
  
  const broadcastMessage = {
    action: 'broadcast',
    data: message.data,
    sender: {
      userId: sender.userId,
      email: sender.email,
      role: sender.role,
      shelterId: sender.shelterId
    },
    timestamp: new Date().toISOString()
  };

  await broadcastToConnections(apiGwManagementApi, targetConnections, broadcastMessage);
}

async function handleShelterUpdate(
  message: WebSocketMessage, 
  sender: ConnectionRecord, 
  docClient: DynamoDBDocumentClient, 
  apiGwManagementApi: AWS.ApiGatewayManagementApi
) {
  // Only shelter operators can send shelter updates
  if (sender.role !== 'shelter_operator') {
    await sendToConnection(apiGwManagementApi, sender.connectionId, {
      action: 'error',
      error: 'Unauthorized: Only shelter operators can send shelter updates'
    });
    return;
  }

  // Broadcast shelter update to all first responders and emergency coordinators
  const targetConnections = await getTargetConnections(
    { type: 'role', value: 'first_responder,emergency_coordinator' }, 
    docClient
  );
  
  const updateMessage = {
    action: 'shelter_update',
    data: {
      ...message.data,
      shelterId: sender.shelterId
    },
    sender: {
      userId: sender.userId,
      email: sender.email,
      shelterId: sender.shelterId
    },
    timestamp: new Date().toISOString()
  };

  await broadcastToConnections(apiGwManagementApi, targetConnections, updateMessage);
  
  console.log(`Shelter update broadcasted from ${sender.shelterId} to ${targetConnections.length} responders`);
}

async function handleAlert(
  message: WebSocketMessage, 
  sender: ConnectionRecord, 
  docClient: DynamoDBDocumentClient, 
  apiGwManagementApi: AWS.ApiGatewayManagementApi
) {
  // Both shelter operators and responders can send alerts
  const targetConnections = await getTargetConnections({ type: 'all' }, docClient);
  
  const alertMessage = {
    action: 'alert',
    data: message.data,
    sender: {
      userId: sender.userId,
      email: sender.email,
      role: sender.role,
      shelterId: sender.shelterId
    },
    timestamp: new Date().toISOString()
  };

  await broadcastToConnections(apiGwManagementApi, targetConnections, alertMessage);
  
  console.log(`Alert broadcasted from ${sender.email} to ${targetConnections.length} connections`);
}

async function getTargetConnections(
  target: WebSocketMessage['target'], 
  docClient: DynamoDBDocumentClient
): Promise<ConnectionRecord[]> {
  const scanCommand = new ScanCommand({
    TableName: process.env.CONNECTIONS_TABLE
  });
  
  const result = await docClient.send(scanCommand);
  const allConnections = (result.Items || []) as ConnectionRecord[];
  
  if (!target || target.type === 'all') {
    return allConnections;
  }
  
  switch (target.type) {
    case 'role':
      const roles = target.value?.split(',').map(r => r.trim()) || [];
      return allConnections.filter(conn => roles.includes(conn.role));
    
    case 'user':
      return allConnections.filter(conn => conn.userId === target.value);
    
    case 'shelter':
      return allConnections.filter(conn => conn.shelterId === target.value);
    
    default:
      return allConnections;
  }
}

async function broadcastToConnections(
  apiGwManagementApi: AWS.ApiGatewayManagementApi, 
  connections: ConnectionRecord[], 
  message: any
) {
  const broadcastPromises = connections.map(async (connection) => {
    try {
      await sendToConnection(apiGwManagementApi, connection.connectionId, message);
    } catch (error) {
      console.error(`Failed to send message to connection ${connection.connectionId}:`, error);
      // Note: In a production system, you might want to remove stale connections here
    }
  });
  
  await Promise.allSettled(broadcastPromises);
}

async function sendToConnection(
  apiGwManagementApi: AWS.ApiGatewayManagementApi, 
  connectionId: string, 
  message: any
) {
  await apiGwManagementApi.postToConnection({
    ConnectionId: connectionId,
    Data: JSON.stringify(message)
  }).promise();
}