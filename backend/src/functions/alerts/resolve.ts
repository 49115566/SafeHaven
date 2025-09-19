import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { responseHelper } from '../../utils/responseHelper';
import { validateAlertResolution } from '../../utils/validation';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const alertId = event.pathParameters?.id;
    const requestData = JSON.parse(event.body || '{}');
    
    if (!alertId) {
      return responseHelper.badRequest('Alert ID is required');
    }
    
    // Validate input
    const validation = validateAlertResolution(requestData);
    if (!validation.isValid) {
      return responseHelper.badRequest(validation.errors.join(', '));
    }

    // First check if alert exists
    const getResult = await docClient.send(new GetCommand({
      TableName: process.env.ALERTS_TABLE,
      Key: { alertId }
    }));

    if (!getResult.Item) {
      return responseHelper.notFound('Alert not found');
    }

    const timestamp = new Date().toISOString();
    
    // Update alert resolution
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: process.env.ALERTS_TABLE,
      Key: { alertId },
      UpdateExpression: 'SET resolvedBy = :resolvedBy, resolvedAt = :resolvedAt, resolution = :resolution, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':resolvedBy': requestData.responderId,
        ':resolvedAt': timestamp,
        ':resolution': requestData.resolution,
        ':status': 'resolved',
        ':updatedAt': timestamp
      },
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ReturnValues: 'ALL_NEW'
    }));

    // Publish resolution to SNS for real-time notifications
    if (process.env.SHELTER_UPDATES_TOPIC) {
      const message = {
        messageType: 'alert.resolved',
        alertId,
        resolvedBy: requestData.responderId,
        resolution: requestData.resolution,
        timestamp,
        alert: updateResult.Attributes
      };

      await snsClient.send(new PublishCommand({
        TopicArn: process.env.SHELTER_UPDATES_TOPIC,
        Message: JSON.stringify(message),
        Subject: `Alert Resolved: ${alertId}`
      }));
    }

    return responseHelper.success({
      alertId,
      message: 'Alert resolved successfully',
      alert: updateResult.Attributes
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    return responseHelper.internalError('Failed to resolve alert');
  }
};