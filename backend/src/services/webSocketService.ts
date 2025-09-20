import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import * as AWS from 'aws-sdk';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface ConnectionRecord {
  connectionId: string;
  userId: string;
  email: string;
  role: string;
  shelterId?: string;
  connectedAt: string;
  ttl: number;
}

export interface WebSocketMessage {
  action: string;
  data?: any;
  sender?: {
    userId?: string;
    email?: string;
    role?: string;
    shelterId?: string;
  };
  timestamp: string;
}

export interface BroadcastTarget {
  type: 'all' | 'role' | 'user' | 'shelter';
  value?: string;
}

export class WebSocketService {
  private apiGwManagementApi: AWS.ApiGatewayManagementApi | null = null;

  /**
   * Initialize the WebSocket service with API Gateway endpoint
   * Must be called before using broadcast methods
   */
  public static initialize(domainName: string, stage: string): WebSocketService {
    const service = new WebSocketService();
    service.apiGwManagementApi = new AWS.ApiGatewayManagementApi({
      endpoint: `https://${domainName}/${stage}`,
      region: process.env.AWS_REGION
    });
    return service;
  }

  /**
   * Broadcast a message to targeted connections
   */
  public async broadcastMessage(
    message: WebSocketMessage,
    target: BroadcastTarget = { type: 'all' }
  ): Promise<void> {
    if (!this.apiGwManagementApi) {
      throw new Error('WebSocketService not initialized. Call initialize() first.');
    }

    const connections = await this.getTargetConnections(target);
    await this.sendToConnections(connections, message);
    
    console.log(`Broadcasted message '${message.action}' to ${connections.length} connections`);
  }

  /**
   * Send a shelter status update to all responders
   */
  public async broadcastShelterUpdate(
    shelterUpdate: any,
    shelterId: string,
    senderInfo?: { userId: string; email: string }
  ): Promise<void> {
    const message: WebSocketMessage = {
      action: 'shelter_update',
      data: {
        ...shelterUpdate,
        shelterId
      },
      sender: senderInfo,
      timestamp: new Date().toISOString()
    };

    // Send to first responders and emergency coordinators
    await this.broadcastMessage(message, {
      type: 'role',
      value: 'first_responder,emergency_coordinator'
    });
  }

  /**
   * Send an alert to all connected users or specific targets
   */
  public async broadcastAlert(
    alert: any,
    target: BroadcastTarget = { type: 'all' },
    senderInfo?: { userId: string; email: string; role: string }
  ): Promise<void> {
    const message: WebSocketMessage = {
      action: 'alert',
      data: alert,
      sender: senderInfo,
      timestamp: new Date().toISOString()
    };

    await this.broadcastMessage(message, target);
  }

  /**
   * Send a custom message to specific connections
   */
  public async sendCustomMessage(
    action: string,
    data: any,
    target: BroadcastTarget,
    senderInfo?: { userId: string; email: string; role: string }
  ): Promise<void> {
    const message: WebSocketMessage = {
      action,
      data,
      sender: senderInfo,
      timestamp: new Date().toISOString()
    };

    await this.broadcastMessage(message, target);
  }

  /**
   * Get all active connections from DynamoDB
   */
  public async getAllConnections(): Promise<ConnectionRecord[]> {
    const scanCommand = new ScanCommand({
      TableName: process.env.CONNECTIONS_TABLE
    });
    
    const result = await docClient.send(scanCommand);
    return (result.Items || []) as ConnectionRecord[];
  }

  /**
   * Get connections filtered by target criteria
   */
  private async getTargetConnections(target: BroadcastTarget): Promise<ConnectionRecord[]> {
    const allConnections = await this.getAllConnections();
    
    if (target.type === 'all') {
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

  /**
   * Send message to multiple connections
   */
  private async sendToConnections(
    connections: ConnectionRecord[],
    message: WebSocketMessage
  ): Promise<void> {
    if (!this.apiGwManagementApi) {
      throw new Error('WebSocketService not initialized');
    }

    const sendPromises = connections.map(async (connection) => {
      try {
        await this.sendToConnection(connection.connectionId, message);
      } catch (error) {
        console.error(`Failed to send message to connection ${connection.connectionId}:`, error);
        
        // If connection is gone (410 error), we could remove it from database
        // For now, we'll just log the error and continue
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
          console.log(`Connection ${connection.connectionId} is gone, should be cleaned up`);
        }
      }
    });
    
    await Promise.allSettled(sendPromises);
  }

  /**
   * Send message to a single connection
   */
  private async sendToConnection(connectionId: string, message: WebSocketMessage): Promise<void> {
    if (!this.apiGwManagementApi) {
      throw new Error('WebSocketService not initialized');
    }

    await this.apiGwManagementApi.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }).promise();
  }

  /**
   * Create a WebSocket service instance from Lambda event context
   * Convenience method for Lambda handlers
   */
  public static fromLambdaEvent(event: any): WebSocketService {
    const domainName = event.requestContext?.domainName;
    const stage = event.requestContext?.stage;
    
    if (!domainName || !stage) {
      throw new Error('Cannot extract WebSocket endpoint from Lambda event context');
    }
    
    return WebSocketService.initialize(domainName, stage);
  }
}

// Static helper function for use in other services
export async function broadcastShelterUpdate(
  domainName: string,
  stage: string,
  shelterUpdate: any,
  shelterId: string,
  senderInfo?: { userId: string; email: string }
): Promise<void> {
  const wsService = WebSocketService.initialize(domainName, stage);
  await wsService.broadcastShelterUpdate(shelterUpdate, shelterId, senderInfo);
}

export async function broadcastAlert(
  domainName: string,
  stage: string,
  alert: any,
  target?: BroadcastTarget,
  senderInfo?: { userId: string; email: string; role: string }
): Promise<void> {
  const wsService = WebSocketService.initialize(domainName, stage);
  await wsService.broadcastAlert(alert, target, senderInfo);
}