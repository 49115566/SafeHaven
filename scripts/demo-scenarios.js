#!/usr/bin/env node

/**
 * SafeHaven Demo Scenarios
 * Interactive scenarios for testing and demonstration
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-2'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const DEMO_CONFIG = {
  SHELTERS_TABLE: process.env.SHELTERS_TABLE || 'SafeHaven-Shelters-dev',
  ALERTS_TABLE: process.env.ALERTS_TABLE || 'SafeHaven-Alerts-dev'
};

/**
 * Demo Scenario 1: Capacity Crisis
 * Simulates a shelter reaching capacity and needing overflow
 */
async function scenarioCapacityCrisis() {
  console.log('🎬 Demo Scenario 1: Capacity Crisis');
  console.log('Simulating Austin shelter reaching maximum capacity...\n');

  const updates = [
    { current: 120, status: 'available', message: 'Normal operations' },
    { current: 135, status: 'limited', message: 'Approaching capacity' },
    { current: 148, status: 'limited', message: 'Nearly full' },
    { current: 150, status: 'full', message: 'At maximum capacity' }
  ];

  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    
    try {
      await dynamodb.update({
        TableName: DEMO_CONFIG.SHELTERS_TABLE,
        Key: { shelterId: 'shelter-austin-001' },
        UpdateExpression: 'SET capacity.current = :current, #status = :status, lastUpdated = :timestamp',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':current': update.current,
          ':status': update.status,
          ':timestamp': new Date().toISOString()
        }
      }).promise();

      console.log(`✅ Step ${i + 1}: ${update.current}/150 occupancy - ${update.message}`);
      
      // Add alert when reaching capacity
      if (update.status === 'full') {
        const alert = {
          alertId: `scenario-alert-${Date.now()}`,
          shelterId: 'shelter-austin-001',
          type: 'capacity_full',
          priority: 'high',
          title: 'Shelter at Maximum Capacity',
          description: 'Austin Emergency Shelter has reached maximum capacity. Need overflow shelter coordination.',
          status: 'open',
          createdBy: 'demo-operator-3@safehaven.com',
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: DEMO_CONFIG.ALERTS_TABLE,
          Item: alert
        }).promise();

        console.log('🚨 ALERT CREATED: Capacity Full - High Priority');
      }

      // Wait 2 seconds between updates for demo effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to update shelter:`, error.message);
    }
  }

  console.log('\n🎯 Scenario Complete: Austin shelter now at full capacity with alert sent\n');
}

/**
 * Demo Scenario 2: Resource Depletion
 * Simulates resources running low and triggering alerts
 */
