export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
}

export class SafeHavenError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: any;
  public isNetworkError: boolean;
  public isRetryable: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    details?: any,
    isNetworkError: boolean = false,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'SafeHavenError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isNetworkError = isNetworkError;
    this.isRetryable = isRetryable;
  }
}

export class NetworkError extends SafeHavenError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', undefined, undefined, true, true);
  }
}

export class AuthenticationError extends SafeHavenError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, undefined, false, false);
  }
}

export class ValidationError extends SafeHavenError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details, false, false);
  }
}

export class WebSocketError extends SafeHavenError {
  constructor(message: string = 'WebSocket connection failed') {
    super(message, 'WEBSOCKET_ERROR', undefined, undefined, true, true);
  }
}

/**
 * Global error handler for the dashboard
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: SafeHavenError; context?: ErrorContext }> = [];
  private notificationCallbacks: Array<(error: SafeHavenError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle error with appropriate user feedback
   */
  handleError(error: unknown, context?: ErrorContext, notify: boolean = true): SafeHavenError {
    const safeHavenError = this.normalizeError(error);
    
    // Log error
    this.logError(safeHavenError, context);
    
    // Notify subscribers if requested
    if (notify) {
      this.notifyError(safeHavenError);
    }
    
    return safeHavenError;
  }

  /**
   * Subscribe to error notifications
   */
  onError(callback: (error: SafeHavenError) => void): () => void {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Convert any error to SafeHavenError
   */
  private normalizeError(error: unknown): SafeHavenError {
    if (error instanceof SafeHavenError) {
      return error;
    }

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to fetch') ||
          error.name === 'TypeError' && error.message.includes('fetch')) {
        return new NetworkError(error.message);
      }

      // WebSocket errors
      if (error.message.includes('WebSocket') || error.message.includes('ws://')) {
        return new WebSocketError(error.message);
      }

      // Authentication errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return new AuthenticationError(error.message);
      }

      // Validation errors
      if (error.message.includes('validation') || error.message.includes('400')) {
        return new ValidationError(error.message);
      }

      return new SafeHavenError(error.message, 'UNKNOWN_ERROR');
    }

    return new SafeHavenError('An unexpected error occurred', 'UNKNOWN_ERROR');
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: SafeHavenError, context?: ErrorContext): void {
    const logEntry = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('SafeHaven Dashboard Error:', logEntry);
    
    // Store in memory (limited to last 100 errors)
    this.errorLog.push({ error, context });
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Store critical errors in localStorage for crash reporting
    if (error.code === 'CRITICAL_ERROR' || error.statusCode === 500) {
      this.storeCriticalError(logEntry);
    }
  }

  /**
   * Notify error subscribers
   */
  private notifyError(error: SafeHavenError): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error notification callback:', callbackError);
      }
    });
  }

  /**
   * Store critical errors for crash reporting
   */
  private storeCriticalError(logEntry: any): void {
    try {
      const existingErrors = localStorage.getItem('safehaven_critical_errors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      errors.push(logEntry);
      
      // Keep only last 20 critical errors
      if (errors.length > 20) {
        errors.splice(0, errors.length - 20);
      }
      
      localStorage.setItem('safehaven_critical_errors', JSON.stringify(errors));
    } catch (storageError) {
      console.error('Failed to store critical error:', storageError);
    }
  }

  /**
   * Get error logs for debugging
   */
  getErrorLogs(): Array<{ error: SafeHavenError; context?: ErrorContext }> {
    return [...this.errorLog];
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLog = [];
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: SafeHavenError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case 'WEBSOCKET_ERROR':
        return 'Real-time connection lost. Attempting to reconnect...';
      
      case 'AUTHENTICATION_ERROR':
        return 'Your session has expired. Please log in again.';
      
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      
      case 'NOT_FOUND_ERROR':
        return 'The requested resource was not found.';
      
      case 'RATE_LIMIT_ERROR':
        return 'Too many requests. Please wait a moment and try again.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }
}

/**
 * Async wrapper with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  notify: boolean = true
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    ErrorHandler.getInstance().handleError(error, context, notify);
    return null;
  }
}

/**
 * Retry mechanism for dashboard operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  context?: ErrorContext
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
      
      // Don't retry on authentication or validation errors
      const safeError = ErrorHandler.getInstance().handleError(error, context, false);
      if (!safeError.isRetryable) {
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
  
  throw ErrorHandler.getInstance().handleError(lastError!, context);
}

/**
 * Network status checker
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof Error) {
    return error.message.includes('fetch') ||
           error.message.includes('NetworkError') ||
           error.message.includes('Failed to fetch') ||
           (error.name === 'TypeError' && error.message.includes('fetch'));
  }
  
  return false;
}

/**
 * React hook for error handling
 */
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();
  
  return {
    handleError: (error: unknown, context?: ErrorContext, notify: boolean = true) => 
      errorHandler.handleError(error, context, notify),
    
    getUserFriendlyMessage: (error: SafeHavenError) => 
      errorHandler.getUserFriendlyMessage(error),
    
    onError: (callback: (error: SafeHavenError) => void) => 
      errorHandler.onError(callback),
    
    getErrorLogs: () => errorHandler.getErrorLogs(),
    
    clearErrorLogs: () => errorHandler.clearErrorLogs()
  };
}