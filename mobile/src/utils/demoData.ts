import { Shelter, User, ShelterStatus, ResourceStatus, UserRole } from '../types';

export const mockUser: User = {
  userId: 'user-123',
  email: 'operator@shelter.com',
  role: UserRole.SHELTER_OPERATOR,
  profile: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '+1-555-0123',
    organization: 'Dallas Emergency Services'
  },
  shelterId: 'shelter-123',
  isActive: true,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString()
};

export const mockShelter: Shelter = {
  shelterId: 'shelter-123',
  name: 'Downtown Community Center',
  location: {
    latitude: 32.7767,
    longitude: -96.7970,
    address: '1234 Main St, Dallas, TX 75201'
  },
  capacity: {
    current: 45,
    maximum: 100
  },
  resources: {
    food: ResourceStatus.ADEQUATE,
    water: ResourceStatus.ADEQUATE,
    medical: ResourceStatus.LOW,
    bedding: ResourceStatus.ADEQUATE
  },
  status: ShelterStatus.AVAILABLE,
  operatorId: 'user-123',
  contactInfo: {
    phone: '+1-555-0123',
    email: 'operator@shelter.com'
  },
  urgentNeeds: [],
  lastUpdated: new Date().toISOString(),
  createdAt: new Date().toISOString()
};

/**
 * Initialize demo data for testing
 * This should be removed in production and replaced with proper API calls
 */
export const initializeDemoData = () => {
  return {
    user: mockUser,
    shelter: mockShelter,
    token: 'demo-jwt-token-123' // Mock JWT token for demo
  };
};