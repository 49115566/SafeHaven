import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseHelper } from '../../utils/responseHelper';
import { AuthService } from '../../services/authService';

/**
 * HTTP endpoint for verifying JWT tokens
 * Used by dashboard to validate stored tokens
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    
    if (!authHeader) {
      return responseHelper.unauthorized('Authorization header required');
    }
    
    // Extract Bearer token
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!bearerToken || bearerToken === authHeader) {
      return responseHelper.unauthorized('Invalid token format - Bearer token required');
    }
    
    // Verify JWT token using AuthService
    let decodedToken;
    try {
      decodedToken = AuthService.verifyToken(bearerToken);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      
      if (jwtError instanceof Error) {
        if (jwtError.name === 'TokenExpiredError') {
          return responseHelper.unauthorized('Token expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          return responseHelper.unauthorized('Invalid token');
        }
      }
      
      return responseHelper.unauthorized('Token verification failed');
    }
    
    // Validate token payload
    if (!decodedToken.userId || !decodedToken.email || !decodedToken.role) {
      return responseHelper.badRequest('Invalid token payload');
    }
    
    // Verify user still exists and is active in database
    try {
      const user = await AuthService.getUser(decodedToken.userId);
      
      if (!user) {
        return responseHelper.unauthorized('User not found');
      }
      
      if (!user.isActive) {
        return responseHelper.forbidden('Account deactivated');
      }
      
      // Ensure role hasn't changed
      if (user.role !== decodedToken.role) {
        return responseHelper.unauthorized('Role mismatch');
      }
      
      // For shelter operators, ensure shelter assignment hasn't changed
      if (user.shelterId !== decodedToken.shelterId) {
        return responseHelper.unauthorized('Shelter assignment mismatch');
      }
      
      // Return user data (without sensitive information)  
      console.log(`Token verified successfully for user ${user.email} (${user.role})`);
      
      return responseHelper.success(user);
      
    } catch (dbError) {
      console.error('Database lookup failed during token verification:', dbError);
      return responseHelper.internalError('User verification failed');
    }
    
  } catch (error) {
    console.error('Token verification error:', error);
    return responseHelper.internalError('Token verification service error');
  }
};