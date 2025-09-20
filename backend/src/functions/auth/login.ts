import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { responseHelper } from '../../utils/responseHelper';
import { validateLoginRequest } from '../../utils/validation';
import { withErrorHandler, ValidationError, AuthenticationError, RateLimitError, DatabaseError } from '../../utils/errorHandler';
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

export const handler: APIGatewayProxyHandler = withErrorHandler(async (event) => {
  // Get client IP for rate limiting
  const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
  
  // Check rate limiting (10 attempts per 5 minutes)
  const rateLimitCheck = RateLimiter.checkLimit(clientIp, 10, 5);
  
  if (!rateLimitCheck.allowed) {
    const minutesUntilReset = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000);
    throw new RateLimitError(
      `Too many login attempts. Please try again in ${minutesUntilReset} minutes.`,
      rateLimitCheck.resetTime
    );
  }
  
  // Validate request body
  if (!event.body) {
    throw new ValidationError('Request body is required');
  }
  
  let requestData: LoginRequest;
  try {
    requestData = JSON.parse(event.body);
  } catch (parseError) {
    throw new ValidationError('Invalid JSON in request body');
  }
  
  // Validate input
  const validation = validateLoginRequest(requestData);
  if (!validation.isValid) {
    throw new ValidationError('Validation failed', validation.errors);
  }
  
  const { email, password } = requestData;
  
  // Look up user in DynamoDB
  const user = await AuthService.getUserWithPassword(email);
  
  if (!user) {
    // Don't reveal if user exists or not for security
    throw new AuthenticationError('Invalid email or password');
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated. Please contact support.');
  }
  
  // Verify password
  const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
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
    // Don't throw here as it's not critical for login success
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
}, 'auth-login');