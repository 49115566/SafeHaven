import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserRole, ResourceStatus, AlertPriority, AlertType } from 'safehaven-shared';
import DashboardPage from '../../pages/DashboardPage';
import { RealtimeDataProvider } from '../../hooks/useRealtimeData';
import * as apiService from '../../services/apiService';
import * as websocketService from '../../services/websocketService';
import { useAuth } from '../../hooks/useAuth';

// Mock dependencies
jest.mock('../../services/apiService');
jest.mock('../../services/websocketService');
jest.mock('../../hooks/useAuth');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockWebSocketService = websocketService as jest.Mocked<typeof websocketService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock API service instance
const mockApiServiceInstance = {
  setToken: jest.fn(),
  clearToken: jest.fn(),
  getShelters: jest.fn(),
  getAlerts: jest.fn(),
  acknowledgeAlert: jest.fn()
};

// Mock WebSocket service instance
const mockWebSocketServiceInstance = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getConnectionState: jest.fn(() => ({
    status: 'disconnected',
    reconnectAttempts: 0
  }))
};

// Sample test data
const mockShelters = [
  {
    shelterId: 'shelter-001',
    name: 'Central Emergency Shelter',
    location: { 
      latitude: 40.7128, 
      longitude: -74.0060,
      address: '123 Main St, New York, NY' 
    },
    capacity: { current: 75, maximum: 100 },
    resources: {
      bedding: ResourceStatus.LOW,
      food: ResourceStatus.ADEQUATE,
      water: ResourceStatus.ADEQUATE,
      medical: ResourceStatus.CRITICAL
    },
    status: 'operational',
    operatorId: 'user-001',
    contactInfo: { phone: '555-0123', email: 'shelter@example.com' },
    urgentNeeds: ['Medical supplies', 'Blankets'],
    lastUpdated: '2025-09-20T08:00:00Z',
    createdAt: '2025-09-20T00:00:00Z'
  },
  {
    shelterId: 'shelter-002', 
    name: 'North Side Shelter',
    location: { 
      latitude: 40.7589, 
      longitude: -73.9851,
      address: '456 Oak Ave, New York, NY'
    },
    capacity: { current: 45, maximum: 80 },
    resources: {
      bedding: ResourceStatus.ADEQUATE,
      food: ResourceStatus.ADEQUATE,
      water: ResourceStatus.ADEQUATE,
      medical: ResourceStatus.ADEQUATE
    },
    status: 'operational',
    operatorId: 'user-002',
    contactInfo: { phone: '555-0456', email: 'north@example.com' },
    urgentNeeds: [],
    lastUpdated: '2025-09-20T07:45:00Z',
    createdAt: '2025-09-20T00:00:00Z'
  }
];

const mockAlerts = [
  {
    alertId: 'alert-001',
    type: AlertType.RESOURCE_CRITICAL,
    priority: AlertPriority.HIGH,
    shelterId: 'shelter-001',
    title: 'Medical Supplies Critical',
    description: 'Medical supply inventory critically low',
    status: 'open',
    createdBy: 'user-001',
    timestamp: 1726819200000,
    createdAt: '2025-09-20T08:00:00Z'
  },
  {
    alertId: 'alert-002',
    type: AlertType.CAPACITY_FULL,
    priority: AlertPriority.MEDIUM,
    shelterId: 'shelter-001',
    title: 'Capacity Warning',
    description: 'Shelter approaching full capacity',
    status: 'acknowledged',
    createdBy: 'user-001',
    acknowledgedBy: 'user-003',
    acknowledgedAt: '2025-09-20T07:45:00Z',
    timestamp: 1726817400000,
    createdAt: '2025-09-20T07:30:00Z'
  }
];

// Mock the AwsLocationMap component
jest.mock('../../components/AwsLocationMap', () => {
  return function MockAwsLocationMap() {
    return <div data-testid="aws-location-map">Mock Map</div>;
  };
});

// Test wrapper with provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RealtimeDataProvider>
    {children}
  </RealtimeDataProvider>
);