async function scenarioResourceDepletion() {
  console.log('🎬 Demo Scenario 2: Resource Depletion');
  console.log('Simulating Dallas shelter water supply running low...\n');

  const resourceUpdates = [
    { water: 'adequate', message: 'Water supply normal' },
    { water: 'low', message: 'Water supply at 30%' },
    { water: 'critical', message: 'Water supply at 10% - Critical!' }
  ];

  for (let i = 0; i < resourceUpdates.length; i++) {
    const update = resourceUpdates[i];
    
    try {
      await dynamodb.update({
        TableName: DEMO_CONFIG.SHELTERS_TABLE,
        Key: { shelterId: 'shelter-dallas-001' },
        UpdateExpression: 'SET resources.water = :water, lastUpdated = :timestamp',
        ExpressionAttributeValues: {
          ':water': update.water,
          ':timestamp': new Date().toISOString()
        }
      }).promise();

      console.log(`✅ Step ${i + 1}: Water status - ${update.message}`);
      
      // Add urgent needs and alert when critical
      if (update.water === 'critical') {
        await dynamodb.update({
          TableName: DEMO_CONFIG.SHELTERS_TABLE,
          Key: { shelterId: 'shelter-dallas-001' },
          UpdateExpression: 'SET urgentNeeds = :needs',
          ExpressionAttributeValues: {
            ':needs': ['water delivery within 2 hours', 'backup water source']
          }
        }).promise();

        const alert = {
          alertId: `scenario-alert-${Date.now()}`,
          shelterId: 'shelter-dallas-001',
          type: 'resource_critical',
          priority: 'critical',
          title: 'Water Supply Critical',
          description: 'Water reserves at 10%. Need immediate water delivery to Dallas Convention Center.',
          status: 'open',
          createdBy: 'demo-operator-1@safehaven.com',
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        };

        await dynamodb.put({
          TableName: DEMO_CONFIG.ALERTS_TABLE,
          Item: alert
        }).promise();

        console.log('🚨 CRITICAL ALERT: Water supply critical - Immediate response needed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to update resources:`, error.message);
    }
  }

  console.log('\n🎯 Scenario Complete: Dallas shelter water supply critical with alert sent\n');
}

/**
 * Demo Scenario 3: Medical Emergency
 * Simulates a medical emergency requiring immediate response
 */
async function scenarioMedicalEmergency() {
  console.log('🎬 Demo Scenario 3: Medical Emergency');
  console.log('Simulating medical emergency at Houston shelter...\n');

  try {
    // Create critical medical alert
    const alert = {
      alertId: `medical-emergency-${Date.now()}`,
      shelterId: 'shelter-houston-001',
      type: 'medical_emergency',
      priority: 'critical',
      title: 'Medical Emergency - Cardiac Event',
      description: 'Elderly evacuee experiencing severe chest pains and difficulty breathing. Need immediate paramedic assistance.',
      status: 'open',
      createdBy: 'demo-operator-2@safehaven.com',
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    await dynamodb.put({
      TableName: DEMO_CONFIG.ALERTS_TABLE,
      Item: alert
    }).promise();

    console.log('🚨 CRITICAL MEDICAL ALERT CREATED');
    console.log('   Type: Medical Emergency - Cardiac Event');
    console.log('   Location: Houston Community Center');
    console.log('   Priority: Critical');
    console.log('   Status: Open - Awaiting Response');

    // Simulate response acknowledgment after 30 seconds
    setTimeout(async () => {
      try {
        await dynamodb.update({
          TableName: DEMO_CONFIG.ALERTS_TABLE,
          Key: { alertId: alert.alertId },
          UpdateExpression: 'SET #status = :status, acknowledgedBy = :responder, acknowledgedAt = :timestamp',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'acknowledged',
            ':responder': 'demo-responder-1@safehaven.com',
            ':timestamp': new Date().toISOString()
          }
        }).promise();

        console.log('\n✅ ALERT ACKNOWLEDGED by First Responder');
        console.log('   ETA: 8 minutes');
        console.log('   Unit: Paramedic Unit 12');
        
      } catch (error) {
        console.error('❌ Failed to acknowledge alert:', error.message);
      }
    }, 5000); // 5 seconds for demo

  } catch (error) {
    console.error('❌ Failed to create medical emergency alert:', error.message);
  }

  console.log('\n🎯 Scenario Active: Medical emergency alert sent, awaiting response...\n');
}

/**
 * Demo Scenario 4: Multi-Shelter Coordination
 * Simulates coordinated response across multiple shelters
 */
async function scenarioMultiShelterCoordination() {
  console.log('🎬 Demo Scenario 4: Multi-Shelter Coordination');
  console.log('Simulating coordinated response across Texas shelters...\n');

  const shelterUpdates = [
    {
      shelterId: 'shelter-dallas-001',
      updates: { 'capacity.current': 280, status: 'limited' },
      message: 'Dallas: Increased occupancy to 280/500'
    },
    {
      shelterId: 'shelter-houston-001',
      updates: { 'capacity.current': 120, status: 'available' },
      message: 'Houston: Reduced occupancy to 120/200 (transfers out)'
    },
    {
      shelterId: 'shelter-sanantonio-001',
      updates: { 'capacity.current': 85, status: 'available' },
      message: 'San Antonio: Increased occupancy to 85/300'
    },
    {
      shelterId: 'shelter-fortworth-001',
      updates: { 'capacity.current': 50, status: 'available' },
      message: 'Fort Worth: Back online with 50/250 occupancy'
    }
  ];

  for (const update of shelterUpdates) {
    try {
      const updateExpression = Object.keys(update.updates)
        .map(key => `${key.includes('.') ? key : `#${key.replace('.', '_')}`} = :${key.replace('.', '_')}`)
        .join(', ');
      
      const expressionValues = {};
      const expressionNames = {};
      
      Object.keys(update.updates).forEach(key => {
        expressionValues[`:${key.replace('.', '_')}`] = update.updates[key];
        if (!key.includes('.')) {
          expressionNames[`#${key.replace('.', '_')}`] = key;
        }
      });
      expressionValues[':timestamp'] = new Date().toISOString();

      const updateParams = {
        TableName: DEMO_CONFIG.SHELTERS_TABLE,
        Key: { shelterId: update.shelterId },
        UpdateExpression: `SET ${updateExpression}, lastUpdated = :timestamp`,
        ExpressionAttributeValues: expressionValues
      };
      
      if (Object.keys(expressionNames).length > 0) {
        updateParams.ExpressionAttributeNames = expressionNames;
      }

      await dynamodb.update(updateParams).promise();

      console.log(`✅ ${update.message}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error(`❌ Failed to update ${update.shelterId}:`, error.message);
    }
  }

  // Create coordination alert
  const coordinationAlert = {
    alertId: `coordination-${Date.now()}`,
    shelterId: 'shelter-dallas-001',
    type: 'general_assistance',
    priority: 'medium',
    title: 'Shelter Network Coordination Update',
    description: 'Multi-shelter coordination complete. Evacuee transfers successful. Network capacity optimized.',
    status: 'resolved',
    createdBy: 'demo-coordinator-1@safehaven.com',
    acknowledgedBy: 'demo-coordinator-1@safehaven.com',
    acknowledgedAt: new Date().toISOString(),
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };

  await dynamodb.put({
    TableName: DEMO_CONFIG.ALERTS_TABLE,
    Item: coordinationAlert
  }).promise();

  console.log('\n📊 COORDINATION COMPLETE');
  console.log('   Total Network Capacity: 535/1400 (38%)');
  console.log('   Available Capacity: 865 spaces');
  console.log('   All shelters operational');

  console.log('\n🎯 Scenario Complete: Multi-shelter coordination successful\n');
}

/**
 * Reset demo data to initial state
 */
async function resetDemoData() {
  console.log('🔄 Resetting demo data to initial state...\n');

  const resetShelters = [
    {
      shelterId: 'shelter-dallas-001',
      updates: {
        'capacity.current': 234,
        status: 'available',
        'resources.water': 'low',
        urgentNeeds: ['water supplies']
      }
    },
    {
      shelterId: 'shelter-houston-001',
      updates: {
        'capacity.current': 89,
        status: 'limited',
        'resources.medical': 'critical'
      }
    },
    {
      shelterId: 'shelter-austin-001',
      updates: {
        'capacity.current': 150,
        status: 'full'
      }
    },
    {
      shelterId: 'shelter-sanantonio-001',
      updates: {
        'capacity.current': 45,
        status: 'available'
      }
    },
    {
      shelterId: 'shelter-fortworth-001',
      updates: {
        'capacity.current': 0,
        status: 'offline'
      }
    }
  ];

  for (const shelter of resetShelters) {
    try {
      const updateExpression = Object.keys(shelter.updates)
        .map(key => `${key.includes('.') ? key : `#${key.replace('.', '_')}`} = :${key.replace('.', '_')}`)
        .join(', ');
      
      const expressionValues = {};
      const expressionNames = {};
      
      Object.keys(shelter.updates).forEach(key => {
        expressionValues[`:${key.replace('.', '_')}`] = shelter.updates[key];
        if (!key.includes('.')) {
          expressionNames[`#${key.replace('.', '_')}`] = key;
        }
      });
      expressionValues[':timestamp'] = new Date().toISOString();

      const updateParams = {
        TableName: DEMO_CONFIG.SHELTERS_TABLE,
        Key: { shelterId: shelter.shelterId },
        UpdateExpression: `SET ${updateExpression}, lastUpdated = :timestamp`,
        ExpressionAttributeValues: expressionValues
      };
      
      if (Object.keys(expressionNames).length > 0) {
        updateParams.ExpressionAttributeNames = expressionNames;
      }

      await dynamodb.update(updateParams).promise();

      console.log(`✅ Reset ${shelter.shelterId}`);
      
    } catch (error) {
      console.error(`❌ Failed to reset ${shelter.shelterId}:`, error.message);
    }
  }

  console.log('\n🎯 Demo data reset complete\n');
}

/**
 * Main demo runner
 */
async function runDemo() {
  const scenario = process.argv[2];

  switch (scenario) {
    case 'capacity':
      await scenarioCapacityCrisis();
      break;
    case 'resources':
      await scenarioResourceDepletion();
      break;
    case 'medical':
      await scenarioMedicalEmergency();
      break;
    case 'coordination':
      await scenarioMultiShelterCoordination();
      break;
    case 'reset':
      await resetDemoData();
      break;
    case 'all':
      console.log('🎬 Running All Demo Scenarios\n');
      await resetDemoData();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await scenarioCapacityCrisis();
      await new Promise(resolve => setTimeout(resolve, 3000));
      await scenarioResourceDepletion();
      await new Promise(resolve => setTimeout(resolve, 3000));
      await scenarioMedicalEmergency();
      await new Promise(resolve => setTimeout(resolve, 8000));
      await scenarioMultiShelterCoordination();
      break;
    default:
      console.log('🎬 SafeHaven Demo Scenarios\n');
      console.log('Usage: node demo-scenarios.js [scenario]\n');
      console.log('Available scenarios:');
      console.log('  capacity     - Shelter reaching maximum capacity');
      console.log('  resources    - Resource depletion and critical alerts');
      console.log('  medical      - Medical emergency response');
      console.log('  coordination - Multi-shelter coordination');
      console.log('  reset        - Reset to initial demo state');
      console.log('  all          - Run all scenarios in sequence');
      console.log('\nExample: node demo-scenarios.js capacity');
  }
}

// Run if called directly
if (require.main === module) {
  runDemo().catch(error => {
    console.error('❌ Demo scenario failed:', error);
    process.exit(1);
  });
}

module.exports = {
  scenarioCapacityCrisis,
  scenarioResourceDepletion,
  scenarioMedicalEmergency,
  scenarioMultiShelterCoordination,
  resetDemoData
};