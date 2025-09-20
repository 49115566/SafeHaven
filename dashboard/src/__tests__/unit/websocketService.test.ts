import { WebSocketService, WebSocketServiceCallbacks } from '../../services/websocketService';
import { Shelter, Alert, ShelterStatus, ResourceStatus, AlertPriority, AlertStatus } from 'safehaven-shared';

// Mock WebSocket implementation
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  
  private listeners: { [key: string]: ((event: any) => void)[] } = {};

  constructor(public url: string) {}

  send(data: string): void {
    // Mock send - can be overridden in tests
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
      this.onclose(closeEvent);
    }
  }

  // Helper methods for testing
  simulateOpen(): void {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any): void {
    if (this.onmessage) {
      const messageEvent = new MessageEvent('message', { data: JSON.stringify(data) });
      this.onmessage(messageEvent);
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code, reason });
      this.onclose(closeEvent);
    }
  }
}

// Mock global WebSocket
declare global {
  var WebSocket: typeof MockWebSocket;
}

// Store original WebSocket to restore later
const originalWebSocket = global.WebSocket;

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockCallbacks: WebSocketServiceCallbacks;
  let mockWebSocket: MockWebSocket;
  const testToken = 'test-jwt-token';
  const testUrl = 'ws://localhost:3000';

  beforeEach(() => {
    // Mock timers first
    jest.useFakeTimers();
    
    // Mock WebSocket constructor
    global.WebSocket = jest.fn().mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    }) as any;

    // Mock WebSocket constants
    Object.defineProperty(global.WebSocket, 'CONNECTING', { value: 0 });
    Object.defineProperty(global.WebSocket, 'OPEN', { value: 1 });
    Object.defineProperty(global.WebSocket, 'CLOSING', { value: 2 });
    Object.defineProperty(global.WebSocket, 'CLOSED', { value: 3 });

    service = new WebSocketService(testUrl);
    mockCallbacks = {
      onShelterUpdate: jest.fn(),
      onAlert: jest.fn(),
      onConnectionStateChange: jest.fn()
    };

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    service.disconnect();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    global.WebSocket = originalWebSocket;
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      const state = service.getConnectionState();
      expect(state.status).toBe('disconnected');
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should connect with token and callbacks', () => {
      service.connect(testToken, mockCallbacks);

      expect(global.WebSocket).toHaveBeenCalledWith(
        `${testUrl}?Authorization=${encodeURIComponent(testToken)}`
      );
      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'connecting' })
      );
    });

    it('should update state to connected on successful connection', () => {
      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateOpen();

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'connected',
          reconnectAttempts: 0,
          lastError: undefined
        })
      );
    });

    it('should start heartbeat after successful connection', () => {
      service.connect(testToken, mockCallbacks);
      
      // Spy on send after connection is established
      const sendSpy = jest.spyOn(mockWebSocket, 'send').mockImplementation(() => {});
      
      mockWebSocket.simulateOpen();

      // Fast-forward heartbeat interval (30 seconds)
      jest.advanceTimersByTime(30000);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.action).toBe('ping');
      expect(sentData.timestamp).toEqual(expect.any(String));
    });

    it('should handle connection error', () => {
      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateError();

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          lastError: 'WebSocket connection error'
        })
      );
    });

    it('should disconnect cleanly', () => {
      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateOpen();
      
      const closeSpy = jest.spyOn(mockWebSocket, 'close');
      
      service.disconnect();

      expect(closeSpy).toHaveBeenCalledWith(1000, 'Normal closure');
      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'disconnected',
          reconnectAttempts: 0
        })
      );
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateOpen();
      jest.clearAllMocks(); // Clear connection-related calls
    });

    it('should handle shelter update messages', () => {
      const testShelter: Shelter = {
        shelterId: 'shelter-001',
        name: 'Test Shelter',
        location: { 
          latitude: 32.7767, 
          longitude: -96.7970,
          address: '123 Test St'
        },
        capacity: { maximum: 100, current: 50 },
        resources: {
          food: ResourceStatus.ADEQUATE,
          water: ResourceStatus.ADEQUATE,
          medical: ResourceStatus.LOW,
          bedding: ResourceStatus.ADEQUATE
        },
        status: ShelterStatus.AVAILABLE,
        operatorId: 'operator-001',
        contactInfo: {
          phone: '555-0123',
          email: 'shelter@test.com'
        },
        urgentNeeds: [],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      mockWebSocket.simulateMessage({
        action: 'shelter_update',
        data: testShelter
      });

      expect(mockCallbacks.onShelterUpdate).toHaveBeenCalledWith(testShelter);
    });

    it('should handle alert messages', () => {
      const testAlert: Alert = {
        alertId: 'alert-001',
        shelterId: 'shelter-001',
        type: 'medical_emergency' as any, // Will use proper enum when available
        title: 'Medical Emergency',
        description: 'Medical assistance needed',
        priority: AlertPriority.HIGH,
        timestamp: Date.now(),
        status: AlertStatus.OPEN,
        createdBy: 'user-001',
        createdAt: new Date().toISOString()
      };

      mockWebSocket.simulateMessage({
        action: 'alert',
        data: testAlert
      });

      expect(mockCallbacks.onAlert).toHaveBeenCalledWith(testAlert);
    });

    it('should handle pong messages for heartbeat', () => {
      mockWebSocket.simulateMessage({
        action: 'pong'
      });

      // Should not call any callbacks but should log (which we mocked)
      expect(mockCallbacks.onShelterUpdate).not.toHaveBeenCalled();
      expect(mockCallbacks.onAlert).not.toHaveBeenCalled();
    });

    it('should handle error messages', () => {
      const errorMessage = 'Server error occurred';
      
      mockWebSocket.simulateMessage({
        action: 'error',
        error: errorMessage
      });

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          lastError: errorMessage
        })
      );
    });

    it('should handle unknown message types gracefully', () => {
      mockWebSocket.simulateMessage({
        action: 'unknown_action',
        data: 'some data'
      });

      // Should not throw error or call callbacks
      expect(mockCallbacks.onShelterUpdate).not.toHaveBeenCalled();
      expect(mockCallbacks.onAlert).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON messages gracefully', () => {
      // Simulate receiving invalid JSON
      if (mockWebSocket.onmessage) {
        const invalidEvent = new MessageEvent('message', { data: 'invalid-json' });
        mockWebSocket.onmessage(invalidEvent);
      }

      // Should not throw error or call callbacks
      expect(mockCallbacks.onShelterUpdate).not.toHaveBeenCalled();
      expect(mockCallbacks.onAlert).not.toHaveBeenCalled();
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateOpen();
    });

    it('should send messages when connected', () => {
      const sendSpy = jest.spyOn(mockWebSocket, 'send').mockImplementation(() => {});
      
      service.sendMessage('test_action', { test: 'data' }, { target: 'shelter-001' });

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData.action).toBe('test_action');
      expect(sentData.data).toEqual({ test: 'data' });
      expect(sentData.target).toEqual({ target: 'shelter-001' });
      expect(sentData.timestamp).toEqual(expect.any(String));
    });

    it('should not send messages when disconnected', () => {
      const sendSpy = jest.spyOn(mockWebSocket, 'send').mockImplementation(() => {});
      
      service.disconnect();
      service.sendMessage('test_action', { test: 'data' });

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should not send messages when connecting', () => {
      const sendSpy = jest.spyOn(mockWebSocket, 'send').mockImplementation(() => {});
      
      // Don't simulate open, keep in connecting state
      mockWebSocket.readyState = WebSocket.CONNECTING;
      service.sendMessage('test_action', { test: 'data' });

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateOpen();
      // Clear callback mocks but keep WebSocket constructor call count
      (mockCallbacks.onShelterUpdate as jest.Mock).mockClear();
      (mockCallbacks.onAlert as jest.Mock).mockClear();
      (mockCallbacks.onConnectionStateChange as jest.Mock).mockClear();
    });

    it('should attempt reconnection on unexpected disconnect', () => {
      // Simulate unexpected disconnection
      mockWebSocket.simulateClose(1006, 'Connection lost');

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'disconnected',
          lastError: 'Connection closed unexpectedly: Connection lost'
        })
      );

      // Fast-forward reconnection delay (1 second for first attempt)
      jest.advanceTimersByTime(1000);

      expect(global.WebSocket).toHaveBeenCalledTimes(2); // Initial + reconnect
    });

    it('should use exponential backoff for reconnection attempts', () => {
      // First reconnection attempt
      mockWebSocket.simulateClose(1006, 'Connection lost');
      jest.advanceTimersByTime(1000); // 1 second delay

      // Second reconnection attempt
      mockWebSocket.simulateClose(1006, 'Connection lost');
      jest.advanceTimersByTime(2000); // 2 second delay

      // Third reconnection attempt  
      mockWebSocket.simulateClose(1006, 'Connection lost');
      jest.advanceTimersByTime(4000); // 4 second delay

      expect(global.WebSocket).toHaveBeenCalledTimes(4); // Initial + 3 reconnects
    });

    it('should stop reconnecting after max attempts', () => {
      // Simulate 5 failed reconnection attempts
      for (let i = 0; i < 5; i++) {
        mockWebSocket.simulateClose(1006, 'Connection lost');
        jest.advanceTimersByTime(Math.pow(2, i) * 1000);
      }

      // Try one more time - should not attempt reconnection
      mockWebSocket.simulateClose(1006, 'Connection lost');
      jest.advanceTimersByTime(32000);

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          lastError: 'Max reconnection attempts reached'
        })
      );
    });

    it('should not reconnect on normal closure', () => {
      const webSocketMock = global.WebSocket as jest.MockedClass<typeof WebSocket>;
      const initialCalls = webSocketMock.mock.calls.length;
      
      // Simulate normal closure
      mockWebSocket.simulateClose(1000, 'Normal closure');
      
      // Fast-forward time
      jest.advanceTimersByTime(10000);

      // Should not attempt reconnection
      expect(global.WebSocket).toHaveBeenCalledTimes(initialCalls);
      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'disconnected',
          reconnectAttempts: 0
        })
      );
    });

    it('should reset reconnect attempts on successful connection', () => {
      // Fail once and reconnect
      mockWebSocket.simulateClose(1006, 'Connection lost');
      jest.advanceTimersByTime(1000);
      
      // Simulate successful reconnection
      mockWebSocket.simulateOpen();

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'connected',
          reconnectAttempts: 0
        })
      );
    });
  });

  describe('Authentication', () => {
    it('should include token in WebSocket URL', () => {
      const token = 'bearer-token-123';
      service.connect(token, mockCallbacks);

      expect(global.WebSocket).toHaveBeenCalledWith(
        `${testUrl}?Authorization=${encodeURIComponent(token)}`
      );
    });

    it('should not connect without token', () => {
      service.connect('', mockCallbacks);

      // Should not create WebSocket connection
      expect(global.WebSocket).not.toHaveBeenCalled();
    });

    it('should not connect without callbacks', () => {
      service.connect(testToken, null as any);

      // Should not create WebSocket connection
      expect(global.WebSocket).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket constructor errors', () => {
      // Mock WebSocket constructor to throw error
      const webSocketMock = global.WebSocket as jest.MockedClass<typeof WebSocket>;
      webSocketMock.mockImplementationOnce(() => {
        throw new Error('Constructor failed');
      });

      service.connect(testToken, mockCallbacks);

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          lastError: 'Failed to create connection'
        })
      );
    });

    it('should clear timers on disconnect', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.connect(testToken, mockCallbacks);
      mockWebSocket.simulateOpen();
      
      // Trigger reconnection to create timers
      mockWebSocket.simulateClose(1006, 'Connection lost');
      
      service.disconnect();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Connection State Management', () => {
    it('should provide current connection state', () => {
      const initialState = service.getConnectionState();
      expect(initialState).toEqual({
        status: 'disconnected',
        reconnectAttempts: 0
      });

      service.connect(testToken, mockCallbacks);
      
      const connectingState = service.getConnectionState();
      expect(connectingState.status).toBe('connecting');
    });

    it('should notify callbacks of state changes', () => {
      service.connect(testToken, mockCallbacks);
      
      // Should have been called for connecting state
      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'connecting' })
      );

      mockWebSocket.simulateOpen();
      
      // Should have been called for connected state
      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'connected' })
      );
    });
  });
});

describe('getWebSocketService singleton', () => {
  beforeEach(() => {
    // Reset environment variable
    delete process.env.REACT_APP_WS_URL;
    
    // Reset module to clear singleton
    jest.resetModules();
  });

  it('should return singleton instance', () => {
    const { getWebSocketService } = require('../../services/websocketService');
    
    const instance1 = getWebSocketService();
    const instance2 = getWebSocketService();
    
    expect(instance1).toBe(instance2);
  });

  it('should use environment variable for WebSocket URL', () => {
    process.env.REACT_APP_WS_URL = 'ws://custom:8080';
    
    const { getWebSocketService } = require('../../services/websocketService');
    const service = getWebSocketService();
    
    // Access private property for testing
    expect((service as any).url).toBe('ws://custom:8080');
  });

  it('should use default URL when environment variable is not set', () => {
    const { getWebSocketService } = require('../../services/websocketService');
    const service = getWebSocketService();
    
    // Access private property for testing
    expect((service as any).url).toBe('ws://localhost:3011');
  });
});