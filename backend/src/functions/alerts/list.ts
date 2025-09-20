import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { responseHelper } from '../../utils/responseHelper';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { shelterId, status, priority } = event.queryStringParameters || {};
    
    let command;
    
    if (shelterId) {
      // Query alerts for specific shelter using GSI
      command = new QueryCommand({
        TableName: process.env.ALERTS_TABLE,
        IndexName: 'shelterId-timestamp-index',
        KeyConditionExpression: 'shelterId = :shelterId',
        ExpressionAttributeValues: {
          ':shelterId': shelterId
        },
        ScanIndexForward: false // Most recent first
      });
    } else {
      // Scan all alerts
      const filterExpressions = [];
      const expressionAttributeValues: any = {};
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (priority) {
        filterExpressions.push('priority = :priority');
        expressionAttributeValues[':priority'] = priority;
      }
      
      command = new ScanCommand({
        TableName: process.env.ALERTS_TABLE,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        ExpressionAttributeNames: status ? { '#status': 'status' } : undefined
      });
    }

    const result = await docClient.send(command);
    
    // Sort by timestamp descending (most recent first)
    const alerts = (result.Items || []).sort((a, b) => 
      (b.timestamp || 0) - (a.timestamp || 0)
    );

    return responseHelper.success({
      alerts,
      count: alerts.length,
      filters: {
        shelterId: shelterId || null,
        status: status || null,
        priority: priority || null
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return responseHelper.internalError('Failed to fetch alerts');
  }
};