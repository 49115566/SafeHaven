#!/usr/bin/env node

/**
 * SafeHaven Demo Data Seeding Script
 * Creates realistic test data for hackathon demonstration
 */

const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Demo data configuration
const DEMO_CONFIG = {
  USERS_TABLE: process.env.USERS_TABLE || 'SafeHaven-Users-dev',
  SHELTERS_TABLE: process.env.SHELTERS_TABLE || 'SafeHaven-Shelters-dev',
  ALERTS_TABLE: process.env.ALERTS_TABLE || 'SafeHaven-Alerts-dev'
};

// Check if running in demo mode without AWS
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.AWS_ACCESS_KEY_ID;

// Demo shelter locations (geographically diverse)
const DEMO_SHELTERS = [
  {
    shelterId: 'shelter-dallas-001',
    name: 'Dallas Convention Center',
    location: {
      latitude: 32.7767,
      longitude: -96.7970,
      address: '650 S Griffin St, Dallas, TX 75202'
    },
    capacity: { current: 234, maximum: 500 },
    resources: { food: 'adequate', water: 'low', medical: 'adequate', bedding: 'adequate' },
    status: 'available',
    operatorId: 'demo-operator-1@safehaven.com',
    contactInfo: { phone: '+1-214-555-0101', email: 'dallas.ops@safehaven.com' },
    urgentNeeds: ['water supplies'],
    lastUpdated: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    shelterId: 'shelter-houston-001',
    name: 'Houston Community Center',
    location: {
      latitude: 29.7604,
      longitude: -95.3698,
      address: '1001 Avenidas de las Americas, Houston, TX 77010'
    },
    capacity: { current: 89, maximum: 200 },
    resources: { food: 'adequate', water: 'adequate', medical: 'critical', bedding: 'low' },
    status: 'limited',
    operatorId: 'demo-operator-2@safehaven.com',
    contactInfo: { phone: '+1-713-555-0102', email: 'houston.ops@safehaven.com' },
    urgentNeeds: ['medical supplies', 'blankets'],
    lastUpdated: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    shelterId: 'shelter-austin-001',
    name: 'Austin Emergency Shelter',
    location: {
      latitude: 30.2672,
      longitude: -97.7431,
      address: '500 E Cesar Chavez St, Austin, TX 78701'
    },
    capacity: { current: 150, maximum: 150 },
    resources: { food: 'low', water: 'adequate', medical: 'adequate', bedding: 'critical' },
    status: 'full',
    operatorId: 'demo-operator-3@safehaven.com',
    contactInfo: { phone: '+1-512-555-0103', email: 'austin.ops@safehaven.com' },
    urgentNeeds: ['additional capacity', 'bedding'],
    lastUpdated: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
    createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    shelterId: 'shelter-sanantonio-001',
    name: 'San Antonio Relief Center',
    location: {
      latitude: 29.4241,
      longitude: -98.4936,
      address: '100 Auditorium Cir, San Antonio, TX 78205'
    },
    capacity: { current: 45, maximum: 300 },
    resources: { food: 'adequate', water: 'adequate', medical: 'adequate', bedding: 'adequate' },
    status: 'available',
    operatorId: 'demo-operator-4@safehaven.com',
    contactInfo: { phone: '+1-210-555-0104', email: 'sanantonio.ops@safehaven.com' },
    urgentNeeds: [],
    lastUpdated: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
  },
  {
    shelterId: 'shelter-fortworth-001',
    name: 'Fort Worth Emergency Hub',
    location: {
      latitude: 32.7555,
      longitude: -97.3308,
      address: '1111 Houston St, Fort Worth, TX 76102'
    },
    capacity: { current: 0, maximum: 250 },
    resources: { food: 'adequate', water: 'adequate', medical: 'low', bedding: 'adequate' },
    status: 'offline',
    operatorId: 'demo-operator-5@safehaven.com',
    contactInfo: { phone: '+1-817-555-0105', email: 'fortworth.ops@safehaven.com' },
    urgentNeeds: ['generator repair'],
    lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    createdAt: new Date(Date.now() - 432000000).toISOString() // 5 days ago
  }
];

// Demo user accounts
const DEMO_USERS = [
  {
    userId: 'demo-operator-1@safehaven.com',
    email: 'demo-operator-1@safehaven.com',
    passwordHash: '', // Will be set below
    role: 'shelter_operator',
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-214-555-0101',
      organization: 'Dallas Emergency Services'
    },
    shelterId: 'shelter-dallas-001',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 300000).toISOString()
  },
  {
    userId: 'demo-operator-2@safehaven.com',
    email: 'demo-operator-2@safehaven.com',
    passwordHash: '', // Will be set below
    role: 'shelter_operator',
    profile: {
      firstName: 'Michael',
      lastName: 'Rodriguez',
      phone: '+1-713-555-0102',
      organization: 'Houston Relief Network'
    },
    shelterId: 'shelter-houston-001',
    isActive: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    lastLogin: new Date(Date.now() - 600000).toISOString()
  },
  {
    userId: 'demo-responder-1@safehaven.com',
    email: 'demo-responder-1@safehaven.com',
    passwordHash: '', // Will be set below
    role: 'first_responder',
    profile: {
      firstName: 'Jessica',
      lastName: 'Chen',
      phone: '+1-214-555-0201',
      organization: 'Dallas Fire Department'
    },
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastLogin: new Date(Date.now() - 120000).toISOString()
  },
  {
    userId: 'demo-operator-3@safehaven.com',
    email: 'demo-operator-3@safehaven.com',
    passwordHash: '', // Will be set below
    role: 'shelter_operator',
    profile: {
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1-512-555-0103',
      organization: 'Austin Emergency Services'
    },
    shelterId: 'shelter-austin-001',
    isActive: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    lastLogin: new Date(Date.now() - 1800000).toISOString()
  },
  {
    userId: 'demo-coordinator-1@safehaven.com',
    email: 'demo-coordinator-1@safehaven.com',
    passwordHash: '', // Will be set below
    role: 'emergency_coordinator',
    profile: {
      firstName: 'David',
      lastName: 'Thompson',
      phone: '+1-214-555-0301',
      organization: 'Texas Emergency Management'
    },
    isActive: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    lastLogin: new Date(Date.now() - 60000).toISOString()
  }
];

