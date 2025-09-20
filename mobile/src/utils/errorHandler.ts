import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  shelterId?: string;
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

export class OfflineError extends SafeHavenError {
  constructor(message: string = 'Operation requires internet connection') {
    super(message, 'OFFLINE_ERROR', undefined, undefined, true, false);
  }
}

/**
 * Global error handler for the mobile app
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: SafeHavenError; context?: ErrorContext }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle error with appropriate user feedback
   */
  handleError(error: unknown, context?: ErrorContext, showAlert: boolean = true): SafeHavenError {
    const safeHavenError = this.normalizeError(error);
    
    // Log error
    this.logError(safeHavenError, context);
    
    // Show user-friendly alert if requested
    if (showAlert) {
      this.showErrorAlert(safeHavenError);
    }
    
    return safeHavenError;
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
      if (error.message.includes('Network Error') || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout')) {
        return new NetworkError(error.message);
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
      timestamp: new Date().toISOString()
    };

    console.error('SafeHaven Error:', logEntry);
    
    // Store in memory (limited to last 50 errors)
    this.errorLog.push({ error, context });
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    // Store critical errors in AsyncStorage for crash reporting
    if (error.code === 'CRITICAL_ERROR' || error.statusCode === 500) {
      this.storeCriticalError(logEntry);
    }
  }

  /**
   * Show user-friendly error alert
   */
  private showErrorAlert(error: SafeHavenError): void {
    let title = 'Error';
    let message = error.message;
    let buttons: any[] = [{ text: 'OK' }];

    switch (error.code) {
      case 'NETWORK_ERROR':
        title = 'Connection Problem';
        message = 'Please check your internet connection and try again.';
        if (error.isRetryable) {
          buttons = [
            { text: 'Cancel' },
            { text: 'Retry', onPress: () => this.retryLastOperation() }
          ];
        }
        break;

      case 'AUTHENTICATION_ERROR':
        title = 'Authentication Required';
        message = 'Please log in again to continue.';
        buttons = [
          { text: 'Cancel' },
          { text: 'Login', onPress: () => this.navigateToLogin() }
        ];
        break;

      case 'VALIDATION_ERROR':
        title = 'Invalid Input';
        message = 'Please check your input and try again.';
        break;

      case 'OFFLINE_ERROR':
        title = 'Offline Mode';
        message = 'This action will be completed when you\'re back online.';
        break;

      default:
        title = 'Something went wrong';
        message = 'Please try again. If the problem persists, contact support.';
    }

    Alert.alert(title, message, buttons);
  }

  /**
   * Store critical errors for crash reporting
   */
  private async storeCriticalError(logEntry: any): Promise<void> {
    try {
      const existingErrors = await AsyncStorage.getItem('criticalErrors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      errors.push(logEntry);
      
      // Keep only last 10 critical errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      await AsyncStorage.setItem('criticalErrors', JSON.stringify(errors));
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
   * Retry last operation (placeholder - implement based on app needs)
   */
  private retryLastOperation(): void {
    // This would be implemented to retry the last failed operation
    console.log('Retry operation requested');
  }

  /**
   * Navigate to login (placeholder - implement based on navigation)
   */
  private navigateToLogin(): void {
    // This would be implemented to navigate to login screen
    console.log('Navigate to login requested');
  }
}

/**
 * Async wrapper with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  showAlert: boolean = true
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    ErrorHandler.getInstance().handleError(error, context, showAlert);
    return null;
  }
}

/**
 * Retry mechanism for mobile operations
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
    return error.message.includes('Network Error') ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('timeout') ||
           error.message.includes('fetch');
  }
  
  return false;
}