import { ShelterStatusUpdate, ResourceStatus, ShelterStatus } from '../models/types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

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