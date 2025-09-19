import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { responseHelper } from '../../utils/responseHelper';
import { validateRegistrationRequest } from '../../utils/validation';
import { AuthService, RateLimiter, User, UserRole } from '../../services/authService';

interface AuthResponse {
  user: User;
  token: string;
}

// Define additional types locally
enum ShelterStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  FULL = 'full',
  EMERGENCY = 'emergency',
  OFFLINE = 'offline'
}

enum ResourceStatus {
  ADEQUATE = 'adequate',
  LOW = 'low',
  CRITICAL = 'critical',
  UNAVAILABLE = 'unavailable'
}

interface Shelter {
  shelterId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  capacity: {
    current: number;
    maximum: number;
  };
  resources: {
    food: ResourceStatus;
    water: ResourceStatus;
    medical: ResourceStatus;
    bedding: ResourceStatus;
  };
  status: ShelterStatus;
  operatorId: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  urgentNeeds: string[];
  lastUpdated: string;
  createdAt: string;
}

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

interface RegistrationRequest {
  email: string;
  password: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    organization?: string;
  };
  shelterInfo?: {
    name: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
    capacity: {
      maximum: number;
    };
    contactInfo: {
      phone: string;
      email: string;
    };
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Get client IP for rate limiting
    const clientIp = event.requestContext.identity?.sourceIp || 'unknown';
    
    // Check rate limiting (5 registrations per 15 minutes per IP)
    const rateLimitCheck = RateLimiter.checkLimit(clientIp, 5, 15);
    
    if (!rateLimitCheck.allowed) {
      const minutesUntilReset = Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000);
      return responseHelper.error(
        `Too many registration attempts. Please try again in ${minutesUntilReset} minutes.`,
        429,
        { resetTime: rateLimitCheck.resetTime }
      );
    }
    
    // Validate request body
    if (!event.body) {
      return responseHelper.badRequest('Request body is required');
    }
    
    let requestData: RegistrationRequest;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return responseHelper.badRequest('Invalid JSON in request body');
    }
    
    // Validate input
    const validation = validateRegistrationRequest(requestData);
    if (!validation.isValid) {
      return responseHelper.badRequest(
        'Validation failed',
        validation.errors
      );
    }
    
    const { email, password, role, profile, shelterInfo } = requestData;
    
    // Check if user already exists
    const existingUser = await AuthService.getUserWithPassword(email);
    
    if (existingUser) {
      return responseHelper.badRequest('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await AuthService.hashPassword(password);
    
    // Generate unique IDs
    const userId = email; // Using email as user ID for simplicity
    let shelterId: string | undefined;
    
    // Create shelter if registering as shelter operator
    if (role === UserRole.SHELTER_OPERATOR && shelterInfo) {
      shelterId = `shelter-${uuidv4()}`;
      
      const shelter: Shelter = {
        shelterId,
        name: shelterInfo.name,
        location: shelterInfo.location,
        capacity: {
          current: 0,
          maximum: shelterInfo.capacity.maximum
        },
        resources: {
          food: ResourceStatus.ADEQUATE,
          water: ResourceStatus.ADEQUATE,
          medical: ResourceStatus.ADEQUATE,
          bedding: ResourceStatus.ADEQUATE
        },
        status: ShelterStatus.AVAILABLE,
        operatorId: userId,
        contactInfo: shelterInfo.contactInfo,
        urgentNeeds: [],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      // Save shelter to DynamoDB
      const putShelterCommand = new PutCommand({
        TableName: process.env.SHELTERS_TABLE!,
        Item: shelter,
        ConditionExpression: 'attribute_not_exists(shelterId)'
      });
      
      try {
        await dynamo.send(putShelterCommand);
        console.log(`Created shelter ${shelterId} for operator ${userId}`);
      } catch (shelterError) {
        if (shelterError instanceof Error && shelterError.name === 'ConditionalCheckFailedException') {
          return responseHelper.badRequest('Shelter with this ID already exists');
        }
        throw shelterError;
      }
    }
    
    // Create user
    const user: User & { passwordHash: string } = {
      userId,
      email,
      role,
      profile,
      shelterId,
      isActive: true,
      createdAt: new Date().toISOString(),
      passwordHash
    };
    
    // Save user to DynamoDB
    const putUserCommand = new PutCommand({
      TableName: process.env.USERS_TABLE!,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)'
    });
    
    try {
      await dynamo.send(putUserCommand);
    } catch (userError) {
      if (userError instanceof Error && userError.name === 'ConditionalCheckFailedException') {
        // If user creation failed but shelter was created, we should ideally clean up the shelter
        // For hackathon simplicity, we'll log the issue
        console.error(`User creation failed but shelter ${shelterId} may have been created. Manual cleanup required.`);
        return responseHelper.badRequest('User with this email already exists');
      }
      throw userError;
    }
    
    // Generate JWT token
    const { passwordHash: _, ...userWithoutPassword } = user;
    const token = AuthService.generateToken(userWithoutPassword);
    
    const authResponse: AuthResponse = {
      user: userWithoutPassword,
      token
    };
    
    console.log(`User ${email} registered successfully with role ${role}${shelterId ? ` and shelter ${shelterId}` : ''} from ${clientIp}`);
    
    return responseHelper.success(authResponse, 201);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return responseHelper.badRequest('User or shelter with this information already exists');
      }
      
      if (error.message.includes('DynamoDB') || error.message.includes('AWS')) {
        return responseHelper.internalError('Database service temporarily unavailable');
      }
      
      if (error.message.includes('password') || error.message.includes('bcrypt')) {
        return responseHelper.internalError('Password processing error');
      }
    }
    
    return responseHelper.internalError('Registration failed. Please try again.');
  }
};