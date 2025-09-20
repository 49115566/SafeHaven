import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Enums from our schema
enum ShelterStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  FULL = 'full',
  EMERGENCY = 'emergency',
  OFFLINE = 'offline'
}

enum ResourceStatus {
  ADEQUATE = 'adequate',
  LOW = 'low',
  CRITICAL = 'critical',
  UNAVAILABLE = 'unavailable'
}

enum UserRole {
  SHELTER_OPERATOR = 'shelter_operator',
  FIRST_RESPONDER = 'first_responder',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  ADMIN = 'admin'
}

enum AlertType {
  CAPACITY_FULL = 'capacity_full',
  RESOURCE_CRITICAL = 'resource_critical',
  MEDICAL_EMERGENCY = 'medical_emergency',
  SECURITY_ISSUE = 'security_issue',
  INFRASTRUCTURE_PROBLEM = 'infrastructure_problem',
  GENERAL_ASSISTANCE = 'general_assistance'
}

enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved'
}

// Dallas-only locations for focused testing
const US_CITIES = [
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 }
];

const SHELTER_TYPES = [
  'Convention Center', 'Community Center', 'School Gymnasium', 'Church Hall',
  'Recreation Center', 'Sports Arena', 'Emergency Shelter', 'Civic Center',
  'Fire Station', 'Library', 'Hospital Annex', 'Military Base', 'High School',
  'Middle School', 'Elementary School', 'YMCA', 'Senior Center', 'Youth Center',
  'Fairgrounds', 'Mall', 'Shopping Center', 'Office Building'
];

const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily',
  'James', 'Ashley', 'William', 'Jessica', 'Richard', 'Amanda', 'Thomas', 'Jennifer'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor'
];

const ORGANIZATIONS = [
  'Red Cross', 'FEMA', 'Salvation Army', 'Local Emergency Management',
  'Fire Department', 'Police Department', 'Emergency Medical Services',
  'National Guard', 'City Emergency Services', 'County Emergency Management'
];

// Utility functions
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;
const randomDate = (start: Date, end: Date): string => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

// Generate 1000 shelters
function generateShelters(): any[] {
  const shelters = [];
  
  for (let i = 0; i < 1000; i++) {
    const city = randomChoice(US_CITIES);
    const shelterType = randomChoice(SHELTER_TYPES);
    const maxCapacity = randomInt(50, 500);
    const currentCapacity = randomInt(0, maxCapacity);
    
    // Add some location variance
    const lat = city.lat + randomFloat(-0.1, 0.1);
    const lng = city.lng + randomFloat(-0.1, 0.1);
    
    const shelter = {
      shelterId: `shelter-${String(i + 1).padStart(4, '0')}`,
      name: `${city.name} ${shelterType}`,
      location: {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        address: `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} St, ${city.name}, ${city.state} ${randomInt(10000, 99999)}`
      },
      capacity: {
        current: currentCapacity,
        maximum: maxCapacity
      },
      resources: {
        food: randomChoice(Object.values(ResourceStatus)),
        water: randomChoice(Object.values(ResourceStatus)),
        medical: randomChoice(Object.values(ResourceStatus)),
        bedding: randomChoice(Object.values(ResourceStatus))
      },
      status: randomChoice(Object.values(ShelterStatus)),
      operatorId: `user-${String(randomInt(1, 200)).padStart(4, '0')}`,
      contactInfo: {
        phone: `+1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}`,
        email: `shelter${i + 1}@${city.name.toLowerCase()}.gov`
      },
      urgentNeeds: Math.random() > 0.7 ? [
        randomChoice(['Medical supplies', 'Food', 'Water', 'Blankets', 'Generators', 'Fuel'])
      ] : [],
      lastUpdated: randomDate(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()),
      createdAt: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(Date.now() - 24 * 60 * 60 * 1000))
    };
    
    shelters.push(shelter);
  }
  
  return shelters;
}

