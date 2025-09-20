import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { getApiService } from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService');
const mockApiService = getApiService as jest.MockedFunction<typeof getApiService>;

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

// Create a more robust localStorage mock
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useAuth Hook - Token Management Tests', () => {
  let mockApiServiceInstance: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules(); // Clear module cache
    
    // Clear all timers to prevent interference
    jest.clearAllTimers();
    
    // Clear localStorage store
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Create mock API service instance
    mockApiServiceInstance = {
      login: jest.fn(),
      register: jest.fn(),
      verifyToken: jest.fn(),
      setToken: jest.fn(),
      clearToken: jest.fn(),
    };
    
    // Set default behavior
    mockApiServiceInstance.verifyToken.mockResolvedValue(null);
    
    mockApiService.mockReturnValue(mockApiServiceInstance);
    
    // Set default localStorage behavior
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should properly handle token persistence', async () => {
      const mockAuthResponse = {
        token: 'persistent-token',
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'first_responder'
        }
      };

      mockApiServiceInstance.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      // Wait for initial setup with longer timeout to handle test pollution
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      // Verify hook initialization
      expect(result.current).toBeTruthy();

      await act(async () => {
        await result.current?.login('test@example.com', 'password');
      });

      // Verify token is stored with correct key
      expect(localStorageMock.setItem).toHaveBeenCalledWith('safehaven_dashboard_token', 'persistent-token');
      expect(result.current?.token).toBe('persistent-token');
    });

    it('should clean up token on login failure', async () => {
      mockApiServiceInstance.login.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth());

      // Wait for initial setup with longer timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      // Verify hook initialization
      expect(result.current).toBeTruthy();

      await act(async () => {
        await result.current?.login('test@example.com', 'wrongpassword');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('safehaven_dashboard_token');
      expect(mockApiServiceInstance.clearToken).toHaveBeenCalled();
    });

    it('should use correct token storage key', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'first_responder'
      };
      
      mockApiServiceInstance.verifyToken.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('safehaven_dashboard_token');
    });
  });

  describe('Loading States', () => {
    it('should handle loading state during token verification', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      let resolveVerify: (value: any) => void;
      const verifyPromise = new Promise(resolve => {
        resolveVerify = resolve;
      });

      mockApiServiceInstance.verifyToken.mockReturnValue(verifyPromise);

      const { result } = renderHook(() => useAuth());

      // Wait for hook to initialize with longer timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      // Verify the hook initialized properly
      expect(result.current).toBeTruthy();

      // Should start with loading true
      expect(result.current?.isLoading).toBe(true);

      // Resolve verification
      await act(async () => {
        resolveVerify!({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'first_responder'
        });
        await verifyPromise;
      });

      expect(result.current?.isLoading).toBe(false);
      expect(result.current?.isAuthenticated).toBe(true);
    });
  });

  describe('Requirements Compliance', () => {
    it('should meet REQ-FE-002 Authentication Flow requirements', async () => {
      const mockAuthResponse = {
        token: 'jwt-token-test',
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'first_responder'
        }
      };

      mockApiServiceInstance.login.mockResolvedValue(mockAuthResponse);
      mockApiServiceInstance.register.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      // Wait for initial setup with longer timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      // Verify hook initialization
      expect(result.current).toBeTruthy();

      // Test secure login flow
      await act(async () => {
        await result.current?.login('test@example.com', 'password');
      });

      expect(result.current?.isAuthenticated).toBe(true);
      expect(result.current?.user?.email).toBe('test@example.com');

      // Test logout flow
      await act(async () => {
        result.current?.logout();
      });

      expect(result.current?.isAuthenticated).toBe(false);
      expect(result.current?.user).toBeNull();

      // Test registration flow
      await act(async () => {
        await result.current?.register({
          email: 'newuser@example.com',
          password: 'password',
          role: 'first_responder',
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          }
        });
      });

      expect(result.current?.isAuthenticated).toBe(true);
      expect(result.current?.user?.email).toBe('test@example.com');
    });

    it('should meet REQ-SEC-002 Access Control requirements', async () => {
      const mockAuthResponse = {
        token: 'secure-jwt-token',
        user: {
          userId: 'responder-456',
          email: 'responder@fire.gov',
          role: 'first_responder'
        }
      };

      mockApiServiceInstance.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      // Wait for initial setup with longer timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      // Verify hook initialization
      expect(result.current).toBeTruthy();

      await act(async () => {
        await result.current?.login('responder@fire.gov', 'password');
      });

      // Verify role-based access
      expect(result.current?.user?.role).toBe('first_responder');
      expect(result.current?.isAuthenticated).toBe(true);

      // Verify secure token handling - the setToken should be called as part of login success
      expect(localStorageMock.setItem).toHaveBeenCalledWith('safehaven_dashboard_token', 'secure-jwt-token');
      expect(result.current?.token).toBe('secure-jwt-token');
    });

    it('should meet REQ-BE-004 Authentication & Authorization requirements', async () => {
      localStorageMock.getItem.mockReturnValue('existing-jwt-token');
      
      const mockUser = {
        userId: 'coordinator-789',
        email: 'coordinator@emergency.gov',
        role: 'emergency_coordinator'
      };

      mockApiServiceInstance.verifyToken.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      // Wait for initial setup with longer timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25));
      });

      // Verify hook initialization
      expect(result.current).toBeTruthy();

      // Verify JWT verification is called and user state reflects authorization level
      expect(mockApiServiceInstance.setToken).toHaveBeenCalledWith('existing-jwt-token');
      expect(mockApiServiceInstance.verifyToken).toHaveBeenCalled();
      expect(result.current?.user?.role).toBe('emergency_coordinator');
      expect(result.current?.isAuthenticated).toBe(true);
    });
  });
});