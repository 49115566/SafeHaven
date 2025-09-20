import { APIGatewayProxyEvent } from 'aws-lambda';
import { ValidationError } from './errorHandler';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => string | null;
}

export interface RequestValidationOptions {
  body?: ValidationRule[];
  pathParameters?: ValidationRule[];
  queryParameters?: ValidationRule[];
  headers?: ValidationRule[];
}

/**
 * Validate API Gateway request
 */
export function validateRequest(
  event: APIGatewayProxyEvent,
  options: RequestValidationOptions
): { body?: any; pathParameters?: any; queryParameters?: any; headers?: any } {
  const result: any = {};
  const errors: string[] = [];

  // Validate body
  if (options.body) {
    let bodyData: any = {};
    
    if (event.body) {
      try {
        bodyData = JSON.parse(event.body);
      } catch (error) {
        throw new ValidationError('Invalid JSON in request body');
      }
    }
    
    const bodyErrors = validateObject(bodyData, options.body, 'body');
    errors.push(...bodyErrors);
    result.body = bodyData;
  }

  // Validate path parameters
  if (options.pathParameters) {
    const pathErrors = validateObject(
      event.pathParameters || {},
      options.pathParameters,
      'pathParameters'
    );
    errors.push(...pathErrors);
    result.pathParameters = event.pathParameters;
  }

  // Validate query parameters
  if (options.queryParameters) {
    const queryErrors = validateObject(
      event.queryStringParameters || {},
      options.queryParameters,
      'queryParameters'
    );
    errors.push(...queryErrors);
    result.queryParameters = event.queryStringParameters;
  }

  // Validate headers
  if (options.headers) {
    const headerErrors = validateObject(
      event.headers || {},
      options.headers,
      'headers'
    );
    errors.push(...headerErrors);
    result.headers = event.headers;
  }

  if (errors.length > 0) {
    throw new ValidationError('Request validation failed', errors);
  }

  return result;
}

/**
 * Validate object against rules
 */
function validateObject(data: any, rules: ValidationRule[], context: string): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];
    const fieldPath = `${context}.${rule.field}`;

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldPath} is required`);
      continue;
    }

    // Skip validation if field is not required and not present
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (rule.type && !validateType(value, rule.type)) {
      errors.push(`${fieldPath} must be of type ${rule.type}`);
      continue;
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldPath} must be at least ${rule.minLength} characters long`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldPath} must be no more than ${rule.maxLength} characters long`);
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldPath} format is invalid`);
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${fieldPath} must be at least ${rule.min}`);
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${fieldPath} must be no more than ${rule.max}`);
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${fieldPath} must be one of: ${rule.enum.join(', ')}`);
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(`${fieldPath}: ${customError}`);
      }
    }
  }

  return errors;
}

/**
 * Validate value type
 */
function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return false;
  }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SHELTER_ID: /^shelter-[a-zA-Z0-9-]+$/,
  USER_ID: /^user-[a-zA-Z0-9-]+$/,
  ALERT_ID: /^alert-[a-zA-Z0-9-]+$/
};

/**
 * Common validation rules
 */
export const CommonRules = {
  email: {
    field: 'email',
    required: true,
    type: 'string' as const,
    pattern: ValidationPatterns.EMAIL,
    maxLength: 255
  },
  
  password: {
    field: 'password',
    required: true,
    type: 'string' as const,
    minLength: 8,
    maxLength: 128
  },
  
  shelterId: {
    field: 'shelterId',
    required: true,
    type: 'string' as const,
    pattern: ValidationPatterns.SHELTER_ID
  },
  
  latitude: {
    field: 'latitude',
    required: true,
    type: 'number' as const,
    min: -90,
    max: 90
  },
  
  longitude: {
    field: 'longitude',
    required: true,
    type: 'number' as const,
    min: -180,
    max: 180
  }
};