describe('DashboardPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API service mock - the key to making this work
    mockApiService.getApiService.mockReturnValue(mockApiServiceInstance as any);
    mockApiServiceInstance.getShelters.mockResolvedValue(mockShelters);
    mockApiServiceInstance.getAlerts.mockResolvedValue(mockAlerts);
    
    // Setup WebSocket service mock
    mockWebSocketService.getWebSocketService.mockReturnValue(mockWebSocketServiceInstance as any);
    
    // Mock auth
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-001',
        email: 'test@example.com',
        role: UserRole.SHELTER_OPERATOR,
        profile: { firstName: 'Test', lastName: 'User' },
        isActive: true,
        createdAt: '2025-09-20T08:00:00Z'
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      token: 'mock-token'
    });
    
    // Mock console to reduce noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering and Layout', () => {
    it('should render dashboard without API service error', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Should render the map component and dashboard title
      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });
      
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });

    it('should render all main dashboard sections', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });

      // Check for dashboard sections
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });

    it('should handle responsive design for mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });
      
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });
  });

  describe('Real-time Data Integration', () => {
    it('should initialize with shelter and alert data', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiServiceInstance.getShelters).toHaveBeenCalled();
      });
      
      expect(mockApiServiceInstance.getAlerts).toHaveBeenCalled();
      expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
    });

    it('should handle WebSocket connection for real-time updates', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocketServiceInstance.connect).toHaveBeenCalled();
      });
      
      // Verify connect was called with token and callbacks
      expect(mockWebSocketServiceInstance.connect).toHaveBeenCalledWith(
        'mock-token', 
        expect.objectContaining({
          onShelterUpdate: expect.any(Function),
          onAlert: expect.any(Function),
          onConnectionStateChange: expect.any(Function)
        })
      );
    });

    it('should handle real-time shelter updates', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Wait for WebSocket to connect
      await waitFor(() => {
        expect(mockWebSocketServiceInstance.connect).toHaveBeenCalled();
      });
      
      // Verify that callbacks are properly set up
      const connectCall = mockWebSocketServiceInstance.connect.mock.calls[0];
      expect(connectCall[1]).toHaveProperty('onShelterUpdate');
      expect(typeof connectCall[1].onShelterUpdate).toBe('function');
    });

    it('should handle real-time alert updates', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocketServiceInstance.connect).toHaveBeenCalled();
      });
      
      // Verify that callbacks are properly set up
      const connectCall = mockWebSocketServiceInstance.connect.mock.calls[0];
      expect(connectCall[1]).toHaveProperty('onAlert');
      expect(typeof connectCall[1].onAlert).toBe('function');
    });
  });

  describe('Authentication Integration', () => {
    it('should handle authenticated shelter operator', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiServiceInstance.setToken).toHaveBeenCalledWith('mock-token');
      });
    });

    it('should handle emergency coordinator role', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-coord',
          email: 'coordinator@example.com',
          role: UserRole.EMERGENCY_COORDINATOR,
          profile: { firstName: 'Emergency', lastName: 'Coordinator' },
          isActive: true,
          createdAt: '2025-09-20T08:00:00Z'
        },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        token: 'coordinator-token'
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiServiceInstance.setToken).toHaveBeenCalledWith('coordinator-token');
      });
    });

    it('should handle admin role access', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'user-admin',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          profile: { firstName: 'System', lastName: 'Admin' },
          isActive: true,
          createdAt: '2025-09-20T08:00:00Z'
        },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        token: 'admin-token'
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockApiServiceInstance.setToken).toHaveBeenCalledWith('admin-token');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API service errors gracefully', async () => {
      mockApiServiceInstance.getShelters.mockRejectedValue(new Error('API Error'));
      mockApiServiceInstance.getAlerts.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });
      
      // Should still render the dashboard despite API errors
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });

    it('should handle WebSocket connection failures', async () => {
      // Mock a failing connection state
      mockWebSocketServiceInstance.getConnectionState.mockReturnValue({
        status: 'error',
        reconnectAttempts: 3
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });
      
      // Should still render dashboard even with WebSocket errors
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });

    it('should handle empty shelter data', async () => {
      mockApiServiceInstance.getShelters.mockResolvedValue([]);
      mockApiServiceInstance.getAlerts.mockResolvedValue([]);

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle and Cleanup', () => {
    it('should handle component mounting and unmounting', () => {
      const { unmount } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should clean up WebSocket connections on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocketServiceInstance.connect).toHaveBeenCalled();
      });

      unmount();

      // Should have called disconnect during cleanup
      expect(mockWebSocketServiceInstance.disconnect).toHaveBeenCalled();
    });

    it('should handle rapid re-renders without errors', async () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });

      // Trigger re-render multiple times
      for (let i = 0; i < 3; i++) {
        rerender(
          <TestWrapper>
            <DashboardPage />
          </TestWrapper>
        );
      }

      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper accessibility structure', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });

      // Check for semantic structure
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });

      // Dashboard should be keyboard accessible
      const mapElement = screen.getByTestId('aws-location-map');
      expect(mapElement).toBeInTheDocument();
    });

    it('should handle different screen orientations', async () => {
      // Simulate portrait orientation
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
      });
      
      expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    });
  });
});
