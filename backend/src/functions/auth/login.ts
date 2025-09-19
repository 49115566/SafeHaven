import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { responseHelper } from '../../utils/responseHelper';
import { validateLoginRequest } from '../../utils/validation';
import { AuthService, RateLimiter, User } from '../../services/authService';

interface AuthResponse {
  user: User;
  token: string;
}

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

interface LoginRequest {
  email: string;
  password: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Get client IP for rate limiting
    const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
    
    // Check rate limiting (10 attempts per 5 minutes)
    const rateLimitCheck = RateLimiter.checkLimit(clientIp, 10, 5);
    
    if (!rateLimitCheck.allowed) {
      const minutesUntilReset = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000);
      return responseHelper.error(
        `Too many login attempts. Please try again in ${minutesUntilReset} minutes.`,
        429,
        { resetTime: rateLimitCheck.resetTime }
      );
    }
    
    // Validate request body
    if (!event.body) {
      return responseHelper.badRequest('Request body is required');
    }
    
    let requestData: LoginRequest;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return responseHelper.badRequest('Invalid JSON in request body');
    }
    
    // Validate input
    const validation = validateLoginRequest(requestData);
    if (!validation.isValid) {
      return responseHelper.badRequest(
        'Validation failed',
        validation.errors
      );
    }
    
    const { email, password } = requestData;
    
    // Look up user in DynamoDB
    const user = await AuthService.getUserWithPassword(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return responseHelper.unauthorized('Invalid email or password');
    }
    
    // Check if user is active
    if (!user.isActive) {
      return responseHelper.forbidden('Account is deactivated. Please contact support.');
    }
    
    // Verify password
    const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return responseHelper.unauthorized('Invalid email or password');
    }
    
    // Update last login timestamp (async, don't wait)
    const updateCommand = new UpdateCommand({
      TableName: process.env.USERS_TABLE!,
      Key: { userId: email },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      }
    });
    
    dynamo.send(updateCommand).catch(updateError => {
      console.error('Failed to update last login timestamp:', updateError);
    });
    
    // Generate JWT token
    const { passwordHash, ...safeUser } = user;
    const token = AuthService.generateToken(safeUser);
    
    const authResponse: AuthResponse = {
      user: safeUser,
      token
    };
    
    console.log(`User ${email} (${user.role}) logged in successfully from ${clientIp}`);
    
    return responseHelper.success(authResponse);
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Don't expose internal errors to client
    if (error instanceof Error) {
      if (error.message.includes('DynamoDB') || error.message.includes('AWS')) {
        return responseHelper.internalError('Database service temporarily unavailable');
      }
      
      if (error.message.includes('JWT')) {
        return responseHelper.internalError('Authentication service error');
      }
    }
    
    return responseHelper.internalError('Login failed. Please try again.');
  }
};