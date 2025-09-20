import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '../../pages/DashboardPage';

// Mock types
const AlertPriority = {
  CRITICAL: 'critical' as const
};

const AlertStatus = {
  OPEN: 'open' as const
};

const AlertType = {
  MEDICAL_EMERGENCY: 'medical_emergency' as const
};

// Mock all the hooks and services
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      profile: { firstName: 'John', lastName: 'Doe' }
    },
    logout: jest.fn()
  })
}));

jest.mock('../../hooks/useRealtimeData', () => ({
  useRealtimeData: () => ({
    state: { isLoading: false, error: null, lastUpdated: new Date() },
    refreshData: jest.fn(),
    acknowledgeAlert: jest.fn()
  }),
  useShelters: () => [],
  useActiveAlerts: () => [
    {
      alertId: 'alert-1',
      shelterId: 'shelter-1',
      type: 'medical_emergency',
      priority: 'critical',
      title: 'Medical Emergency',
      description: 'Patient needs immediate attention',
      status: 'open',
      createdBy: 'operator-1',
      createdAt: '2025-01-01T10:00:00Z',
      timestamp: Date.now()
    }
  ],
  useShelterStats: () => ({
    total: 5,
    operational: 4,
    availableCapacity: 100,
    currentOccupancy: 50,
    byStatus: {
      available: 2,
      limited: 1,
      full: 1,
      emergency: 0,
      offline: 1
    }
  }),
  useConnectionStatus: () => ({ status: 'connected' })
}));

// Mock components
jest.mock('../../components/AwsLocationMap', () => {
  return function MockAwsLocationMap() {
    return <div data-testid="aws-location-map">Map Component</div>;
  };
});

jest.mock('../../components/ConnectionStatusIndicator', () => {
  return function MockConnectionStatusIndicator() {
    return <div data-testid="connection-status">Connected</div>;
  };
});

describe('Alert Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with alert management features', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('SafeHaven Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    expect(screen.getAllByText('Medical Emergency')).toHaveLength(2); // One in sidebar, one in notification
  });

  it('should show manage alerts button', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Manage Alerts')).toBeInTheDocument();
  });

  it('should toggle alert panel when manage button clicked', async () => {
    render(<DashboardPage />);
    
    const manageButton = screen.getByText('Manage Alerts');
    fireEvent.click(manageButton);
    
    await waitFor(() => {
      expect(screen.getByText('Alert Management')).toBeInTheDocument();
    });
    
    // Click again to hide
    fireEvent.click(screen.getByText('Hide Alerts'));
    
    await waitFor(() => {
      expect(screen.queryByText('Alert Management')).not.toBeInTheDocument();
    });
  });

  it('should display alert with correct priority styling', () => {
    render(<DashboardPage />);
    
    const alertElements = screen.getAllByText('Medical Emergency');
    const sidebarAlert = alertElements[0].closest('.border-red-500');
    expect(sidebarAlert).toBeInTheDocument();
  });

  it('should show acknowledge button for open alerts', () => {
    render(<DashboardPage />);
    
    expect(screen.getAllByText('Acknowledge')).toHaveLength(2); // One in sidebar, one in notification
  });

  it('should display alert priority badge', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('should show correct alert timestamp', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });

  it('should integrate with shelter stats', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // Total shelters
    expect(screen.getByText('4')).toBeInTheDocument(); // Operational
    expect(screen.getByText('100')).toBeInTheDocument(); // Available capacity
  });

  it('should show connection status', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
  });

  it('should render map component', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('aws-location-map')).toBeInTheDocument();
  });

  it('should show user information in header', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
  });

  it('should have refresh functionality', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should have logout functionality', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});