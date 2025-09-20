import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

// Batch write items to DynamoDB (max 25 items per batch)
async function batchWriteItems(tableName: string, items: any[]) {
  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  console.log(`Writing ${items.length} items to ${tableName} in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const writeRequests = batch.map(item => ({
      PutRequest: { Item: item }
    }));

    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: writeRequests
        }
      }));
      
      console.log(`Batch ${i + 1}/${batches.length} completed`);
      
      // Add delay to avoid throttling
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error writing batch ${i + 1}:`, error);
      throw error;
    }
  }
}

async function loadTestData() {
  const dataDir = path.join(__dirname, '../data');
  
  // Load data files
  const shelters = JSON.parse(fs.readFileSync(path.join(dataDir, 'shelters.json'), 'utf8'));
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
  const alerts = JSON.parse(fs.readFileSync(path.join(dataDir, 'alerts.json'), 'utf8'));

  // Table names from environment or defaults
  const SHELTERS_TABLE = process.env.SHELTERS_TABLE || 'safehaven-backend-shelters-dev';
  const USERS_TABLE = process.env.USERS_TABLE || 'safehaven-backend-users-dev';
  const ALERTS_TABLE = process.env.ALERTS_TABLE || 'safehaven-backend-alerts-dev';

  try {
    console.log('Loading test data to DynamoDB...');
    
    // Load shelters
    await batchWriteItems(SHELTERS_TABLE, shelters);
    console.log(`✅ Loaded ${shelters.length} shelters`);
    
    // Load users
    await batchWriteItems(USERS_TABLE, users);
    console.log(`✅ Loaded ${users.length} users`);
    
    // Load alerts
    await batchWriteItems(ALERTS_TABLE, alerts);
    console.log(`✅ Loaded ${alerts.length} alerts`);
    
    console.log('🎉 All test data loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error loading test data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  loadTestData();
}

export { loadTestData };