// Generate 1000 users
function generateUsers(): any[] {
  const users = [];
  
  for (let i = 0; i < 1000; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const role = randomChoice(Object.values(UserRole));
    
    const user = {
      userId: `user-${String(i + 1).padStart(4, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@safehaven.org`,
      passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfm', // "password123"
      role,
      profile: {
        firstName,
        lastName,
        phone: Math.random() > 0.3 ? `+1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}` : undefined,
        organization: Math.random() > 0.5 ? randomChoice(ORGANIZATIONS) : undefined
      },
      shelterId: role === UserRole.SHELTER_OPERATOR ? `shelter-${String(randomInt(1, 1000)).padStart(4, '0')}` : undefined,
      isActive: Math.random() > 0.05, // 95% active
      createdAt: randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()),
      lastLogin: Math.random() > 0.2 ? randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()) : undefined
    };
    
    users.push(user);
  }
  
  return users;
}

// Generate 1000 alerts
function generateAlerts(): any[] {
  const alerts = [];
  
  for (let i = 0; i < 1000; i++) {
    const alertType = randomChoice(Object.values(AlertType));
    const priority = randomChoice(Object.values(AlertPriority));
    const status = randomChoice(Object.values(AlertStatus));
    const createdAt = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
    
    const alert = {
      alertId: `alert-${String(i + 1).padStart(4, '0')}`,
      shelterId: `shelter-${String(randomInt(1, 1000)).padStart(4, '0')}`,
      type: alertType,
      priority,
      title: getAlertTitle(alertType),
      description: getAlertDescription(alertType),
      status,
      createdBy: `user-${String(randomInt(1, 1000)).padStart(4, '0')}`,
      acknowledgedBy: status !== AlertStatus.OPEN ? `user-${String(randomInt(1, 1000)).padStart(4, '0')}` : undefined,
      acknowledgedAt: status !== AlertStatus.OPEN ? randomDate(new Date(createdAt), new Date()) : undefined,
      resolvedAt: status === AlertStatus.RESOLVED ? randomDate(new Date(createdAt), new Date()) : undefined,
      timestamp: new Date(createdAt).getTime(),
      createdAt
    };
    
    alerts.push(alert);
  }
  
  return alerts;
}

function getAlertTitle(type: AlertType): string {
  const titles = {
    [AlertType.CAPACITY_FULL]: 'Shelter at Full Capacity',
    [AlertType.RESOURCE_CRITICAL]: 'Critical Resource Shortage',
    [AlertType.MEDICAL_EMERGENCY]: 'Medical Emergency Assistance Needed',
    [AlertType.SECURITY_ISSUE]: 'Security Incident Reported',
    [AlertType.INFRASTRUCTURE_PROBLEM]: 'Infrastructure Failure',
    [AlertType.GENERAL_ASSISTANCE]: 'General Assistance Request'
  };
  return titles[type];
}

function getAlertDescription(type: AlertType): string {
  const descriptions = {
    [AlertType.CAPACITY_FULL]: 'Shelter has reached maximum capacity and cannot accept additional evacuees.',
    [AlertType.RESOURCE_CRITICAL]: 'Critical shortage of essential supplies including food, water, or medical supplies.',
    [AlertType.MEDICAL_EMERGENCY]: 'Medical emergency requiring immediate professional medical attention.',
    [AlertType.SECURITY_ISSUE]: 'Security incident requiring law enforcement or security personnel response.',
    [AlertType.INFRASTRUCTURE_PROBLEM]: 'Infrastructure failure affecting shelter operations including power, water, or HVAC systems.',
    [AlertType.GENERAL_ASSISTANCE]: 'General assistance request for shelter operations or evacuee needs.'
  };
  return descriptions[type];
}

// Main generation function
function generateAllData() {
  console.log('Generating test data...');
  
  const shelters = generateShelters();
  const users = generateUsers();
  const alerts = generateAlerts();
  
  // Create data directory
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write data files
  fs.writeFileSync(path.join(dataDir, 'shelters.json'), JSON.stringify(shelters, null, 2));
  fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
  fs.writeFileSync(path.join(dataDir, 'alerts.json'), JSON.stringify(alerts, null, 2));
  
  console.log(`Generated ${shelters.length} shelters`);
  console.log(`Generated ${users.length} users`);
  console.log(`Generated ${alerts.length} alerts`);
  console.log('Data files saved to backend/data/');
}

// Run if called directly
if (require.main === module) {
  generateAllData();
}

export { generateAllData };