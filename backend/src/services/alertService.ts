import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Alert, AlertType, AlertPriority, AlertStatus } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

export interface CreateAlertInput {
  shelterId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  createdBy: string;
}

export interface UpdateAlertInput {
  status?: AlertStatus;
  acknowledgedBy?: string;
  resolvedAt?: string;
  description?: string;
}

export class AlertService {
  private tableName = process.env.ALERTS_TABLE || '';
  private snsTopicArn = process.env.SHELTER_UPDATES_TOPIC || '';

  /**
   * Create a new alert
   */
  async createAlert(input: CreateAlertInput): Promise<Alert> {
    const alertId = uuidv4();
    const now = new Date();
    const timestamp = now.toISOString();

    const alert: Alert = {
      alertId,
      shelterId: input.shelterId,
      type: input.type,
      priority: input.priority,
      title: input.title,
      description: input.description,
      status: AlertStatus.OPEN,
      createdBy: input.createdBy,
      timestamp: now.getTime(), // Unix timestamp for GSI sorting
      createdAt: timestamp
    };

    // Save alert to DynamoDB
    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: alert
    }));

    // Publish to SNS for real-time notifications
    await this.publishAlertNotification('alert.created', alert);

    return alert;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<Alert | null> {
    const response = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { alertId }
    }));

    return response.Item as Alert || null;
  }

  /**
   * Get all alerts for a shelter
   */
  async getAlertsByShelter(shelterId: string, limit?: number): Promise<Alert[]> {
    const response = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'ShelterTimestampIndex',
      KeyConditionExpression: 'shelterId = :shelterId',
      ExpressionAttributeValues: {
        ':shelterId': shelterId
      },
      ScanIndexForward: false, // Sort by timestamp descending (newest first)
      Limit: limit
    }));

    return response.Items as Alert[] || [];
  }

  /**
   * Get all alerts with optional filtering
   */
  async getAllAlerts(
    status?: AlertStatus,
    priority?: AlertPriority,
    limit?: number
  ): Promise<Alert[]> {
    if (status || priority) {
      // Use scan with filter for complex filtering
      const filterExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};

      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }

      if (priority) {
        filterExpressions.push('priority = :priority');
        expressionAttributeValues[':priority'] = priority;
      }

      const response = await docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: filterExpressions.join(' AND '),
        ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: limit
      }));

      return response.Items as Alert[] || [];
    } else {
      // Simple scan for all alerts
      const response = await docClient.send(new ScanCommand({
        TableName: this.tableName,
        Limit: limit
      }));

      return response.Items as Alert[] || [];
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | null> {
    const updateInput: UpdateAlertInput = {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy,
    };

    return this.updateAlert(alertId, updateInput);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<Alert | null> {
    const updateInput: UpdateAlertInput = {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date().toISOString()
    };

    if (resolvedBy) {
      updateInput.acknowledgedBy = resolvedBy;
    }

    return this.updateAlert(alertId, updateInput);
  }

  /**
   * Update alert status and other fields
   */
  async updateAlert(alertId: string, updates: UpdateAlertInput): Promise<Alert | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.status) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updates.status;
    }

    if (updates.acknowledgedBy) {
      updateExpressions.push('acknowledgedBy = :acknowledgedBy');
      expressionAttributeValues[':acknowledgedBy'] = updates.acknowledgedBy;

      // Set acknowledged timestamp if not already set
      if (updates.status === AlertStatus.ACKNOWLEDGED) {
        updateExpressions.push('acknowledgedAt = :acknowledgedAt');
        expressionAttributeValues[':acknowledgedAt'] = new Date().toISOString();
      }
    }

    if (updates.resolvedAt) {
      updateExpressions.push('resolvedAt = :resolvedAt');
      expressionAttributeValues[':resolvedAt'] = updates.resolvedAt;
    }

    if (updates.description) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = updates.description;
    }

    if (updateExpressions.length === 0) {
      throw new Error('No updates provided');
    }

    const response = await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { alertId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    const updatedAlert = response.Attributes as Alert;

    // Publish update notification
    if (updatedAlert) {
      const eventType = updates.status === AlertStatus.ACKNOWLEDGED ? 'alert.acknowledged' :
                       updates.status === AlertStatus.RESOLVED ? 'alert.resolved' : 'alert.updated';
      await this.publishAlertNotification(eventType, updatedAlert);
    }

    return updatedAlert || null;
  }

  /**
   * Get alerts by priority (useful for dashboard filtering)
   */
  async getAlertsByPriority(priority: AlertPriority, limit?: number): Promise<Alert[]> {
    return this.getAllAlerts(undefined, priority, limit);
  }

  /**
   * Get open alerts (useful for active alerts view)
   */
  async getOpenAlerts(limit?: number): Promise<Alert[]> {
    return this.getAllAlerts(AlertStatus.OPEN, undefined, limit);
  }

  /**
   * Get critical alerts (high priority open alerts)
   */
  async getCriticalAlerts(limit?: number): Promise<Alert[]> {
    const filterExpressions = '#status = :status AND priority = :priority';
    const expressionAttributeNames = { '#status': 'status' };
    const expressionAttributeValues = {
      ':status': AlertStatus.OPEN,
      ':priority': AlertPriority.CRITICAL
    };

    const response = await docClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpressions,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit
    }));

    return response.Items as Alert[] || [];
  }

  /**
   * Delete an alert (soft delete by marking as resolved)
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    try {
      await this.resolveAlert(alertId);
      return true;
    } catch (error) {
      console.error('Error deleting alert:', error);
      return false;
    }
  }

  /**
   * Publish alert notification to SNS
   */
  private async publishAlertNotification(eventType: string, alert: Alert): Promise<void> {
    if (!this.snsTopicArn) {
      console.warn('SNS Topic ARN not configured, skipping notification');
      return;
    }

    try {
      const message = {
        messageType: eventType,
        alert,
        timestamp: new Date().toISOString(),
        priority: alert.priority
      };

      await snsClient.send(new PublishCommand({
        TopicArn: this.snsTopicArn,
        Message: JSON.stringify(message),
        Subject: `SafeHaven Alert: ${alert.title}`,
        MessageAttributes: {
          alertType: {
            DataType: 'String',
            StringValue: alert.type
          },
          priority: {
            DataType: 'String',
            StringValue: alert.priority
          },
          shelterId: {
            DataType: 'String',
            StringValue: alert.shelterId
          }
        }
      }));

      console.log(`Published ${eventType} notification for alert ${alert.alertId}`);
    } catch (error) {
      console.error(`Failed to publish ${eventType} notification:`, error);
      // Don't throw error as notification failure shouldn't break the main operation
    }
  }
}