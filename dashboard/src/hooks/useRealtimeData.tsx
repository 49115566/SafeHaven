import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Shelter, Alert, ShelterStatus, AlertStatus } from 'safehaven-shared';
import { getWebSocketService, WebSocketConnectionState, WebSocketServiceCallbacks } from '../services/websocketService';
import { getApiService } from '../services/apiService';
import { useAuth } from './useAuth';

// State interface
export interface RealtimeDataState {
  shelters: Record<string, Shelter>;
  alerts: Record<string, Alert>;
  connectionState: WebSocketConnectionState;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Action types
type RealtimeDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHELTERS'; payload: Shelter[] }
  | { type: 'CLEAR_SHELTERS' }
  | { type: 'UPDATE_SHELTER'; payload: Shelter }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'CLEAR_ALERTS' }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'UPDATE_ALERT'; payload: Alert }
  | { type: 'SET_CONNECTION_STATE'; payload: WebSocketConnectionState }
  | { type: 'SET_LAST_UPDATED'; payload: Date };

// Initial state
const initialState: RealtimeDataState = {
  shelters: {},
  alerts: {},
  connectionState: {
    status: 'disconnected',
    reconnectAttempts: 0
  },
  isLoading: true,
  error: null,
  lastUpdated: null
};

// Reducer
function realtimeDataReducer(state: RealtimeDataState, action: RealtimeDataAction): RealtimeDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_SHELTERS':
      const sheltersById = action.payload.reduce((acc, shelter) => {
        acc[shelter.shelterId] = shelter;
        return acc;
      }, {} as Record<string, Shelter>);
      return {
        ...state,
        shelters: sheltersById,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      };
    
    case 'CLEAR_SHELTERS':
      return {
        ...state,
        shelters: {}
      };
    
    case 'UPDATE_SHELTER':
      return {
        ...state,
        shelters: {
          ...state.shelters,
          [action.payload.shelterId]: action.payload
        },
        lastUpdated: new Date()
      };
    
    case 'SET_ALERTS':
      const alertsById = action.payload.reduce((acc, alert) => {
        acc[alert.alertId] = alert;
        return acc;
      }, {} as Record<string, Alert>);
      return {
        ...state,
        alerts: alertsById,
        lastUpdated: new Date()
      };
    
    case 'CLEAR_ALERTS':
      return {
        ...state,
        alerts: {}
      };
    
    case 'ADD_ALERT':
    case 'UPDATE_ALERT':
      return {
        ...state,
        alerts: {
          ...state.alerts,
          [action.payload.alertId]: action.payload
        },
        lastUpdated: new Date()
      };
    
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        connectionState: action.payload
      };
    
    case 'SET_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: action.payload
      };
    
    default:
      return state;
  }
}

// Context
const RealtimeDataContext = createContext<{
  state: RealtimeDataState;
  dispatch: React.Dispatch<RealtimeDataAction>;
  refreshData: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
} | null>(null);

// Provider component
interface RealtimeDataProviderProps {
  children: ReactNode;
}

