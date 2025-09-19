import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';
import { AuthService, JwtPayload } from '../../services/authService';

interface AuthorizerContext {
  [key: string]: string | undefined;
  userId: string;
  email: string;
  role: string;
  shelterId?: string;
}

function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: AuthorizerContext
): APIGatewayAuthorizerResult {
  const authResponse: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };

  if (context) {
    authResponse.context = context;
  }

  return authResponse;
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  try {
    console.log('Authorization event:', JSON.stringify(event, null, 2));
    
    const token = event.authorizationToken;
    
    if (!token) {
      console.error('No authorization token provided');
      throw new Error('Unauthorized');
    }
    
    // Extract Bearer token
    const bearerToken = token.replace(/^Bearer\s+/i, '');
    
    if (!bearerToken || bearerToken === token) {
      console.error('Invalid token format - Bearer token required');
      throw new Error('Unauthorized');
    }
    
    // Verify JWT token using AuthService
    let decodedToken: JwtPayload;
    try {
      decodedToken = AuthService.verifyToken(bearerToken);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      
      if (jwtError instanceof Error) {
        if (jwtError.name === 'TokenExpiredError') {
          console.error('Token expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          console.error('Invalid token format');
        } else {
          console.error('Token verification failed');
        }
      }
      
      throw new Error('Unauthorized');
    }
    
    // Validate token payload
    if (!decodedToken.userId || !decodedToken.email || !decodedToken.role) {
      console.error('Invalid token payload - missing required fields');
      throw new Error('Invalid token payload');
    }
    
    // Optional: Verify user still exists and is active in database
    // This adds an extra database call but ensures revoked users can't access resources
    try {
      const user = await AuthService.getUser(decodedToken.userId);
      
      if (!user) {
        console.error(`User ${decodedToken.userId} not found in database`);
        throw new Error('User not found');
      }
      
      if (!user.isActive) {
        console.error(`User ${decodedToken.userId} is deactivated`);
        throw new Error('User deactivated');
      }
      
      // Ensure role hasn't changed
      if (user.role !== decodedToken.role) {
        console.error(`User ${decodedToken.userId} role mismatch: token=${decodedToken.role}, db=${user.role}`);
        throw new Error('Role mismatch');
      }
      
      // Ensure shelter ID hasn't changed for shelter operators
      if (user.shelterId !== decodedToken.shelterId) {
        console.error(`User ${decodedToken.userId} shelter mismatch: token=${decodedToken.shelterId}, db=${user.shelterId}`);
        throw new Error('Shelter assignment mismatch');
      }
      
    } catch (dbError) {
      console.error('Database lookup failed during token verification:', dbError);
      // For high availability in production, you might choose to skip this check
      // and rely only on JWT validation, depending on your security requirements
      throw new Error('User verification failed');
    }
    
    // Create authorizer context for downstream functions
    const authContext: AuthorizerContext = {
      userId: decodedToken.userId,
      email: decodedToken.email,
      role: decodedToken.role,
      ...(decodedToken.shelterId && { shelterId: decodedToken.shelterId })
    };
    
    console.log(`User ${decodedToken.email} (${decodedToken.role}) authorized successfully for ${event.methodArn}`);
    
    return generatePolicy(decodedToken.userId, 'Allow', event.methodArn, authContext);
    
  } catch (error) {
    console.error('Authorization failed:', error);
    
    // For security, we don't expose the specific reason for authorization failure
    // All authorization failures should be treated as "Unauthorized"
    throw new Error('Unauthorized');
  }
};