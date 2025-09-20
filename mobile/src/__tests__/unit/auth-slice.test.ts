import { describe, it, expect, beforeEach } from '@jest/globals';
import authSliceReducer, { clearError, setUser, updateUserProfile, setOfflineMode } from '../../store/authSlice';
import { AuthState, UserRole } from '../../types';

describe('Auth Slice Unit Tests', () => {
  let initialState: AuthState;

  beforeEach(() => {
    initialState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    };
  });

  describe('Initial State', () => {
    it('should return the initial state', () => {
      const result = authSliceReducer(undefined, { type: 'unknown' });
      
      expect(result).toEqual(initialState);
    });
  });

  describe('setUser', () => {
    it('should set user credentials and authentication state', () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: UserRole.SHELTER_OPERATOR,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          organization: 'City Emergency Shelter'
        },
        shelterId: 'shelter-123',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const mockToken = 'mock-jwt-token';

      const action = setUser({ user: mockUser, token: mockToken });
      const result = authSliceReducer(initialState, action);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(result.isAuthenticated).toBe(true);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should update state when user is already authenticated', () => {
      const existingState: AuthState = {
        user: {
          userId: 'old-user',
          email: 'old@example.com',
          role: UserRole.SHELTER_OPERATOR,
          profile: { firstName: 'Old', lastName: 'User' },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        token: 'old-token',
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

      const newUser = {
        userId: 'new-user',
        email: 'new@example.com',
        role: UserRole.FIRST_RESPONDER,
        profile: { firstName: 'New', lastName: 'User' },
        isActive: true,
        createdAt: '2025-01-02T00:00:00Z'
      };

      const action = setUser({ user: newUser, token: 'new-token' });
      const result = authSliceReducer(existingState, action);

      expect(result.user).toEqual(newUser);
      expect(result.token).toBe('new-token');
      expect(result.isAuthenticated).toBe(true);
    });

    it('should clear any existing errors when setting user', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Previous login error'
      };

      const mockUser = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: UserRole.ADMIN,
        profile: { firstName: 'Admin', lastName: 'User' },
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const action = setUser({ user: mockUser, token: 'valid-token' });
      const result = authSliceReducer(stateWithError, action);

      expect(result.error).toBeNull();
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Authentication failed'
      };

      const action = clearError();
      const result = authSliceReducer(stateWithError, action);

      expect(result.error).toBeNull();
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should not affect other state when clearing error', () => {
      const authenticatedStateWithError: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@shelter.org',
          role: UserRole.EMERGENCY_COORDINATOR,
          profile: { firstName: 'Test', lastName: 'User' },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        token: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        error: 'Some error'
      };

      const action = clearError();
      const result = authSliceReducer(authenticatedStateWithError, action);

      expect(result.error).toBeNull();
      expect(result.user).toEqual(authenticatedStateWithError.user);
      expect(result.token).toBe(authenticatedStateWithError.token);
      expect(result.isAuthenticated).toBe(true);
    });

    it('should work when no error exists', () => {
      const action = clearError();
      const result = authSliceReducer(initialState, action);

      expect(result).toEqual(initialState);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile when user is authenticated', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@shelter.org',
          role: UserRole.SHELTER_OPERATOR,
          profile: { firstName: 'John', lastName: 'Doe' },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        token: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

      const profileUpdate = {
        profile: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567890',
          organization: 'Updated Organization'
        }
      };

      const action = updateUserProfile(profileUpdate);
      const result = authSliceReducer(authenticatedState, action);

      expect(result.user?.profile.lastName).toBe('Smith');
      expect(result.user?.profile.phone).toBe('+1234567890');
      expect(result.user?.profile.organization).toBe('Updated Organization');
      expect(result.user?.userId).toBe('user-123'); // Should not change
    });

    it('should not update profile when user is not authenticated', () => {
      const profileUpdate = {
        profile: { firstName: 'John', lastName: 'Doe' }
      };

      const action = updateUserProfile(profileUpdate);
      const result = authSliceReducer(initialState, action);

      expect(result.user).toBeNull();
      expect(result).toEqual(initialState);
    });

    it('should partially update user profile', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@shelter.org',
          role: UserRole.FIRST_RESPONDER,
          profile: { 
            firstName: 'Original', 
            lastName: 'Name',
            phone: '+1111111111'
          },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        token: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

      const partialUpdate = {
        profile: { firstName: 'Updated', lastName: 'Name' }
      };

      const action = updateUserProfile(partialUpdate);
      const result = authSliceReducer(authenticatedState, action);

      expect(result.user?.profile.firstName).toBe('Updated');
      expect(result.user?.profile.lastName).toBe('Name');
      expect(result.user?.profile.phone).toBe('+1111111111'); // Should remain unchanged
    });
  });

  describe('setOfflineMode', () => {
    it('should handle offline mode by stopping loading', () => {
      const loadingState: AuthState = {
        ...initialState,
        isLoading: true
      };

      const action = setOfflineMode();
      const result = authSliceReducer(loadingState, action);

      expect(result.isLoading).toBe(false);
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it('should not affect authenticated state in offline mode', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@shelter.org',
          role: UserRole.EMERGENCY_COORDINATOR,
          profile: { firstName: 'Test', lastName: 'User' },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        token: 'valid-token',
        isAuthenticated: true,
        isLoading: true,
        error: null
      };

      const action = setOfflineMode();
      const result = authSliceReducer(authenticatedState, action);

      expect(result.isLoading).toBe(false);
      expect(result.user).toEqual(authenticatedState.user);
      expect(result.isAuthenticated).toBe(true);
      expect(result.token).toBe('valid-token');
    });
  });

  describe('User Role Validation', () => {
    it('should handle all valid user roles', () => {
      const roles = [
        UserRole.SHELTER_OPERATOR, 
        UserRole.FIRST_RESPONDER, 
        UserRole.EMERGENCY_COORDINATOR, 
        UserRole.ADMIN
      ];
      
      roles.forEach(role => {
        const mockUser = {
          userId: `user-${role}`,
          email: `${role}@shelter.org`,
          role: role,
          profile: { firstName: 'Test', lastName: 'User' },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        };

        const action = setUser({ user: mockUser, token: 'valid-token' });
        const result = authSliceReducer(initialState, action);

        expect(result.user?.role).toBe(role);
        expect(result.isAuthenticated).toBe(true);
      });
    });

    it('should handle users with shelter associations', () => {
      const shelterOperator = {
        userId: 'operator-123',
        email: 'operator@shelter.org',
        role: UserRole.SHELTER_OPERATOR,
        profile: { firstName: 'Shelter', lastName: 'Operator' },
        shelterId: 'shelter-456',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const action = setUser({ user: shelterOperator, token: 'valid-token' });
      const result = authSliceReducer(initialState, action);

      expect(result.user?.shelterId).toBe('shelter-456');
      expect(result.user?.role).toBe(UserRole.SHELTER_OPERATOR);
    });

    it('should handle users without shelter associations', () => {
      const responder = {
        userId: 'responder-123',
        email: 'responder@emergency.org',
        role: UserRole.FIRST_RESPONDER,
        profile: { firstName: 'First', lastName: 'Responder' },
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const action = setUser({ user: responder, token: 'valid-token' });
      const result = authSliceReducer(initialState, action);

      expect(result.user?.shelterId).toBeUndefined();
      expect(result.user?.role).toBe(UserRole.FIRST_RESPONDER);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate the original state when setting user', () => {
      const originalState = { ...initialState };
      
      const mockUser = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: UserRole.ADMIN,
        profile: { firstName: 'Test', lastName: 'User' },
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const action = setUser({ user: mockUser, token: 'token' });
      authSliceReducer(initialState, action);

      expect(initialState).toEqual(originalState);
    });

    it('should not mutate the original state when updating profile', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@shelter.org',
          role: UserRole.SHELTER_OPERATOR,
          profile: { firstName: 'Test', lastName: 'User' },
          isActive: true,
          createdAt: '2025-01-01T00:00:00Z'
        },
        token: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

      const originalState = JSON.parse(JSON.stringify(authenticatedState));
      const profileUpdate = { 
        profile: { firstName: 'Updated', lastName: 'User' } 
      };
      const action = updateUserProfile(profileUpdate);
      authSliceReducer(authenticatedState, action);

      expect(authenticatedState).toEqual(originalState);
    });
  });
});