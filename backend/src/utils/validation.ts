// Define types locally to avoid module resolution issues
enum UserRole {
  SHELTER_OPERATOR = 'shelter_operator',
  FIRST_RESPONDER = 'first_responder',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  ADMIN = 'admin'
}

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

interface ShelterStatusUpdate {
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Authentication validation functions
export function validateLoginRequest(data: any): ValidationResult {
  const errors: string[] = [];

  // Handle null/undefined inputs gracefully
  if (!data || typeof data !== 'object') {
    errors.push('Request data is required');
    return { isValid: false, errors };
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRegistrationRequest(data: any): ValidationResult {
  const errors: string[] = [];

  // Handle null/undefined inputs gracefully
  if (!data || typeof data !== 'object') {
    errors.push('Request data is required');
    return { isValid: false, errors };
  }

  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Validate role
  if (!data.role || typeof data.role !== 'string') {
    errors.push('Role is required');
  } else if (!Object.values(UserRole).includes(data.role as UserRole)) {
    errors.push('Invalid role specified');
  }

  // Validate profile
  if (!data.profile || typeof data.profile !== 'object') {
    errors.push('Profile information is required');
  } else {
    if (!data.profile.firstName || typeof data.profile.firstName !== 'string' || data.profile.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!data.profile.lastName || typeof data.profile.lastName !== 'string' || data.profile.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (data.profile.phone && (!isValidPhoneNumber(data.profile.phone))) {
      errors.push('Please provide a valid phone number');
    }
  }

  // Validate shelter info for shelter operators
  if (data.role === UserRole.SHELTER_OPERATOR) {
    if (!data.shelterInfo || typeof data.shelterInfo !== 'object') {
      errors.push('Shelter information is required for shelter operators');
    } else {
      const shelterValidation = validateShelterInfo(data.shelterInfo);
      if (!shelterValidation.isValid) {
        errors.push(...shelterValidation.errors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateShelterInfo(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    errors.push('Shelter name must be at least 3 characters long');
  }

  if (!data.location || typeof data.location !== 'object') {
    errors.push('Shelter location is required');
  } else {
    if (typeof data.location.latitude !== 'number' || data.location.latitude < -90 || data.location.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }

    if (typeof data.location.longitude !== 'number' || data.location.longitude < -180 || data.location.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }

    if (!data.location.address || typeof data.location.address !== 'string' || data.location.address.trim().length < 10) {
      errors.push('Complete address is required (minimum 10 characters)');
    }
  }

  if (!data.capacity || typeof data.capacity !== 'object') {
    errors.push('Shelter capacity information is required');
  } else {
    if (typeof data.capacity.maximum !== 'number' || data.capacity.maximum < 1 || data.capacity.maximum > 10000) {
      errors.push('Maximum capacity must be between 1 and 10,000');
    }
  }

  if (!data.contactInfo || typeof data.contactInfo !== 'object') {
    errors.push('Shelter contact information is required');
  } else {
    if (!data.contactInfo.phone || !isValidPhoneNumber(data.contactInfo.phone)) {
      errors.push('Valid contact phone number is required');
    }

    if (!data.contactInfo.email || !isValidEmail(data.contactInfo.email)) {
      errors.push('Valid contact email address is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePasswordStrength(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain too many repeated characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility validation functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  // International phone number format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Existing validation functions...

export function validateShelterStatusUpdate(data: any): ValidationResult {
  const errors: string[] = [];

  // Validate capacity if provided
  if (data.capacity !== undefined) {
    if (typeof data.capacity !== 'object') {
      errors.push('Capacity must be an object');
    } else {
      if (typeof data.capacity.current !== 'number' || data.capacity.current < 0) {
        errors.push('Current capacity must be a non-negative number');
      }
      if (typeof data.capacity.maximum !== 'number' || data.capacity.maximum < 0) {
        errors.push('Maximum capacity must be a non-negative number');
      }
      if (data.capacity.current > data.capacity.maximum) {
        errors.push('Current capacity cannot exceed maximum capacity');
      }
    }
  }

  // Validate resources if provided
  if (data.resources !== undefined) {
    if (typeof data.resources !== 'object') {
      errors.push('Resources must be an object');
    } else {
      const validResourceStatuses = Object.values(ResourceStatus);
      for (const [resource, status] of Object.entries(data.resources)) {
        if (!['food', 'water', 'medical', 'bedding'].includes(resource)) {
          errors.push(`Invalid resource type: ${resource}`);
        }
        if (!validResourceStatuses.includes(status as ResourceStatus)) {
          errors.push(`Invalid resource status for ${resource}: ${status}`);
        }
      }
    }
  }

  // Validate status if provided
  if (data.status !== undefined) {
    const validStatuses = Object.values(ShelterStatus);
    if (!validStatuses.includes(data.status)) {
      errors.push(`Invalid shelter status: ${data.status}`);
    }
  }

  // Validate urgent needs if provided
  if (data.urgentNeeds !== undefined) {
    if (!Array.isArray(data.urgentNeeds)) {
      errors.push('Urgent needs must be an array');
    } else {
      for (const need of data.urgentNeeds) {
        if (typeof need !== 'string' || need.trim().length === 0) {
          errors.push('Each urgent need must be a non-empty string');
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateShelterCreation(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Shelter name is required and must be a non-empty string');
  }

  if (!data.location || typeof data.location !== 'object') {
    errors.push('Location is required and must be an object');
  } else {
    if (typeof data.location.latitude !== 'number' || data.location.latitude < -90 || data.location.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }
    if (typeof data.location.longitude !== 'number' || data.location.longitude < -180 || data.location.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }
    if (!data.location.address || typeof data.location.address !== 'string') {
      errors.push('Address is required and must be a string');
    }
  }

  if (!data.capacity || typeof data.capacity !== 'object') {
    errors.push('Capacity is required and must be an object');
  } else {
    if (typeof data.capacity.maximum !== 'number' || data.capacity.maximum <= 0) {
      errors.push('Maximum capacity must be a positive number');
    }
  }

  if (!data.contactInfo || typeof data.contactInfo !== 'object') {
    errors.push('Contact info is required');
  } else {
    if (!data.contactInfo.phone || typeof data.contactInfo.phone !== 'string') {
      errors.push('Contact phone is required');
    }
    if (!data.contactInfo.email || typeof data.contactInfo.email !== 'string') {
      errors.push('Contact email is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAlertCreation(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.shelterId || typeof data.shelterId !== 'string') {
    errors.push('Shelter ID is required');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Alert title is required and must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Alert description is required and must be a non-empty string');
  }

  const validTypes = ['capacity_full', 'resource_critical', 'medical_emergency', 'security_issue', 'infrastructure_problem', 'general_assistance'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push(`Alert type must be one of: ${validTypes.join(', ')}`);
  }

  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (!data.priority || !validPriorities.includes(data.priority)) {
    errors.push(`Alert priority must be one of: ${validPriorities.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAlertAcknowledgment(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.responderId || typeof data.responderId !== 'string') {
    errors.push('Responder ID is required');
  }

  if (data.estimatedResponseTime && typeof data.estimatedResponseTime !== 'string') {
    errors.push('Estimated response time must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAlertResolution(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.responderId || typeof data.responderId !== 'string') {
    errors.push('Responder ID is required');
  }

  if (!data.resolution || typeof data.resolution !== 'string' || data.resolution.trim().length === 0) {
    errors.push('Resolution description is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}