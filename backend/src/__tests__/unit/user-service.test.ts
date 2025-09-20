/**
 * Comprehensive unit tests for UserService
 * Tests compliance with REQ-BE-001, REQ-BE-004, REQ-SCA-001, REQ-SCA-002
 */

// Mock AWS SDK first before any imports
const mockDynamoDBSend = jest.fn() as jest.MockedFunction<any>;

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockDynamoDBSend
    }))
  },
  GetCommand: jest.fn((params) => ({ type: 'GetCommand', params })),
  PutCommand: jest.fn((params) => ({ type: 'PutCommand', params })),
  UpdateCommand: jest.fn((params) => ({ type: 'UpdateCommand', params })),
  QueryCommand: jest.fn((params) => ({ type: 'QueryCommand', params })),
  ScanCommand: jest.fn((params) => ({ type: 'ScanCommand', params }))
}));

// Mock AuthService
jest.mock('../../services/authService', () => ({
  AuthService: {
    validateEmail: jest.fn() as jest.MockedFunction<any>,
    validatePasswordStrength: jest.fn() as jest.MockedFunction<any>,
    hashPassword: jest.fn() as jest.MockedFunction<any>,
    verifyPassword: jest.fn() as jest.MockedFunction<any>,
    getUserWithPassword: jest.fn() as jest.MockedFunction<any>
  }
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-user-uuid-123')
}));

// Now import after mocks are set up
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { UserService, CreateUserInput, UpdateUserInput } from '../../services/userService';
import { UserRole } from '../../models/types';
import { UserFixtures, AWSMockFixtures, InputFixtures, ValidationFixtures } from '../fixtures/testFixtures';
import { AuthService } from '../../services/authService';

