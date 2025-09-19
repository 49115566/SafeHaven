import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseHelper } from '../../utils/responseHelper';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userData = JSON.parse(event.body || '{}');
    
    // TODO: Implement registration logic
    // For hackathon: simplified registration
    if (userData.email && userData.password) {
      const mockUser = {
        userId: 'user-' + Date.now(),
        email: userData.email,
        role: userData.role || 'shelter_operator',
        profile: {
          firstName: userData.profile?.firstName || 'New',
          lastName: userData.profile?.lastName || 'User'
        }
      };
      
      const mockToken = 'demo-jwt-token-' + Date.now();
      
      return responseHelper.success({
        user: mockUser,
        token: mockToken
      }, 201);
    }
    
    return responseHelper.badRequest('Email and password required');
  } catch (error) {
    console.error('Registration error:', error);
    return responseHelper.internalError('Registration failed');
  }
};