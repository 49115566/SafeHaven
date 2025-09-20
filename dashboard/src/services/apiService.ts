import { Shelter, Alert, ApiResponse, AuthResponse, User } from 'safehaven-shared';

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
    const response = await this.makeRequest<Shelter[]>('/api/shelters', {
      method: 'GET'
    });
    return response.data || [];
  }

  /**
   * Get shelter by ID
   */
  public async getShelter(shelterId: string): Promise<Shelter | null> {
    const response = await this.makeRequest<Shelter>(`/api/shelters/${shelterId}`, {
      method: 'GET'
    });
    return response.data || null;
  }

  /**
   * Get all alerts
   */
  public async getAlerts(): Promise<Alert[]> {
    const response = await this.makeRequest<Alert[]>('/api/alerts', {
      method: 'GET'
    });
    return response.data || [];
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<Alert | null> {
    const response = await this.makeRequest<Alert>(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });
    return response.data || null;
  }

  /**
   * Login with credentials
   */
  public async login(email: string, password: string): Promise<AuthResponse | null> {
    const response = await this.makeRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response.data || null;
  }

  /**
   * Verify current token
   */
  public async verifyToken(): Promise<User | null> {
    if (!this.token) return null;
    
    const response = await this.makeRequest<User>('/api/auth/verify', {
      method: 'GET'
    });
    return response.data || null;
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
        throw new Error(
          responseData.error?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return responseData;

    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Return standardized error response
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
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