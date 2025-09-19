// Shared types between mobile app and backend
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
  lastUpdated: string;
  createdAt: string;
}

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
  timestamp: number;
  createdAt: string;
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

// Mobile-specific types
export interface AppState {
  auth: AuthState;
  shelter: ShelterState;
  alerts: AlertState;
  network: NetworkState;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ShelterState {
  currentShelter: Shelter | null;
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
}

export interface AlertState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
}

export interface NetworkState {
  isConnected: boolean;
  isOnline: boolean;
  pendingUpdates: ShelterStatusUpdate[];
}