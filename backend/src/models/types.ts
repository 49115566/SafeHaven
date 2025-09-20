// Shared types across all SafeHaven Connect applications
// This ensures type consistency between backend, mobile, and dashboard

export interface Shelter {
  shelterId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  capacity: {
    current: number;
    maximum: number;
  };
  resources: {
    food: ResourceStatus;
    water: ResourceStatus;
    medical: ResourceStatus;
    bedding: ResourceStatus;
  };
  status: ShelterStatus;
  operatorId: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  urgentNeeds: string[];
  lastUpdated: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

export enum ShelterStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  FULL = 'full',
  EMERGENCY = 'emergency',
  OFFLINE = 'offline'
}

export enum ResourceStatus {
  ADEQUATE = 'adequate',
  LOW = 'low',
  CRITICAL = 'critical',
  UNAVAILABLE = 'unavailable'
}

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    organization?: string;
  };
  shelterId?: string; // For shelter operators
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  passwordHash?: string; // For internal use
}

// Public user interface (without sensitive data)
export interface PublicUser {
  userId: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    organization?: string;
  };
  shelterId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export enum UserRole {
  SHELTER_OPERATOR = 'shelter_operator',
  FIRST_RESPONDER = 'first_responder',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  ADMIN = 'admin'
}

export interface Alert {
  alertId: string;
  shelterId: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  status: AlertStatus;
  createdBy: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  timestamp: number; // Unix timestamp for sorting
  createdAt: string; // ISO timestamp
}

export enum AlertType {
  CAPACITY_FULL = 'capacity_full',
  RESOURCE_CRITICAL = 'resource_critical',
  MEDICAL_EMERGENCY = 'medical_emergency',
  SECURITY_ISSUE = 'security_issue',
  INFRASTRUCTURE_PROBLEM = 'infrastructure_problem',
  GENERAL_ASSISTANCE = 'general_assistance'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Backend-specific types
export interface ShelterStatusUpdate {
  shelterId: string;
  capacity?: {
    current: number;
    maximum: number;
  };
  resources?: Partial<{
    food: ResourceStatus;
    water: ResourceStatus;
    medical: ResourceStatus;
    bedding: ResourceStatus;
  }>;
  status?: ShelterStatus;
  urgentNeeds?: string[];
  timestamp: string;
}

// Database Record types
export interface AlertRecord extends Alert {
  alertId: string; // Primary key
  GSI1PK?: string; // GSI partition key (e.g., 'SHELTER#shelter-123')
  GSI1SK?: string; // GSI sort key (e.g., 'ALERT#timestamp')
}

export interface UserRecord extends User {
  userId: string; // Primary key
  GSI1PK?: string; // GSI partition key (e.g., 'ROLE#shelter_operator')
  GSI1SK?: string; // GSI sort key (e.g., 'USER#email')
}

export interface ShelterRecord extends Shelter {
  shelterId: string; // Primary key
  GSI1PK?: string; // GSI partition key (e.g., 'STATUS#available')
  GSI1SK?: string; // GSI sort key (e.g., 'SHELTER#name')
}

// JWT and Auth Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}