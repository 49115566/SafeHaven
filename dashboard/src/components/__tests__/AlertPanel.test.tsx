import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlertPanel from '../AlertPanel';

// Mock types since safehaven-shared might not be available in tests
const AlertPriority = {
  CRITICAL: 'critical' as const,
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

const AlertStatus = {
  OPEN: 'open' as const,
  ACKNOWLEDGED: 'acknowledged' as const,
  IN_PROGRESS: 'in_progress' as const,
  RESOLVED: 'resolved' as const
};

const AlertType = {
  MEDICAL_EMERGENCY: 'medical_emergency' as const,
  RESOURCE_CRITICAL: 'resource_critical' as const,
  SECURITY_ISSUE: 'security_issue' as const,
  INFRASTRUCTURE_PROBLEM: 'infrastructure_problem' as const,
  CAPACITY_FULL: 'capacity_full' as const,
  GENERAL_ASSISTANCE: 'general_assistance' as const
};

// Mock the useRealtimeData hook
const mockUseActiveAlerts = jest.fn();
const mockUseRealtimeData = jest.fn();

jest.mock('../../hooks/useRealtimeData', () => ({
  useActiveAlerts: () => mockUseActiveAlerts(),
  useRealtimeData: () => mockUseRealtimeData(),
}));

// Mock AlertDetailsModal
jest.mock('../AlertDetailsModal', () => {
  return function MockAlertDetailsModal({ alert, onClose }: any) {
    return (
      <div data-testid="alert-details-modal">
        <h2>{alert.title}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock Audio to prevent test environment issues
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  volume: 0.3,
};

(global as any).Audio = jest.fn(() => mockAudio);

describe('AlertPanel', () => {
  const mockAcknowledgeAlert = jest.fn();

  const mockAlerts = [
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
    },
    {
      alertId: 'alert-2',
      shelterId: 'shelter-2',
      type: 'resource_critical',
      priority: 'high',
      title: 'Water Shortage',
      description: 'Running low on water supplies',
      status: 'acknowledged',
      createdBy: 'operator-2',
      createdAt: '2025-01-01T09:00:00Z',
      acknowledgedAt: '2025-01-01T09:30:00Z',
      timestamp: Date.now() - 3600000
    }
  ];

  beforeEach(() => {
    mockUseActiveAlerts.mockReturnValue(mockAlerts);
    mockUseRealtimeData.mockReturnValue({
      acknowledgeAlert: mockAcknowledgeAlert
    });
    jest.clearAllMocks();
    mockAudio.play.mockClear();
  });

  it('should render alert panel with alerts', () => {
    render(<AlertPanel />);
    
    expect(screen.getByText('Alert Management')).toBeInTheDocument();
    expect(screen.getAllByText('Medical Emergency')).toHaveLength(2); // Type and title
    expect(screen.getByText('Water Shortage')).toBeInTheDocument();
  });

  it('should display correct alert count', () => {
    render(<AlertPanel />);
    
    expect(screen.getByText('2 alerts')).toBeInTheDocument();
  });

  it('should show empty state when no alerts', () => {
    mockUseActiveAlerts.mockReturnValue([]);
    
    render(<AlertPanel />);
    
    expect(screen.getByText('No alerts match your filters')).toBeInTheDocument();
  });

  it('should acknowledge alert when button clicked', async () => {
    render(<AlertPanel />);
    
    const acknowledgeButton = screen.getByText('Acknowledge');
    fireEvent.click(acknowledgeButton);
    
    await waitFor(() => {
      expect(mockAcknowledgeAlert).toHaveBeenCalledWith('alert-1');
    });
  });

  it('should display correct priority colors', () => {
    render(<AlertPanel />);
    
    const criticalAlerts = screen.getAllByText('Medical Emergency');
    const criticalAlert = criticalAlerts[1].closest('.border-red-500'); // Use the title, not the type
    const highAlert = screen.getByText('Water Shortage').closest('.border-orange-500');
    
    expect(criticalAlert).toBeInTheDocument();
    expect(highAlert).toBeInTheDocument();
  });

  it('should show correct alert type icons', () => {
    render(<AlertPanel />);
    
    expect(screen.getByText('🏥')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});