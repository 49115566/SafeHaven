/**
 * Test fixtures and mock data generators for SafeHaven Connect
 * Used for consistent testing across unit and integration tests
 */

import { User, PublicUser, UserRole, Alert, AlertType, AlertPriority, AlertStatus } from '../../models/types';

/**
 * Mock user data generators
 */
export class UserFixtures {
  static createMockUser(overrides: Partial<User> = {}): User {
    return {
      userId: 'user-test-123',
      email: 'test@example.com',
      passwordHash: '$2b$10$test.hash.value',
      role: UserRole.SHELTER_OPERATOR,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-123-4567',
        organization: 'Red Cross'
      },
      shelterId: 'shelter-test-456',
      isActive: true,
      createdAt: '2025-09-20T10:00:00.000Z',
      lastLogin: '2025-09-20T10:00:00.000Z',
      ...overrides
    };
  }

  static createMockPublicUser(overrides: Partial<PublicUser> = {}): PublicUser {
    const { passwordHash, ...user } = this.createMockUser(overrides);
    return user;
  }

  static createMockShelterOperator(): User {
    return this.createMockUser({
      userId: 'user-shelter-op-123',
      email: 'operator@shelter.org',
      role: UserRole.SHELTER_OPERATOR,
      shelterId: 'shelter-123'
    });
  }

  static createMockFirstResponder(): User {
    return this.createMockUser({
      userId: 'user-responder-123',
      email: 'responder@fire.gov',
      role: UserRole.FIRST_RESPONDER,
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-987-6543',
        organization: 'Fire Department'
      },
      shelterId: undefined
    });
  }

  static createMockAdmin(): User {
    return this.createMockUser({
      userId: 'user-admin-123',
      email: 'admin@safehaven.org',
      role: UserRole.ADMIN,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        organization: 'SafeHaven System'
      },
      shelterId: undefined
    });
  }
}

/**
 * Mock alert data generators
 */
export class AlertFixtures {
  static createMockAlert(overrides: Partial<Alert> = {}): Alert {
    return {
      alertId: 'alert-test-123',
      shelterId: 'shelter-test-456',
      type: AlertType.MEDICAL_EMERGENCY,
      priority: AlertPriority.HIGH,
      title: 'Medical Emergency',
      description: 'Person collapsed, need immediate medical attention',
      status: AlertStatus.OPEN,
      createdBy: 'user-shelter-op-123',
      timestamp: Date.now(),
      createdAt: '2025-09-20T10:00:00.000Z',
      ...overrides
    };
  }

  static createMockEmergencyAlert(): Alert {
    return this.createMockAlert({
      alertId: 'alert-emergency-123',
      type: AlertType.MEDICAL_EMERGENCY,
      priority: AlertPriority.CRITICAL,
      title: 'EMERGENCY: Medical Crisis',
      description: 'Multiple casualties, need ambulance and medical supplies immediately'
    });
  }

  static createMockResourceAlert(): Alert {
    return this.createMockAlert({
      alertId: 'alert-resource-123',
      type: AlertType.RESOURCE_CRITICAL,
      priority: AlertPriority.MEDIUM,
      title: 'Food Supply Running Low',
      description: 'Food supplies will be depleted in 6 hours, need immediate resupply'
    });
  }

  static createMockWeatherAlert(): Alert {
    return this.createMockAlert({
      alertId: 'alert-weather-123',
      type: AlertType.GENERAL_ASSISTANCE,
      priority: AlertPriority.HIGH,
      title: 'Severe Weather Warning',
      description: 'Tornado warning issued for our area, need to secure facility'
    });
  }

  static createMockAcknowledgedAlert(): Alert {
    return this.createMockAlert({
      alertId: 'alert-ack-123',
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: 'user-responder-123',
      acknowledgedAt: '2025-09-20T10:05:00.000Z'
    });
  }

  static createMockResolvedAlert(): Alert {
    return this.createMockAlert({
      alertId: 'alert-resolved-123',
      status: AlertStatus.RESOLVED,
      acknowledgedBy: 'user-responder-123',
      acknowledgedAt: '2025-09-20T10:05:00.000Z',
      resolvedAt: '2025-09-20T10:30:00.000Z'
    });
  }
}

/**
 * Mock AWS service responses
 */
export class AWSMockFixtures {
  static createMockDynamoDBGetResponse(item: any = null) {
    return {
      Item: item,
      $metadata: { httpStatusCode: 200 }
    };
  }

  static createMockDynamoDBPutResponse() {
    return {
      $metadata: { httpStatusCode: 200 }
    };
  }

  static createMockDynamoDBUpdateResponse(item: any) {
    return {
      Attributes: item,
      $metadata: { httpStatusCode: 200 }
    };
  }