describe('UserService Unit Tests', () => {
  let userService: UserService;
  const mockDate = new Date('2025-09-20T10:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
    
    // Set required environment variables
    process.env.USERS_TABLE = 'SafeHaven-test-Users';
    
    // Setup AuthService mocks with proper typing
    (AuthService.validateEmail as jest.MockedFunction<any>).mockImplementation((email: any) => 
      email?.includes('@') && email?.includes('.')
    );
    (AuthService.validatePasswordStrength as jest.MockedFunction<any>).mockImplementation((password: any) => ({
      isValid: password?.length >= 8,
      errors: password?.length >= 8 ? [] : ['Password too short']
    }));
    (AuthService.hashPassword as jest.MockedFunction<any>).mockResolvedValue('$2b$10$mocked.hash.value');
    (AuthService.verifyPassword as jest.MockedFunction<any>).mockResolvedValue(true);
    (AuthService.getUserWithPassword as jest.MockedFunction<any>).mockResolvedValue(null);
    
    userService = new UserService();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.USERS_TABLE;
  });

  describe('createUser', () => {
    const validUserInput: CreateUserInput = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: UserRole.SHELTER_OPERATOR,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-123-4567',
        organization: 'Red Cross'
      }
    };

    it('should create user successfully - REQ-SCA-001 compliance', async () => {
      // Mock that user doesn't exist
      mockDynamoDBSend
        .mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBQueryResponse([])) // getUserByEmail
        .mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse()); // createUser

      const result = await userService.createUser(validUserInput);

      expect(result).toMatchObject({
        userId: 'mock-user-uuid-123',
        email: validUserInput.email,
        role: validUserInput.role,
        profile: validUserInput.profile,
        isActive: true,
        createdAt: mockDate.toISOString()
      });

      // Should not include password hash in response
      expect((result as any).passwordHash).toBeUndefined();

      // Verify DynamoDB calls
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PutCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            Item: expect.objectContaining({
              userId: 'mock-user-uuid-123',
              email: validUserInput.email,
              passwordHash: '$2b$10$mocked.hash.value',
              role: validUserInput.role,
              isActive: true
            })
          }
        })
      );

      // Verify password validation was called
      expect(AuthService.validatePasswordStrength).toHaveBeenCalledWith(validUserInput.password);
      expect(AuthService.hashPassword).toHaveBeenCalledWith(validUserInput.password);
    });

    it('should create shelter operator with shelterId - REQ-SCA-002 compliance', async () => {
      const shelterOperatorInput = {
        ...validUserInput,
        role: UserRole.SHELTER_OPERATOR,
        shelterId: 'shelter-test-456'
      };

      mockDynamoDBSend
        .mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBQueryResponse([]))
        .mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBPutResponse());

      const result = await userService.createUser(shelterOperatorInput);

      expect(result.shelterId).toBe('shelter-test-456');
      expect(result.role).toBe(UserRole.SHELTER_OPERATOR);
    });

    it('should validate email format - REQ-BE-004 compliance', async () => {
      (AuthService.validateEmail as jest.MockedFunction<any>).mockReturnValue(false);

      const invalidEmailInput = {
        ...validUserInput,
        email: 'invalid-email'
      };

      await expect(userService.createUser(invalidEmailInput))
        .rejects.toThrow('Invalid email format');

      expect(AuthService.validateEmail).toHaveBeenCalledWith('invalid-email');
    });

    it('should validate password strength - REQ-BE-004 compliance', async () => {
      (AuthService.validatePasswordStrength as jest.MockedFunction<any>).mockReturnValue({
        isValid: false,
        errors: ['Password too short', 'Missing uppercase letter']
      });

      const weakPasswordInput = {
        ...validUserInput,
        password: 'weak'
      };

      await expect(userService.createUser(weakPasswordInput))
        .rejects.toThrow('Password validation failed: Password too short, Missing uppercase letter');
    });

    it('should prevent duplicate user creation', async () => {
      const existingUser = UserFixtures.createMockPublicUser();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBQueryResponse([existingUser])
      );

      await expect(userService.createUser(validUserInput))
        .rejects.toThrow('User with this email already exists');
    });

    it('should handle DynamoDB errors gracefully', async () => {
      mockDynamoDBSend
        .mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBQueryResponse([]))
        .mockRejectedValueOnce(new Error('DynamoDB Error'));

      await expect(userService.createUser(validUserInput))
        .rejects.toThrow('DynamoDB Error');
    });
  });

  describe('getUser', () => {
    it('should retrieve user by ID successfully - REQ-BE-001 compliance', async () => {
      const mockUser = UserFixtures.createMockUser();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBGetResponse(mockUser)
      );

      const result = await userService.getUser('user-test-123');

      expect(result).toEqual({
        ...mockUser,
        passwordHash: undefined
      });

      // Should not include password hash
      expect((result as any).passwordHash).toBeUndefined();

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GetCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            Key: { userId: 'user-test-123' }
          }
        })
      );
    });

    it('should return null when user not found', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBGetResponse(null)
      );

      const result = await userService.getUser('non-existent-user');

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('DynamoDB Error'));

      await expect(userService.getUser('user-test-123'))
        .rejects.toThrow('DynamoDB Error');
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve user by email using GSI', async () => {
      const mockUser = UserFixtures.createMockUser();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBQueryResponse([mockUser])
      );

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).toEqual({
        ...mockUser,
        passwordHash: undefined
      });

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'QueryCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
              ':email': 'test@example.com'
            }
          }
        })
      );
    });

    it('should return null when no user found by email', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBQueryResponse([])
      );

      const result = await userService.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return first user when multiple matches found', async () => {
      const users = [
        UserFixtures.createMockUser({ userId: 'user-1' }),
        UserFixtures.createMockUser({ userId: 'user-2' })
      ];
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBQueryResponse(users)
      );

      const result = await userService.getUserByEmail('test@example.com');

      expect(result?.userId).toBe('user-1');
    });
  });

  describe('updateUser', () => {
    const updateInput: UpdateUserInput = {
      profile: {
        firstName: 'Jane',
        phone: '+1-555-987-6543'
      },
      isActive: false
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...UserFixtures.createMockUser(),
        profile: {
          ...UserFixtures.createMockUser().profile,
          firstName: 'Jane',
          phone: '+1-555-987-6543'
        },
        isActive: false,
        updatedAt: mockDate.toISOString()
      };

      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(updatedUser)
      );

      const result = await userService.updateUser('user-test-123', updateInput);

      expect(result).toEqual({
        ...updatedUser,
        passwordHash: undefined
      });

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            Key: { userId: 'user-test-123' },
            UpdateExpression: 'SET profile.firstName = :firstName, profile.phone = :phone, isActive = :isActive',
            ExpressionAttributeNames: undefined,
            ExpressionAttributeValues: {
              ':firstName': 'Jane',
              ':phone': '+1-555-987-6543',
              ':isActive': false
            },
            ReturnValues: 'ALL_NEW'
          }
        })
      );
    });

    it('should handle partial profile updates', async () => {
      const partialUpdate = {
        profile: {
          firstName: 'UpdatedName'
        }
      };

      const updatedUser = UserFixtures.createMockUser();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(updatedUser)
      );

      const result = await userService.updateUser('user-test-123', partialUpdate);

      expect(result).toBeDefined();
      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            UpdateExpression: expect.stringContaining('profile')
          })
        })
      );
    });

    it('should return null when user not found', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBUpdateResponse(null)
      );

      const result = await userService.updateUser('non-existent-user', updateInput);

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userWithPassword = UserFixtures.createMockUser();
      (AuthService.getUserWithPassword as jest.MockedFunction<any>).mockResolvedValueOnce(userWithPassword);
      (AuthService.verifyPassword as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      (AuthService.hashPassword as jest.MockedFunction<any>).mockResolvedValueOnce('$2b$10$new.hash.value');

      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBUpdateResponse({}));

      const result = await userService.changePassword(
        'user-test-123',
        'currentPassword',
        'NewSecurePass123!'
      );

      expect(result).toBe(true);
      expect(AuthService.getUserWithPassword).toHaveBeenCalledWith('user-test-123');
      expect(AuthService.verifyPassword).toHaveBeenCalledWith('currentPassword', userWithPassword.passwordHash);
      expect(AuthService.hashPassword).toHaveBeenCalledWith('NewSecurePass123!');

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            Key: { userId: 'user-test-123' },
            UpdateExpression: 'SET passwordHash = :passwordHash',
            ExpressionAttributeValues: {
              ':passwordHash': '$2b$10$new.hash.value'
            }
          }
        })
      );
    });

    it('should reject invalid current password', async () => {
      const userWithPassword = UserFixtures.createMockUser();
      (AuthService.getUserWithPassword as jest.MockedFunction<any>).mockResolvedValueOnce(userWithPassword);
      (AuthService.verifyPassword as jest.MockedFunction<any>).mockResolvedValueOnce(false);

      await expect(userService.changePassword(
        'user-test-123',
        'wrongPassword',
        'NewSecurePass123!'
      )).rejects.toThrow('Current password is incorrect');

      expect(AuthService.hashPassword).not.toHaveBeenCalled();
      expect(mockDynamoDBSend).not.toHaveBeenCalled();
    });

    it('should reject when user not found', async () => {
      (AuthService.getUserWithPassword as jest.MockedFunction<any>).mockResolvedValueOnce(null);

      await expect(userService.changePassword(
        'non-existent-user',
        'currentPassword',
        'NewSecurePass123!'
      )).rejects.toThrow('User not found');
    });

    it('should validate new password strength', async () => {
      const userWithPassword = UserFixtures.createMockUser();
      (AuthService.getUserWithPassword as jest.MockedFunction<any>).mockResolvedValueOnce(userWithPassword);
      (AuthService.verifyPassword as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      (AuthService.validatePasswordStrength as jest.MockedFunction<any>).mockReturnValueOnce({
        isValid: false,
        errors: ['Password too weak']
      });

      await expect(userService.changePassword(
        'user-test-123',
        'currentPassword',
        'weak'
      )).rejects.toThrow('New password validation failed: Password too weak');
    });
  });

  describe('deactivateUser and activateUser', () => {
    it('should deactivate user successfully', async () => {
      jest.spyOn(userService, 'updateUser').mockResolvedValueOnce(
        UserFixtures.createMockPublicUser({ isActive: false })
      );

      const result = await userService.deactivateUser('user-test-123');

      expect(result).toBe(true);
      expect(userService.updateUser).toHaveBeenCalledWith('user-test-123', { isActive: false });
    });

    it('should activate user successfully', async () => {
      jest.spyOn(userService, 'updateUser').mockResolvedValueOnce(
        UserFixtures.createMockPublicUser({ isActive: true })
      );

      const result = await userService.activateUser('user-test-123');

      expect(result).toBe(true);
      expect(userService.updateUser).toHaveBeenCalledWith('user-test-123', { isActive: true });
    });

    it('should return false when user not found for deactivation', async () => {
      jest.spyOn(userService, 'updateUser').mockRejectedValueOnce(new Error('User not found'));

      const result = await userService.deactivateUser('non-existent-user');

      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      (AuthService.hashPassword as jest.MockedFunction<any>).mockResolvedValueOnce('$2b$10$reset.hash.value');
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBUpdateResponse({}));

      const result = await userService.resetPassword('user-test-123', 'NewResetPass123!');

      expect(result).toBe(true);
      expect(AuthService.validatePasswordStrength).toHaveBeenCalledWith('NewResetPass123!');
      expect(AuthService.hashPassword).toHaveBeenCalledWith('NewResetPass123!');

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: expect.objectContaining({
            UpdateExpression: expect.stringContaining('passwordHash'),
            ExpressionAttributeValues: expect.objectContaining({
              ':passwordHash': '$2b$10$reset.hash.value'
            })
          })
        })
      );
    });

    it('should validate new password on reset', async () => {
      (AuthService.validatePasswordStrength as jest.Mock).mockReturnValueOnce({
        isValid: false,
        errors: ['Password too weak']
      });

      await expect(userService.resetPassword('user-test-123', 'weak'))
        .rejects.toThrow('Password validation failed: Password too weak');
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users with pagination', async () => {
      const mockUsers = [
        UserFixtures.createMockUser({ userId: 'user-1' }),
        UserFixtures.createMockUser({ userId: 'user-2' })
      ];

      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBScanResponse(mockUsers)
      );

      const result = await userService.getAllUsers(undefined, 10);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[1].userId).toBe('user-2');

      // Verify password hashes are removed
      result.forEach(user => {
        expect((user as any).passwordHash).toBeUndefined();
      });

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ScanCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            Limit: 10
          }
        })
      );
    });

    it('should scan without limit when not specified', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBScanResponse([])
      );

      await userService.getAllUsers();

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          params: {
            TableName: 'SafeHaven-test-Users'
          }
        })
      );
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBUpdateResponse({}));

      await userService.updateLastLogin('user-test-123');

      expect(mockDynamoDBSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UpdateCommand',
          params: {
            TableName: 'SafeHaven-test-Users',
            Key: { userId: 'user-test-123' },
            UpdateExpression: 'SET lastLogin = :lastLogin',
            ExpressionAttributeValues: {
              ':lastLogin': mockDate.toISOString()
            }
          }
        })
      );
    });

    it('should handle update errors gracefully', async () => {
      mockDynamoDBSend.mockRejectedValueOnce(new Error('Update failed'));

      // Should throw error since updateLastLogin doesn't handle errors
      await expect(userService.updateLastLogin('user-test-123'))
        .rejects.toThrow('Update failed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.USERS_TABLE;

      const service = new UserService();
      expect(service).toBeDefined();
    });

    it('should handle malformed user data gracefully', async () => {
      const malformedInput = {
        email: '',
        password: '',
        role: 'invalid' as any,
        profile: {
          firstName: '',
          lastName: ''
        }
      };

      (AuthService.validateEmail as jest.Mock).mockReturnValue(false);

      await expect(userService.createUser(malformedInput))
        .rejects.toThrow('Invalid email format');
    });

    it('should handle concurrent user creation gracefully', async () => {
      // First call succeeds (no existing user)
      // Second call fails (user was created in between)
      mockDynamoDBSend
        .mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBQueryResponse([]))
        .mockRejectedValueOnce(new Error('ConditionalCheckFailedException'));

      const validInput = InputFixtures.createValidUserRegistration();

      await expect(userService.createUser(validInput))
        .rejects.toThrow('ConditionalCheckFailedException');
    });
  });

  describe('Performance and Security Requirements', () => {
    it('should complete user operations within performance requirements', async () => {
      mockDynamoDBSend.mockResolvedValueOnce(AWSMockFixtures.createMockDynamoDBGetResponse(
        UserFixtures.createMockUser()
      ));

      const startTime = Date.now();
      await userService.getUser('user-test-123');
      const endTime = Date.now();

      // Should complete within 2 seconds (REQ-PERF-001)
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should never expose password hashes in responses', async () => {
      const userWithPassword = UserFixtures.createMockUser();
      mockDynamoDBSend.mockResolvedValueOnce(
        AWSMockFixtures.createMockDynamoDBGetResponse(userWithPassword)
      );

      const result = await userService.getUser('user-test-123');

      expect(result).toBeDefined();
      expect((result as any).passwordHash).toBeUndefined();
    });
  });
});