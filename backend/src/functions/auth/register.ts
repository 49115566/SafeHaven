import { APIGatewayProxyHandler } from 'aws-lambda';
import { UserService } from '../../services/userService';
import { ShelterService } from '../../services/shelterService';
import { responseHelper } from '../../utils/responseHelper';
import { validateRegistrationRequest } from '../../utils/validation';
import { AuthService, RateLimiter } from '../../services/authService';
import { UserRole, ResourceStatus, ShelterStatus, PublicUser } from '../../models/types';

interface AuthResponse {
  user: PublicUser;
  token: string;
}

const userService = new UserService();
const shelterService = new ShelterService();

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
    // Parse and validate request
    if (!event.body) {
      return responseHelper.badRequest('Request body is required');
    }

    const requestData: RegistrationRequest = JSON.parse(event.body);
    
    // Validate input
    const validation = validateRegistrationRequest(requestData);
    if (!validation.isValid) {
      return responseHelper.badRequest('Validation failed', validation.errors);
    }

    const { email, password, role, profile, shelterInfo } = requestData;
    
    let shelterId: string | undefined;
    
    // Create shelter if registering as shelter operator
    if (role === UserRole.SHELTER_OPERATOR && shelterInfo) {
      const shelter = await shelterService.createShelter({
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
        operatorId: email,
        contactInfo: shelterInfo.contactInfo,
        urgentNeeds: []
      });
      
      shelterId = shelter.shelterId;
    }
    
    // Create user
    const user = await userService.createUser({
      email,
      password,
      role,
      profile,
      shelterId
    });

    // Generate token
    const token = AuthService.generateToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
      shelterId: user.shelterId
    });

    const authResponse: AuthResponse = {
      user,
      token
    };

    return responseHelper.success(authResponse, 201);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return responseHelper.badRequest(error.message);
      }
    }
    
    return responseHelper.internalError('Registration failed');
  }
};