  static createMockDynamoDBQueryResponse(items: any[] = []) {
    return {
      Items: items,
      Count: items.length,
      ScannedCount: items.length,
      $metadata: { httpStatusCode: 200 }
    };
  }

  static createMockDynamoDBScanResponse(items: any[] = []) {
    return {
      Items: items,
      Count: items.length,
      ScannedCount: items.length,
      $metadata: { httpStatusCode: 200 }
    };
  }

  static createMockSNSPublishResponse() {
    return {
      MessageId: 'mock-message-id-123',
      $metadata: { httpStatusCode: 200 }
    };
  }
}

/**
 * Test input data generators
 */
export class InputFixtures {
  static createValidUserRegistration() {
    return {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: UserRole.SHELTER_OPERATOR,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-123-4567',
        organization: 'Red Cross'
      }
    };
  }

  static createValidShelterOperatorRegistration() {
    return {
      ...this.createValidUserRegistration(),
      shelterInfo: {
        name: 'Downtown Emergency Shelter',
        location: {
          latitude: 32.7767,
          longitude: -96.7970,
          address: '123 Main St, Dallas, TX 75201'
        },
        capacity: {
          maximum: 200
        },
        contactInfo: {
          phone: '+1-555-123-4567',
          email: 'contact@downtownshelter.org'
        }
      }
    };
  }

  static createValidAlertCreation() {
    return {
      shelterId: 'shelter-test-456',
      type: AlertType.MEDICAL_EMERGENCY,
      priority: AlertPriority.HIGH,
      title: 'Medical Emergency',
      description: 'Person collapsed, need immediate medical attention',
      createdBy: 'user-shelter-op-123'
    };
  }

  static createInvalidUserRegistration() {
    return {
      email: 'invalid-email',
      password: 'weak',
      role: 'invalid_role',
      profile: {
        firstName: '',
        lastName: ''
      }
    };
  }

  static createInvalidAlertCreation() {
    return {
      shelterId: '',
      type: 'invalid_type',
      priority: 'invalid_priority',
      title: '',
      description: ''
    };
  }
}

/**
 * Mock API Gateway event generators
 */
export class APIGatewayFixtures {
  static createMockEvent(
    body: any = {},
    pathParameters: Record<string, string> = {},
    headers: Record<string, string> = {},
    authorizer: Record<string, any> = {}
  ) {
    return {
      body: JSON.stringify(body),
      pathParameters,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      requestContext: {
        accountId: '123456789012',
        apiId: 'test-api-id',
        protocol: 'HTTP/1.1',
        httpMethod: 'POST',
        path: '/api/test',
        stage: 'test',
        requestId: 'test-request-id',
        requestTimeEpoch: Date.now(),
        resourceId: 'test-resource-id',
        resourcePath: '/api/test',
        authorizer: {
          userId: 'user-test-123',
          email: 'test@example.com',
          role: UserRole.SHELTER_OPERATOR,
          ...authorizer
        },
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: '127.0.0.1',
          user: null,
          userAgent: 'test-user-agent',
          userArn: null,
          clientCert: {
            clientCertPem: 'CERT_CONTENT',
            subjectDN: 'www.example.com',
            issuerDN: 'Example issuer',
            serialNumber: '123456789',
            validity: {
              notBefore: 'May 28 12:30:02 2009 GMT',
              notAfter: 'Aug  5 09:36:04 2021 GMT'
            }
          }
        }
      },
      httpMethod: 'POST',
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      path: '/api/test',
      queryStringParameters: null,
      resource: '/api/test',
      stageVariables: null
    };
  }

  static createMockContext() {
    return {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '256',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2025/09/20/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {}
    };
  }
}

/**
 * Validation test cases
 */
export class ValidationFixtures {
  static getPasswordValidationCases() {
    return {
      valid: [
        'SecurePass123!',
        'Complex$Pass9',
        'StrongP@ssw0rd',
        'MySecure#Pass7'
      ],
      invalid: [
        { password: 'short', expectedError: 'Password must be at least 8 characters long' },
        { password: 'lowercase123!', expectedError: 'Password must contain at least one uppercase letter' },
        { password: 'UPPERCASE123!', expectedError: 'Password must contain at least one lowercase letter' },
        { password: 'NoNumbers!', expectedError: 'Password must contain at least one number' },
        { password: 'NoSpecialChars123', expectedError: 'Password must contain at least one special character' }
      ]
    };
  }

  static getEmailValidationCases() {
    return {
      valid: [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@example.co.uk',
        'user123@sub.domain.com'
      ],
      invalid: [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@.com',
        'user space@domain.com'
      ]
    };
  }
}