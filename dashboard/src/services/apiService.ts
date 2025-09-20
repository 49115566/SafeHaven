import { Shelter, Alert, ApiResponse, AuthResponse, User } from 'safehaven-shared';
import { withRetry } from '../utils/errorHandler';

export interface ApiServiceConfig {
  baseUrl: string;
  timeout?: number;
}

export class ApiService {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;

  constructor(config: ApiServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Set authentication token for subsequent requests
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  public clearToken(): void {
    this.token = null;
  }

  /**
   * Get all shelters
   */
  public async getShelters(): Promise<Shelter[]> {
    return withRetry(async () => {
      const response = await this.makeRequest<Shelter[]>('/api/shelters', {
        method: 'GET'
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch shelters');
      }
      
      return response.data || [];
    }, 3, 1000, { component: 'ApiService', action: 'getShelters', timestamp: new Date().toISOString() });
  }

  /**
   * Get shelter by ID
   */
  public async getShelter(shelterId: string): Promise<Shelter | null> {
    return withRetry(async () => {
      const response = await this.makeRequest<Shelter>(`/api/shelters/${shelterId}`, {
        method: 'GET'
      });
      
      if (!response.success) {
        if (response.error?.statusCode === 404) {
          return null;
        }
        throw new Error(response.error?.message || 'Failed to fetch shelter');
      }
      
      return response.data || null;
    }, 2, 1000, { component: 'ApiService', action: 'getShelter', timestamp: new Date().toISOString() });
  }

  /**
   * Get all alerts
   */
  public async getAlerts(): Promise<Alert[]> {
    return withRetry(async () => {
      const response = await this.makeRequest<Alert[]>('/api/alerts', {
        method: 'GET'
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch alerts');
      }
      
      return response.data || [];
    }, 3, 1000, { component: 'ApiService', action: 'getAlerts', timestamp: new Date().toISOString() });
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<Alert | null> {
    return withRetry(async () => {
      const response = await this.makeRequest<Alert>(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to acknowledge alert');
      }
      
      return response.data || null;
    }, 2, 1000, { component: 'ApiService', action: 'acknowledgeAlert', timestamp: new Date().toISOString() });
  }

  /**
   * Login with credentials
   */
  public async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const response = await this.makeRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
        return response.data;
      } else {
        console.error('Login failed:', response.error?.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Login request failed:', error);
      return null;
    }
  }

  /**
   * Register new user
   */
  public async register(userData: {
    email: string;
    password: string;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
      organization?: string;
    };
    role: string;
  }): Promise<AuthResponse | null> {
    try {
      const response = await this.makeRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success && response.data?.token) {
        this.setToken(response.data.token);
        return response.data;
      } else {
        console.error('Registration failed:', response.error?.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Registration request failed:', error);
      return null;
    }
  }

  /**
   * Verify current token
   */
  public async verifyToken(): Promise<User | null> {
    if (!this.token) return null;
    
    try {
      const response = await this.makeRequest<User>('/api/auth/verify', {
        method: 'GET'
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        // Token is invalid, clear it
        this.clearToken();
        return null;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear invalid token
      this.clearToken();
      return null;
    }
  }

  /**
   * Make HTTP request with error handling and authentication
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Set default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    // Add authorization header if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseData: ApiResponse<T>;

      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse response JSON: ${parseError}`);
      }

      if (!response.ok) {
        const errorMessage = responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        (error as any).response = { status: response.status, data: responseData };
        throw error;
      }

      return responseData;

    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: {
              message: 'Request timeout',
              statusCode: 408
            },
            timestamp: new Date().toISOString()
          };
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return {
            success: false,
            error: {
              message: 'Network connection failed',
              statusCode: 0
            },
            timestamp: new Date().toISOString()
          };
        }
        
        const statusCode = (error as any).statusCode || 500;
        return {
          success: false,
          error: {
            message: error.message,
            statusCode
          },
          timestamp: new Date().toISOString()
        };
      }
      
      // Return standardized error response
      return {
        success: false,
        error: {
          message: 'Unknown error occurred',
          statusCode: 500
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
let apiService: ApiService | null = null;

export function getApiService(): ApiService {
  if (!apiService) {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3010';
    apiService = new ApiService({ baseUrl });
  }
  return apiService;
}