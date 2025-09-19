interface ApiResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
  };
  body: string;
}

export const responseHelper = {
  success: (data: any, statusCode = 200): ApiResponse => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    })
  }),

  error: (message: string, statusCode = 400, details?: any): ApiResponse => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        details,
        statusCode
      },
      timestamp: new Date().toISOString()
    })
  }),

  badRequest: (message: string, details?: any): ApiResponse =>
    responseHelper.error(message, 400, details),

  unauthorized: (message = 'Unauthorized'): ApiResponse =>
    responseHelper.error(message, 401),

  forbidden: (message = 'Forbidden'): ApiResponse =>
    responseHelper.error(message, 403),

  notFound: (message = 'Resource not found'): ApiResponse =>
    responseHelper.error(message, 404),

  internalError: (message = 'Internal server error'): ApiResponse =>
    responseHelper.error(message, 500)
};