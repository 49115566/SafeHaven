import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { responseHelper } from './responseHelper';

export interface ErrorContext {
  functionName?: string;
  userId?: string;
  requestId?: string;
  timestamp: string;
}

export class SafeHavenError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'SafeHavenError';
    this.statusCode = statusCode;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
  }
}

export class ValidationError extends SafeHavenError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends SafeHavenError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends SafeHavenError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends SafeHavenError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class RateLimitError extends SafeHavenError {
  constructor(message: string, resetTime?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR', { resetTime });
  }
}

export class DatabaseError extends SafeHavenError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends SafeHavenError {
  constructor(service: string, message: string = 'External service unavailable') {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * Global error handler for Lambda functions
 */
export function withErrorHandler(
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>,
  functionName?: string
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const context: ErrorContext = {
      functionName,
      requestId: event.requestContext.requestId,
      timestamp: new Date().toISOString()
    };

    try {
      return await handler(event);
    } catch (error) {
      return handleError(error, context);
    }
  };
}

/**
 * Handle different types of errors and return appropriate responses
 */
export function handleError(error: unknown, context?: ErrorContext): APIGatewayProxyResult {
  // Log error with context
  console.error('Error occurred:', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context
  });

  // Handle SafeHaven custom errors
  if (error instanceof SafeHavenError) {
    return responseHelper.error(error.message, error.statusCode, {
      code: error.code,
      details: error.details,
      context
    });
  }

  // Handle AWS SDK errors
  if (error && typeof error === 'object' && 'name' in error) {
    const awsError = error as any;
    
    switch (awsError.name) {
      case 'ResourceNotFoundException':
        return responseHelper.notFound('Resource not found');
      
      case 'ConditionalCheckFailedException':
        return responseHelper.badRequest('Operation failed due to data conflict');
      
      case 'ValidationException':
        return responseHelper.badRequest('Invalid request parameters');
      
      case 'ThrottlingException':
      case 'ProvisionedThroughputExceededException':
        return responseHelper.error('Service temporarily overloaded', 503);
      
      case 'AccessDeniedException':
        return responseHelper.forbidden('Access denied');
      
      case 'UnauthorizedException':
        return responseHelper.unauthorized('Authentication failed');
    }
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return responseHelper.badRequest('Invalid JSON in request body');
  }

  // Handle timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    return responseHelper.error('Request timeout', 408);
  }

  // Handle network errors
  if (error instanceof Error && (
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ETIMEDOUT')
  )) {
    return responseHelper.error('Network connectivity issue', 503);
  }

  // Default to internal server error
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return responseHelper.internalError(
    process.env.NODE_ENV === 'development' ? message : 'Internal server error'
  );
}

/**
 * Async wrapper for error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof SafeHavenError) {
      throw error;
    }
    
    throw new SafeHavenError(
      errorMessage || 'Operation failed',
      500,
      'ASYNC_OPERATION_ERROR',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Retry mechanism for operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Don't retry on client errors (4xx)
      if (error instanceof SafeHavenError && error.statusCode >= 400 && error.statusCode < 500) {
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
}