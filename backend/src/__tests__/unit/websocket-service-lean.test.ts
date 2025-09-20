import { WebSocketService } from '../../services/webSocketService';

// Simple mock without complex objects
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn()
    }))
  }
}));

jest.mock('@aws-sdk/client-apigatewaymanagementapi', () => ({
  ApiGatewayManagementApiClient: jest.fn(() => ({
    send: jest.fn()
  })),
  PostToConnectionCommand: jest.fn()
}));

describe('WebSocketService - Lean Tests', () => {
  let webSocketService: WebSocketService;

  beforeEach(() => {
    process.env.WEBSOCKET_CONNECTIONS_TABLE = 'test-connections';
    webSocketService = new WebSocketService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic initialization', () => {
    it('should create WebSocketService instance', () => {
      expect(webSocketService).toBeInstanceOf(WebSocketService);
    });

    it('should have required methods', () => {
      expect(typeof webSocketService.broadcastMessage).toBe('function');
      expect(typeof webSocketService.broadcastShelterUpdate).toBe('function');
      expect(typeof webSocketService.broadcastAlert).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables', () => {
      delete process.env.WEBSOCKET_CONNECTIONS_TABLE;
      expect(() => new WebSocketService()).not.toThrow();
    });
  });
});