import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { AuthService, JwtPayload } from '../../services/authService';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface ConnectionRecord {
  connectionId: string;
  userId: string;
  email: string;
  role: string;
  shelterId?: string;
  connectedAt: string;
  ttl: number; // TTL for automatic cleanup (24 hours)
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const timestamp = new Date().toISOString();
    
    if (!connectionId) {
      console.error('No connection ID in event context');
      return {
        statusCode: 400,
        body: 'Invalid connection'
      };
    }

    // Extract and validate authorization token from query parameters
    const token = event.queryStringParameters?.Authorization || event.queryStringParameters?.authorization;
    
    if (!token) {
      console.error('No authorization token provided in WebSocket connection');
      return {
        statusCode: 401,
        body: 'Unauthorized - No token provided'
      };
    }

    // Remove Bearer prefix if present
    const bearerToken = token.replace(/^Bearer\s+/i, '');
    
    // Verify JWT token
    let decodedToken: JwtPayload;
    try {
      decodedToken = AuthService.verifyToken(bearerToken);
    } catch (jwtError) {
      console.error('JWT verification failed for WebSocket connection:', jwtError);
      return {
        statusCode: 401,
        body: 'Unauthorized - Invalid token'
      };
    }

    // Validate token payload
    if (!decodedToken.userId || !decodedToken.email || !decodedToken.role) {
      console.error('Invalid token payload for WebSocket connection');
      return {
        statusCode: 401,
        body: 'Unauthorized - Invalid token payload'
      };
    }

    // Optional: Verify user still exists and is active
    try {
      const user = await AuthService.getUser(decodedToken.userId);
      
      if (!user || !user.isActive) {
        console.error(`User ${decodedToken.userId} not found or inactive for WebSocket connection`);
        return {
          statusCode: 401,
          body: 'Unauthorized - User not found or inactive'
        };
      }
    } catch (dbError) {
      console.error('Database lookup failed during WebSocket authorization:', dbError);
      return {
        statusCode: 500,
        body: 'Authorization verification failed'
      };
    }

    // Store connection information in DynamoDB with TTL (24 hours)
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
    
    const connectionRecord: ConnectionRecord = {
      connectionId,
      userId: decodedToken.userId,
      email: decodedToken.email,
      role: decodedToken.role,
      ...(decodedToken.shelterId && { shelterId: decodedToken.shelterId }),
      connectedAt: timestamp,
      ttl
    };

    const putCommand = new PutCommand({
      TableName: process.env.CONNECTIONS_TABLE,
      Item: connectionRecord
    });

    await docClient.send(putCommand);

    console.log(`WebSocket connection established: ${connectionId} for user ${decodedToken.email} (${decodedToken.role})`);

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