// Demo alerts
const DEMO_ALERTS = [
  {
    alertId: 'alert-001',
    shelterId: 'shelter-houston-001',
    type: 'medical_emergency',
    priority: 'critical',
    title: 'Medical Emergency - Cardiac Event',
    description: 'Elderly evacuee experiencing chest pains. Need immediate paramedic assistance.',
    status: 'acknowledged',
    createdBy: 'demo-operator-2@safehaven.com',
    acknowledgedBy: 'demo-responder-1@safehaven.com',
    acknowledgedAt: new Date(Date.now() - 180000).toISOString(),
    timestamp: Date.now() - 300000,
    createdAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    alertId: 'alert-002',
    shelterId: 'shelter-austin-001',
    type: 'capacity_full',
    priority: 'high',
    title: 'Shelter at Maximum Capacity',
    description: 'We have reached our maximum capacity of 150 people. Need overflow shelter options.',
    status: 'in_progress',
    createdBy: 'demo-operator-3@safehaven.com',
    acknowledgedBy: 'demo-coordinator-1@safehaven.com',
    acknowledgedAt: new Date(Date.now() - 480000).toISOString(),
    timestamp: Date.now() - 600000,
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    alertId: 'alert-003',
    shelterId: 'shelter-dallas-001',
    type: 'resource_critical',
    priority: 'medium',
    title: 'Water Supply Running Low',
    description: 'Our water reserves are at 20%. Need water delivery within 4 hours.',
    status: 'open',
    createdBy: 'demo-operator-1@safehaven.com',
    timestamp: Date.now() - 900000,
    createdAt: new Date(Date.now() - 900000).toISOString()
  }
];

// Default password for all demo accounts
const DEMO_PASSWORD = 'SafeHaven2025!';

/**
 * Hash password for demo users
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Seed users table
 */
async function seedUsers() {
  console.log('🔐 Seeding demo users...');
  
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  
  for (const user of DEMO_USERS) {
    user.passwordHash = passwordHash;
    
    try {
      await dynamodb.put({
        TableName: DEMO_CONFIG.USERS_TABLE,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)'
      }).promise();
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        console.log(`⚠️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
      }
    }
  }
}

/**
 * Seed shelters table
 */
async function seedShelters() {
  console.log('🏠 Seeding demo shelters...');
  
  for (const shelter of DEMO_SHELTERS) {
    try {
      await dynamodb.put({
        TableName: DEMO_CONFIG.SHELTERS_TABLE,
        Item: shelter,
        ConditionExpression: 'attribute_not_exists(shelterId)'
      }).promise();
      
      console.log(`✅ Created shelter: ${shelter.name} (${shelter.status})`);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        console.log(`⚠️ Shelter already exists: ${shelter.name}`);
      } else {
        console.error(`❌ Failed to create shelter ${shelter.name}:`, error.message);
      }
    }
  }
}

/**
 * Seed alerts table
 */
async function seedAlerts() {
  console.log('🚨 Seeding demo alerts...');
  
  for (const alert of DEMO_ALERTS) {
    try {
      await dynamodb.put({
        TableName: DEMO_CONFIG.ALERTS_TABLE,
        Item: alert,
        ConditionExpression: 'attribute_not_exists(alertId)'
      }).promise();
      
      console.log(`✅ Created alert: ${alert.title} (${alert.priority})`);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        console.log(`⚠️ Alert already exists: ${alert.title}`);
      } else {
        console.error(`❌ Failed to create alert ${alert.title}:`, error.message);
      }
    }
  }
}

/**
 * Main seeding function
 */
async function seedDemoData() {
  console.log('🌱 SafeHaven Demo Data Seeding Started\n');
  
  if (DEMO_MODE) {
    console.log('⚠️ Running in demo mode - AWS not configured');
    console.log('📋 Demo data structure verified:');
    console.log(`  - ${DEMO_SHELTERS.length} shelters prepared`);
    console.log(`  - ${DEMO_USERS.length} users prepared`);
    console.log(`  - ${DEMO_ALERTS.length} alerts prepared`);
    console.log(`  - Password: ${DEMO_PASSWORD}`);
    console.log('\n✅ Demo data ready for AWS deployment');
    return;
  }
  
  try {
    await seedUsers();
    console.log('');
    
    await seedShelters();
    console.log('');
    
    await seedAlerts();
    console.log('');
    
    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📋 Demo Accounts Created:');
    console.log('Shelter Operators:');
    console.log('  - demo-operator-1@safehaven.com (Dallas)');
    console.log('  - demo-operator-2@safehaven.com (Houston)');
    console.log('First Responders:');
    console.log('  - demo-responder-1@safehaven.com');
    console.log('Emergency Coordinators:');
    console.log('  - demo-coordinator-1@safehaven.com');
    console.log(`\n🔑 Password for all accounts: ${DEMO_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Demo data seeding failed:', error);
    if (error.code === 'CredentialsError' || error.code === 'UnknownEndpoint') {
      console.log('\n💡 Tip: Configure AWS credentials or set DEMO_MODE=true for offline testing');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData();
}

module.exports = {
  seedDemoData,
  DEMO_SHELTERS,
  DEMO_USERS,
  DEMO_ALERTS,
  DEMO_PASSWORD
};