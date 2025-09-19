import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { responseHelper } from '../../utils/responseHelper';
import { validateAlertCreation } from '../../utils/validation';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const alertData = JSON.parse(event.body || '{}');
    
    // Validate input
    const validation = validateAlertCreation(alertData);
    if (!validation.isValid) {
      return responseHelper.badRequest(validation.errors.join(', '));
    }

    const alertId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const alert = {
      alertId,
      shelterId: alertData.shelterId,
      alertType: alertData.type,
      message: alertData.description,
      title: alertData.title,
      severity: alertData.severity || 'medium',
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp,
      category: alertData.category || 'general',
      priority: alertData.priority || 'normal'
    };

    // Save alert to DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.ALERTS_TABLE,
      Item: alert
    }));

    // Publish to SNS for real-time notifications
    if (process.env.SHELTER_UPDATES_TOPIC) {
      const message = {
        messageType: 'shelter.alert.created',
        alert,
        timestamp,
        priority: alert.priority
      };

      await snsClient.send(new PublishCommand({
        TopicArn: process.env.SHELTER_UPDATES_TOPIC,
        Message: JSON.stringify(message),
        Subject: `Emergency Alert: ${alert.alertType}`
      }));
    }

    return responseHelper.success({
      alertId,
      message: 'Alert created successfully',
      alert
    });

  } catch (error) {
    console.error('Error creating alert:', error);
    return responseHelper.internalError('Failed to create alert');
  }
};