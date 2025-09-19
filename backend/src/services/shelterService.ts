import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Shelter, ShelterStatusUpdate, ShelterStatus } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export class ShelterService {
  private tableName = process.env.SHELTERS_TABLE || '';

  async createShelter(shelterData: Omit<Shelter, 'shelterId' | 'createdAt' | 'lastUpdated'>): Promise<Shelter> {
    const shelter: Shelter = {
      ...shelterData,
      shelterId: uuidv4(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: shelter
    }));

    return shelter;
  }

  async getShelter(shelterId: string): Promise<Shelter | null> {
    const response = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { shelterId }
    }));

    return response.Item as Shelter || null;
  }

  async getAllShelters(): Promise<Shelter[]> {
    const response = await docClient.send(new ScanCommand({
      TableName: this.tableName
    }));

    return response.Items as Shelter[] || [];
  }

  async getSheltersByStatus(status: ShelterStatus): Promise<Shelter[]> {
    const response = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    }));

    return response.Items as Shelter[] || [];
  }

  async updateShelterStatus(shelterId: string, update: ShelterStatusUpdate): Promise<Shelter | null> {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build dynamic update expression
    if (update.capacity) {
      updateExpression.push('#capacity = :capacity');
      expressionAttributeNames['#capacity'] = 'capacity';
      expressionAttributeValues[':capacity'] = update.capacity;
    }

    if (update.resources) {
      updateExpression.push('#resources = :resources');
      expressionAttributeNames['#resources'] = 'resources';
      expressionAttributeValues[':resources'] = update.resources;
    }

    if (update.status) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = update.status;
    }

    if (update.urgentNeeds) {
      updateExpression.push('#urgentNeeds = :urgentNeeds');
      expressionAttributeNames['#urgentNeeds'] = 'urgentNeeds';
      expressionAttributeValues[':urgentNeeds'] = update.urgentNeeds;
    }

    // Always update lastUpdated timestamp
    updateExpression.push('#lastUpdated = :lastUpdated');
    expressionAttributeNames['#lastUpdated'] = 'lastUpdated';
    expressionAttributeValues[':lastUpdated'] = new Date().toISOString();

    const response = await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { shelterId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return response.Attributes as Shelter || null;
  }

  async deleteShelter(shelterId: string): Promise<boolean> {
    try {
      await docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { shelterId },
        UpdateExpression: 'SET #status = :status, #lastUpdated = :lastUpdated',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#lastUpdated': 'lastUpdated'
        },
        ExpressionAttributeValues: {
          ':status': ShelterStatus.OFFLINE,
          ':lastUpdated': new Date().toISOString()
        }
      }));
      return true;
    } catch (error) {
      console.error('Error deleting shelter:', error);
      return false;
    }
  }
}