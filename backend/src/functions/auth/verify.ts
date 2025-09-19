import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { responseHelper } from '../../utils/responseHelper';

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Unauthorized');
    }
    
    // TODO: Implement JWT verification
    // For hackathon: simplified token validation
    if (token.startsWith('demo-jwt-token-')) {
      return {
        principalId: 'user-123',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }]
        }
      };
    }
    
    throw new Error('Unauthorized');
  } catch (error) {
    console.error('Auth verification error:', error);
    throw new Error('Unauthorized');
  }
};