export function RealtimeDataProvider({ children }: RealtimeDataProviderProps) {
  const [state, dispatch] = useReducer(realtimeDataReducer, initialState);
  const { isAuthenticated, token } = useAuth();

  // WebSocket callbacks
  const webSocketCallbacks: WebSocketServiceCallbacks = {
    onShelterUpdate: (shelter: Shelter) => {
      console.log('Received shelter update:', shelter);
      dispatch({ type: 'UPDATE_SHELTER', payload: shelter });
    },
    
    onAlert: (alert: Alert) => {
      console.log('Received new alert:', alert);
      dispatch({ type: 'ADD_ALERT', payload: alert });
    },
    
    onConnectionStateChange: (connectionState: WebSocketConnectionState) => {
      console.log('WebSocket connection state changed:', connectionState);
      dispatch({ type: 'SET_CONNECTION_STATE', payload: connectionState });
    }
  };

  // Load initial data from API
  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const apiService = getApiService();
      
      if (!apiService) {
        throw new Error('API service not available');
      }
      
      // Load shelters and alerts in parallel
      const [shelters, alerts] = await Promise.all([
        apiService.getShelters(),
        apiService.getAlerts()
      ]);

      dispatch({ type: 'SET_SHELTERS', payload: shelters });
      dispatch({ type: 'SET_ALERTS', payload: alerts });

    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load data'
      });
    }
  };

  // Refresh data (can be called manually)
  const refreshData = async () => {
    await loadInitialData();
  };

  // Acknowledge an alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const apiService = getApiService();
      
      if (!apiService) {
        throw new Error('API service not available');
      }
      
      const updatedAlert = await apiService.acknowledgeAlert(alertId);
      
      if (updatedAlert) {
        dispatch({ type: 'UPDATE_ALERT', payload: updatedAlert });
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      // Could show a toast notification here
    }
  };

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      const wsService = getWebSocketService();
      
      // Set token for API service
      const apiService = getApiService();
      if (apiService && typeof apiService.setToken === 'function') {
        apiService.setToken(token);
      }
      
      // Connect WebSocket
      if (wsService && typeof wsService.connect === 'function') {
        wsService.connect(token, webSocketCallbacks);
      }
      
      // Load initial data
      loadInitialData();

      // Cleanup on unmount or authentication change
      return () => {
        if (wsService && typeof wsService.disconnect === 'function') {
          wsService.disconnect();
        }
        if (apiService && typeof apiService.clearToken === 'function') {
          apiService.clearToken();
        }
      };
    } else {
      // Clear data when not authenticated but keep loading state
      dispatch({ type: 'CLEAR_SHELTERS' });
      dispatch({ type: 'CLEAR_ALERTS' });
      dispatch({ type: 'SET_CONNECTION_STATE', payload: { status: 'disconnected', reconnectAttempts: 0 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const contextValue = {
    state,
    dispatch,
    refreshData,
    acknowledgeAlert
  };

  return React.createElement(RealtimeDataContext.Provider, { value: contextValue }, children);
}

// Hook to use the realtime data context
export function useRealtimeData() {
  const context = useContext(RealtimeDataContext);
  
  if (!context) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }
  
  return context;
}

// Additional convenience hooks for specific data
export function useShelters() {
  const { state } = useRealtimeData();
  return Object.values(state.shelters);
}

export function useShelter(shelterId: string) {
  const { state } = useRealtimeData();
  return state.shelters[shelterId] || null;
}

export function useAlerts() {
  const { state } = useRealtimeData();
  return Object.values(state.alerts).sort((a, b) => {
    // Sort by status first (OPEN alerts first), then by alertId for consistency
    if (a.status !== b.status) {
      if (a.status === AlertStatus.OPEN) return -1;
      if (b.status === AlertStatus.OPEN) return 1;
    }
    return a.alertId.localeCompare(b.alertId);
  });
}

export function useActiveAlerts() {
  const alerts = useAlerts();
  return alerts.filter(alert => alert.status === 'open' || alert.status === 'acknowledged');
}

export function useConnectionStatus() {
  const { state } = useRealtimeData();
  return state.connectionState;
}

// Utility hooks for dashboard stats
export function useShelterStats() {
  const shelters = useShelters();
  
  const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity.maximum, 0);
  const currentOccupancy = shelters.reduce((sum, s) => sum + s.capacity.current, 0);
  const availableShelters = shelters.filter(s => s.status === ShelterStatus.AVAILABLE).length;
  const limitedShelters = shelters.filter(s => s.status === ShelterStatus.LIMITED).length;
  const fullShelters = shelters.filter(s => s.status === ShelterStatus.FULL).length;
  const emergencyShelters = shelters.filter(s => s.status === ShelterStatus.EMERGENCY).length;
  const offlineShelters = shelters.filter(s => s.status === ShelterStatus.OFFLINE).length;
  const operationalShelters = availableShelters + limitedShelters + fullShelters + emergencyShelters;
  
  return {
    // Properties for backward compatibility with unit tests
    totalShelters: shelters.length,
    availableShelters,
    totalCapacity,
    currentOccupancy,
    availableCapacity: totalCapacity - currentOccupancy,
    occupancyRate: totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0,
    statusBreakdown: {
      AVAILABLE: availableShelters,
      LIMITED: limitedShelters,
      FULL: fullShelters,
      EMERGENCY: emergencyShelters,
      OFFLINE: offlineShelters
    },
    // Properties expected by DashboardPage
    total: shelters.length,
    operational: operationalShelters,
    byStatus: {
      available: availableShelters,
      limited: limitedShelters,
      full: fullShelters,
      emergency: emergencyShelters,
      offline: offlineShelters
    }
  };
}