import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseHelper } from '../../utils/responseHelper';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');
    
    // TODO: Implement authentication logic
    // For hackathon: simplified auth
    if (email && password) {
      const mockUser = {
        userId: 'user-123',
        email,
        role: 'shelter_operator',
        profile: {
          firstName: 'Demo',
          lastName: 'User'
        }
      };
      
      const mockToken = 'demo-jwt-token-' + Date.now();
      
      return responseHelper.success({
        user: mockUser,
        token: mockToken
      });
    }
    
    return responseHelper.badRequest('Email and password required');
  } catch (error) {
    console.error('Login error:', error);
    return responseHelper.internalError('Login failed');
  }
};