import { Shelter, Alert } from 'safehaven-shared';

export interface WebSocketConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError?: string;
  reconnectAttempts: number;
}

export interface WebSocketServiceCallbacks {
  onShelterUpdate: (shelter: Shelter) => void;
  onAlert: (alert: Alert) => void;
  onConnectionStateChange: (state: WebSocketConnectionState) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private callbacks: WebSocketServiceCallbacks | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionState: WebSocketConnectionState = {
    status: 'disconnected',
    reconnectAttempts: 0
  };

  // Configuration
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY_BASE = 1000; // 1 second
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(wsUrl: string) {
    this.url = wsUrl;
  }

  /**
   * Connect to WebSocket with authentication token
   */
  public connect(token: string, callbacks: WebSocketServiceCallbacks): void {
    this.token = token;
    this.callbacks = callbacks;
    this.createConnection();
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }

    this.updateConnectionState({
      status: 'disconnected',
      reconnectAttempts: 0
    });
  }

  /**
   * Send message to WebSocket
   */
  public sendMessage(action: string, data?: any, target?: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        action,
        data,
        target,
        timestamp: new Date().toISOString()
      };
      
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', action);
    }
  }

  /**
   * Get current connection status
   */
  public getConnectionState(): WebSocketConnectionState {
    return { ...this.connectionState };
  }

  private createConnection(): void {
    if (!this.token || !this.callbacks) {
      console.error('Token and callbacks are required for WebSocket connection');
      return;
    }

    this.updateConnectionState({ 
      ...this.connectionState, 
      status: 'connecting' 
    });

    try {
      // Add authorization token to WebSocket URL as query parameter
      const wsUrlWithAuth = `${this.url}?Authorization=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(wsUrlWithAuth);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.updateConnectionState({
        ...this.connectionState,
        status: 'error',
        lastError: 'Failed to create connection'
      });
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    
    this.updateConnectionState({
      status: 'connected',
      reconnectAttempts: 0,
      lastError: undefined
    });

    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      switch (message.action) {
        case 'shelter_update':
          if (this.callbacks?.onShelterUpdate && message.data) {
            this.callbacks.onShelterUpdate(message.data);
          }
          break;

        case 'alert':
          if (this.callbacks?.onAlert && message.data) {
            this.callbacks.onAlert(message.data);
          }
          break;

        case 'pong':
          // Heartbeat response received
          console.log('Heartbeat pong received');
          break;

        case 'error':
          console.error('WebSocket error message:', message.error);
          this.updateConnectionState({
            ...this.connectionState,
            lastError: message.error
          });
          break;

        default:
          console.log('Unknown WebSocket message action:', message.action);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    this.clearTimers();
    this.ws = null;

    if (event.code !== 1000) { // Not a normal closure
      this.updateConnectionState({
        ...this.connectionState,
        status: 'disconnected',
        lastError: `Connection closed unexpectedly: ${event.reason}`
      });
      this.scheduleReconnect();
    } else {
      this.updateConnectionState({
        status: 'disconnected',
        reconnectAttempts: 0
      });
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    this.updateConnectionState({
      ...this.connectionState,
      status: 'error',
      lastError: 'WebSocket connection error'
    });
  }

  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Giving up.');
      this.updateConnectionState({
        ...this.connectionState,
        status: 'error',
        lastError: 'Max reconnection attempts reached'
      });
      return;
    }

    const delay = this.RECONNECT_DELAY_BASE * Math.pow(2, this.connectionState.reconnectAttempts);
    console.log(`Scheduling reconnection attempt ${this.connectionState.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.updateConnectionState({
        ...this.connectionState,
        reconnectAttempts: this.connectionState.reconnectAttempts + 1
      });
      this.createConnection();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage('ping');
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private updateConnectionState(newState: Partial<WebSocketConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...newState };
    
    if (this.callbacks?.onConnectionStateChange) {
      this.callbacks.onConnectionStateChange(this.connectionState);
    }
  }
}

// Singleton instance
let webSocketService: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!webSocketService) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3011';
    webSocketService = new WebSocketService(wsUrl);
  }
  return webSocketService;
}