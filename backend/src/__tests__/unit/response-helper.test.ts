import { responseHelper } from '../../utils/responseHelper';

describe('ResponseHelper', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent timestamps in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('success', () => {
    it('should create successful response with default status code', () => {
      const testData = { id: '123', name: 'Test Item' };
      
      const response = responseHelper.success(testData);

      expect(response).toEqual({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          data: testData,
          timestamp: '2025-01-01T12:00:00.000Z'
        })
      });
    });

    it('should create successful response with custom status code', () => {
      const testData = { created: true };
      
      const response = responseHelper.success(testData, 201);

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(testData);
    });

    it('should handle null data', () => {
      const response = responseHelper.success(null);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBe(null);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        users: [
          { id: 1, name: 'User 1', roles: ['admin', 'user'] },
          { id: 2, name: 'User 2', roles: ['user'] }
        ],
        metadata: {
          total: 2,
          page: 1,
          hasMore: false
        }
      };

      const response = responseHelper.success(complexData);

      const body = JSON.parse(response.body);
      expect(body.data).toEqual(complexData);
    });
  });

  describe('error', () => {
    it('should create error response with default status code', () => {
      const errorMessage = 'Something went wrong';
      
      const response = responseHelper.error(errorMessage);

      expect(response).toEqual({
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: {
            message: errorMessage,
            details: undefined,
            statusCode: 400
          },
          timestamp: '2025-01-01T12:00:00.000Z'
        })
      });
    });

    it('should create error response with custom status code and details', () => {
      const errorMessage = 'Validation failed';
      const details = {
        field: 'email',
        issue: 'invalid format'
      };
      
      const response = responseHelper.error(errorMessage, 422, details);

      expect(response.statusCode).toBe(422);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe(errorMessage);
      expect(body.error.details).toEqual(details);
      expect(body.error.statusCode).toBe(422);
    });

    it('should handle error details as array', () => {
      const errorMessage = 'Multiple validation errors';
      const details = [
        'Email is required',
        'Password must be at least 8 characters',
        'Phone number is invalid'
      ];
      
      const response = responseHelper.error(errorMessage, 400, details);

      const body = JSON.parse(response.body);
      expect(body.error.details).toEqual(details);
    });
  });

  describe('convenience methods', () => {
    describe('badRequest', () => {
      it('should create 400 Bad Request response', () => {
        const message = 'Invalid request parameters';
        const details = { param: 'userId', issue: 'missing' };
        
        const response = responseHelper.badRequest(message, details);

        expect(response.statusCode).toBe(400);
        
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe(message);
        expect(body.error.details).toEqual(details);
      });

      it('should work without details', () => {
        const message = 'Bad request';
        
        const response = responseHelper.badRequest(message);

        expect(response.statusCode).toBe(400);
        
        const body = JSON.parse(response.body);
        expect(body.error.details).toBeUndefined();
      });
    });

    describe('unauthorized', () => {
      it('should create 401 Unauthorized response with default message', () => {
        const response = responseHelper.unauthorized();

        expect(response.statusCode).toBe(401);
        
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Unauthorized');
      });

      it('should create 401 Unauthorized response with custom message', () => {
        const customMessage = 'Invalid authentication token';
        
        const response = responseHelper.unauthorized(customMessage);

        const body = JSON.parse(response.body);
        expect(body.error.message).toBe(customMessage);
      });
    });

    describe('forbidden', () => {
      it('should create 403 Forbidden response with default message', () => {
        const response = responseHelper.forbidden();

        expect(response.statusCode).toBe(403);
        
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Forbidden');
      });

      it('should create 403 Forbidden response with custom message', () => {
        const customMessage = 'Insufficient permissions to access this resource';
        
        const response = responseHelper.forbidden(customMessage);

        const body = JSON.parse(response.body);
        expect(body.error.message).toBe(customMessage);
      });
    });

    describe('notFound', () => {
      it('should create 404 Not Found response with default message', () => {
        const response = responseHelper.notFound();

        expect(response.statusCode).toBe(404);
        
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Resource not found');
      });

      it('should create 404 Not Found response with custom message', () => {
        const customMessage = 'Shelter not found';
        
        const response = responseHelper.notFound(customMessage);

        const body = JSON.parse(response.body);
        expect(body.error.message).toBe(customMessage);
      });
    });

    describe('internalError', () => {
      it('should create 500 Internal Server Error response with default message', () => {
        const response = responseHelper.internalError();

        expect(response.statusCode).toBe(500);
        
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Internal server error');
      });

      it('should create 500 Internal Server Error response with custom message', () => {
        const customMessage = 'Database connection failed';
        
        const response = responseHelper.internalError(customMessage);

        const body = JSON.parse(response.body);
        expect(body.error.message).toBe(customMessage);
      });
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in all responses', () => {
      const successResponse = responseHelper.success({});
      const errorResponse = responseHelper.error('Error');

      const expectedHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      };

      expect(successResponse.headers).toEqual(expectedHeaders);
      expect(errorResponse.headers).toEqual(expectedHeaders);
    });
  });

  describe('JSON serialization', () => {
    it('should properly serialize dates', () => {
      const dataWithDate = {
        createdAt: new Date('2025-01-01T12:00:00.000Z'),
        name: 'Test'
      };

      const response = responseHelper.success(dataWithDate);
      const body = JSON.parse(response.body);

      expect(body.data.createdAt).toBe('2025-01-01T12:00:00.000Z');
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'Test' };
      circular.self = circular;

      expect(() => {
        responseHelper.success(circular);
      }).toThrow(); // JSON.stringify should throw on circular references
    });

    it('should handle undefined values', () => {
      const dataWithUndefined = {
        defined: 'value',
        undefined: undefined
      };

      const response = responseHelper.success(dataWithUndefined);
      const body = JSON.parse(response.body);

      // JSON.stringify removes undefined values
      expect(body.data).toEqual({ defined: 'value' });
    });
  });

  describe('timestamp consistency', () => {
    it('should include consistent timestamps in responses', () => {
      const response1 = responseHelper.success({});
      const response2 = responseHelper.error('Error');

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      expect(body1.timestamp).toBe('2025-01-01T12:00:00.000Z');
      expect(body2.timestamp).toBe('2025-01-01T12:00:00.000Z');
      expect(body1.timestamp).toBe(body2.timestamp);
    });
  });
});