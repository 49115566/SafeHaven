import { ValidationError } from './errorHandler';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormValidationRules {
  [fieldName: string]: ValidationRule;
}

/**
 * Validate form data against rules
 */
export function validateForm(data: Record<string, any>, rules: FormValidationRules): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = data[fieldName];
    const error = validateField(value, rule, fieldName);
    
    if (error) {
      errors[fieldName] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate single field
 */
export function validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `${fieldName} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${fieldName} must be no more than ${rule.maxLength} characters`;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${fieldName} must be at least ${rule.min}`;
    }
    
    if (rule.max !== undefined && value > rule.max) {
      return `${fieldName} must be no more than ${rule.max}`;
    }
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

/**
 * Real-time field validation hook
 */
export function useFieldValidation(
  value: any,
  rule: ValidationRule,
  fieldName: string
): { error: string | null; isValid: boolean } {
  const error = validateField(value, rule, fieldName);
  
  return {
    error,
    isValid: error === null
  };
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  SHELTER_NAME: /^[a-zA-Z0-9\s\-_'.]{3,100}$/,
  ADDRESS: /^[a-zA-Z0-9\s\-_'.,#]{10,200}$/
};

/**
 * Common validation rules
 */
export const CommonValidationRules = {
  email: {
    required: true,
    pattern: ValidationPatterns.EMAIL,
    maxLength: 255
  },
  
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: ValidationPatterns.PASSWORD,
    custom: (value: string) => {
      if (!value) return null;
      
      const errors = [];
      if (!/[a-z]/.test(value)) errors.push('lowercase letter');
      if (!/[A-Z]/.test(value)) errors.push('uppercase letter');
      if (!/\d/.test(value)) errors.push('number');
      
      if (errors.length > 0) {
        return `Password must contain at least one ${errors.join(', ')}`;
      }
      
      return null;
    }
  },
  
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: ValidationPatterns.NAME
  },
  
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: ValidationPatterns.NAME
  },
  
  phone: {
    pattern: ValidationPatterns.PHONE,
    custom: (value: string) => {
      if (!value) return null;
      const cleaned = value.replace(/[\s\-\(\)]/g, '');
      if (cleaned.length < 10 || cleaned.length > 15) {
        return 'Phone number must be 10-15 digits';
      }
      return null;
    }
  },
  
  shelterName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: ValidationPatterns.SHELTER_NAME
  },
  
  address: {
    required: true,
    minLength: 10,
    maxLength: 200,
    pattern: ValidationPatterns.ADDRESS
  },
  
  capacity: {
    required: true,
    min: 1,
    max: 10000,
    custom: (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Capacity must be a valid number';
      }
      if (!Number.isInteger(value)) {
        return 'Capacity must be a whole number';
      }
      return null;
    }
  },
  
  currentCapacity: {
    required: true,
    min: 0,
    custom: (value: number, data?: Record<string, any>) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Current capacity must be a valid number';
      }
      if (!Number.isInteger(value)) {
        return 'Current capacity must be a whole number';
      }
      if (data?.maxCapacity && value > data.maxCapacity) {
        return 'Current capacity cannot exceed maximum capacity';
      }
      return null;
    }
  },
  
  latitude: {
    required: true,
    min: -90,
    max: 90,
    custom: (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Latitude must be a valid number';
      }
      return null;
    }
  },
  
  longitude: {
    required: true,
    min: -180,
    max: 180,
    custom: (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Longitude must be a valid number';
      }
      return null;
    }
  },
  
  alertTitle: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  
  alertDescription: {
    maxLength: 500
  },
  
  urgentNeeds: {
    maxLength: 280,
    custom: (value: string) => {
      if (!value) return null;
      const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
      if (items.length > 10) {
        return 'Maximum 10 urgent needs items allowed';
      }
      return null;
    }
  }
};

/**
 * Validate shelter status update
 */
export function validateShelterStatusUpdate(data: any): ValidationResult {
  const rules: FormValidationRules = {};
  
  if (data.capacity) {
    rules['capacity.current'] = CommonValidationRules.currentCapacity;
    rules['capacity.maximum'] = CommonValidationRules.capacity;
  }
  
  if (data.urgentNeeds) {
    rules.urgentNeeds = CommonValidationRules.urgentNeeds;
  }
  
  return validateForm(data, rules);
}

/**
 * Validate alert creation
 */
export function validateAlertCreation(data: any): ValidationResult {
  const rules: FormValidationRules = {
    title: CommonValidationRules.alertTitle,
    type: { required: true },
    priority: { required: true }
  };
  
  if (data.description) {
    rules.description = CommonValidationRules.alertDescription;
  }
  
  return validateForm(data, rules);
}

/**
 * Validate user registration
 */
export function validateUserRegistration(data: any): ValidationResult {
  const rules: FormValidationRules = {
    email: CommonValidationRules.email,
    password: CommonValidationRules.password,
    firstName: CommonValidationRules.firstName,
    lastName: CommonValidationRules.lastName
  };
  
  if (data.phone) {
    rules.phone = CommonValidationRules.phone;
  }
  
  if (data.shelterInfo) {
    rules['shelterInfo.name'] = CommonValidationRules.shelterName;
    rules['shelterInfo.address'] = CommonValidationRules.address;
    rules['shelterInfo.capacity'] = CommonValidationRules.capacity;
    rules['shelterInfo.latitude'] = CommonValidationRules.latitude;
    rules['shelterInfo.longitude'] = CommonValidationRules.longitude;
  }
  
  return validateForm(data, rules);
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize form data
 */
export function validateAndSanitizeForm(
  data: Record<string, any>,
  rules: FormValidationRules
): { isValid: boolean; errors: Record<string, string>; sanitizedData: Record<string, any> } {
  const validation = validateForm(data, rules);
  const sanitizedData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitizedData[key] = sanitizeInput(value);
    } else {
      sanitizedData[key] = value;
    }
  }
  
  return {
    ...validation,
    sanitizedData
  };
}