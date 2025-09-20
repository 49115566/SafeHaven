import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { responseHelper } from '../../utils/responseHelper';
import { AIService } from '../../services/aiService';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Get all active shelters
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.SHELTERS_TABLE,
      FilterExpression: '#status <> :offline',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':offline': 'offline'
      }
    }));

    const shelters = result.Items || [];
    
    if (shelters.length === 0) {
      return responseHelper.success({
        predictions: [],
        message: 'No active shelters found'
      });
    }

    // Get AI predictions
    const predictions = await AIService.predictResourceNeeds(shelters as any);

    // Sort by priority (critical first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    predictions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return responseHelper.success({
      predictions,
      totalShelters: shelters.length,
      timestamp: new Date().toISOString(),
      summary: {
        critical: predictions.filter(p => p.priority === 'critical').length,
        high: predictions.filter(p => p.priority === 'high').length,
        medium: predictions.filter(p => p.priority === 'medium').length,
        low: predictions.filter(p => p.priority === 'low').length
      }
    });

  } catch (error) {
    console.error('Error predicting resource needs:', error);
    return responseHelper.internalError('Failed to predict resource needs');
  }
};