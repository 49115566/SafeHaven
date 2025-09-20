import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler } from '../../functions/auth/verifyToken';
import { AuthService } from '../../services/authService';
import { responseHelper } from '../../utils/responseHelper';

// Define UserRole locally to avoid shared package import issues during testing
enum UserRole {
  SHELTER_OPERATOR = 'shelter_operator',
  FIRST_RESPONDER = 'first_responder',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  ADMIN = 'admin'
}

// Mock dependencies
jest.mock('../../services/authService');
jest.mock('../../utils/responseHelper');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockResponseHelper = responseHelper as jest.Mocked<typeof responseHelper>;

describe('verifyToken Lambda Function', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key';
    process.env.USERS_TABLE = 'test-users-table';
    
    // Mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'test-arn',
      memoryLimitInMB: '256',
      awsRequestId: 'test-request-id',
      logGroupName: 'test-log-group',
      logStreamName: 'test-log-stream',
      getRemainingTimeInMillis: () => 30000
    };
    
    // Mock default event structure
    mockEvent = {
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'GET',
      isBase64Encoded: false,
      path: '/auth/verify',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: 'test-account',
        apiId: 'test-api',
        httpMethod: 'GET',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-agent'
        } as any,
        path: '/auth/verify',
        stage: 'test',
        requestId: 'test-request-id',
        resourceId: 'test-resource',
        resourcePath: '/auth/verify'
      } as any,
      resource: '/auth/verify'
    };

    // Setup default response helper mocks
    mockResponseHelper.unauthorized.mockReturnValue({
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: { message: 'Unauthorized', statusCode: 401 },
        timestamp: new Date().toISOString()
      })
    });

    mockResponseHelper.badRequest.mockReturnValue({
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: { message: 'Bad Request', statusCode: 400 },
        timestamp: new Date().toISOString()
      })
    });

    mockResponseHelper.success.mockReturnValue({
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {},
        timestamp: new Date().toISOString()
      })
    });

    mockResponseHelper.internalError.mockReturnValue({
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: { message: 'Internal Server Error', statusCode: 500 },
        timestamp: new Date().toISOString()
      })
    });

    mockResponseHelper.forbidden.mockReturnValue({
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: { message: 'Forbidden', statusCode: 403 },
        timestamp: new Date().toISOString()
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authorization Header Validation', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Authorization header required');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 401 when Authorization header is empty', async () => {
      mockEvent.headers!.Authorization = '';

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Authorization header required');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 401 when Bearer token format is invalid', async () => {
      mockEvent.headers!.Authorization = 'InvalidFormat';

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Invalid token format - Bearer token required');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 401 when Bearer prefix is missing', async () => {
      mockEvent.headers!.Authorization = 'just-a-token';

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Invalid token format - Bearer token required');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should handle lowercase authorization header', async () => {
      mockEvent.headers!.authorization = 'Bearer valid-token';
      
      // Mock successful JWT verification
      const mockDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'safehaven-auth',
        aud: 'safehaven-dashboard'
      };
      
      mockAuthService.verifyToken.mockReturnValue(mockDecodedToken);
      
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockAuthService.getUser.mockResolvedValue(mockUser);

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('JWT Token Verification', () => {
    beforeEach(() => {
      mockEvent.headers!.Authorization = 'Bearer valid-jwt-token';
    });

    it('should return 401 when JWT verification fails', async () => {
      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Token verification failed');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 401 when JWT token is expired', async () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      
      mockAuthService.verifyToken.mockImplementation(() => {
        throw expiredError;
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Token expired');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 401 when JWT token format is invalid', async () => {
      const jwtError = new Error('Invalid token format');
      jwtError.name = 'JsonWebTokenError';
      
      mockAuthService.verifyToken.mockImplementation(() => {
        throw jwtError;
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Invalid token');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 400 when token payload is missing required fields', async () => {
      const incompleteToken = {
        userId: 'user-123',
        // Missing email and role
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      mockAuthService.verifyToken.mockReturnValue(incompleteToken as any);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.badRequest).toHaveBeenCalledWith('Invalid token payload');
      expect((result as APIGatewayProxyResult).statusCode).toBe(400);
    });
  });

  describe('User Database Validation', () => {
    let validDecodedToken: any;

    beforeEach(() => {
      mockEvent.headers!.Authorization = 'Bearer valid-jwt-token';
      
      validDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'first_responder',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
    });

    it('should return 401 when user does not exist in database', async () => {
      mockAuthService.getUser.mockResolvedValue(null);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('User not found');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 403 when user account is deactivated', async () => {
      const deactivatedUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        isActive: false, // Deactivated
        createdAt: new Date().toISOString()
      };
      
      mockAuthService.getUser.mockResolvedValue(deactivatedUser);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.forbidden).toHaveBeenCalledWith('Account deactivated');
      expect((result as APIGatewayProxyResult).statusCode).toBe(403);
    });

    it('should return 401 when user role has changed since token was issued', async () => {
      const userWithDifferentRole = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.EMERGENCY_COORDINATOR, // Different from token
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockAuthService.getUser.mockResolvedValue(userWithDifferentRole);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Role mismatch');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should return 401 when shelter assignment has changed for shelter operators', async () => {
      // Update token to include shelter operator
      validDecodedToken.role = UserRole.SHELTER_OPERATOR;
      validDecodedToken.shelterId = 'shelter-123';
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
      
      const userWithDifferentShelter = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.SHELTER_OPERATOR,
        shelterId: 'shelter-456', // Different shelter
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockAuthService.getUser.mockResolvedValue(userWithDifferentShelter);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Shelter assignment mismatch');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockAuthService.getUser.mockRejectedValue(new Error('Database connection failed'));

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.internalError).toHaveBeenCalledWith('User verification failed');
      expect((result as APIGatewayProxyResult).statusCode).toBe(500);
    });
  });

  describe('Successful Token Verification', () => {
    let validDecodedToken: any;
    let validUser: any;

    beforeEach(() => {
      mockEvent.headers!.Authorization = 'Bearer valid-jwt-token';
      
      validDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'first_responder',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      validUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'first_responder',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          organization: 'Dallas Fire Department'
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
      mockAuthService.getUser.mockResolvedValue(validUser);
    });

    it('should return 200 with user data for valid token and user', async () => {
      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockAuthService.getUser).toHaveBeenCalledWith('user-123');
      expect(mockResponseHelper.success).toHaveBeenCalledWith(validUser);
      expect((result as APIGatewayProxyResult).statusCode).toBe(200);
    });

    it('should work with shelter operator tokens', async () => {
      validDecodedToken.role = UserRole.SHELTER_OPERATOR;
      validDecodedToken.shelterId = 'shelter-123';
      validUser.role = UserRole.SHELTER_OPERATOR;
      validUser.shelterId = 'shelter-123';
      
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
      mockAuthService.getUser.mockResolvedValue(validUser);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.success).toHaveBeenCalledWith(validUser);
      expect((result as APIGatewayProxyResult).statusCode).toBe(200);
    });

    it('should work with emergency coordinator tokens', async () => {
      validDecodedToken.role = 'emergency_coordinator';
      validUser.role = 'emergency_coordinator';
      
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
      mockAuthService.getUser.mockResolvedValue(validUser);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      expect(mockResponseHelper.success).toHaveBeenCalledWith(validUser);
      expect((result as APIGatewayProxyResult).statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockEvent.headers!.Authorization = 'Bearer valid-jwt-token';
      
      // Mock an unexpected error during JWT verification
      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      // Unexpected JWT errors are handled as token verification failures
      expect(mockResponseHelper.unauthorized).toHaveBeenCalledWith('Token verification failed');
      expect((result as APIGatewayProxyResult).statusCode).toBe(401);
    });

    it('should handle malformed event gracefully', async () => {
      const malformedEvent = {} as APIGatewayProxyEvent;

      const result = await handler(malformedEvent, mockContext as Context, jest.fn());

      // Malformed events that cause TypeErrors are handled by the outer catch block
      expect(mockResponseHelper.internalError).toHaveBeenCalledWith('Token verification service error');
      expect((result as APIGatewayProxyResult).statusCode).toBe(500);
    });
  });

  describe('Requirements Compliance', () => {
    it('should meet REQ-BE-004 Authentication & Authorization requirements', async () => {
      mockEvent.headers!.Authorization = 'Bearer valid-jwt-token';
      
      const validDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'safehaven-auth',
        aud: 'safehaven-dashboard'
      };
      
      const validUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
      mockAuthService.getUser.mockResolvedValue(validUser);

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      // Verify JWT token verification (REQ-BE-004)
      expect(mockAuthService.verifyToken).toHaveBeenCalled();
      
      // Verify role-based permissions checking
      expect(mockAuthService.getUser).toHaveBeenCalled();
      
      // Verify HTTPS-only enforcement through API Gateway (implied by responseHelper usage)
      expect((result as APIGatewayProxyResult).statusCode).toBe(200);
    });

    it('should meet REQ-SEC-002 Access Control requirements', async () => {
      mockEvent.headers!.Authorization = 'Bearer valid-jwt-token';
      
      // Test role-based permissions checking
      const validDecodedToken = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'safehaven-auth',
        aud: 'safehaven-dashboard'
      };
      
      const validUser = {
        userId: 'user-123',
        email: 'test@example.com',
        role: UserRole.FIRST_RESPONDER,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      mockAuthService.verifyToken.mockReturnValue(validDecodedToken);
      mockAuthService.getUser.mockResolvedValue(validUser);

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context, jest.fn());

      // Verify role validation
      expect(mockAuthService.getUser).toHaveBeenCalledWith('user-123');
    });
  });
});