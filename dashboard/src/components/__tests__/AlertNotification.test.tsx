import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AlertNotification from '../AlertNotification';

// Mock Audio to prevent test environment issues
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  volume: 0.3,
};

(global as any).Audio = jest.fn(() => mockAudio);

// Mock types
const AlertPriority = {
  CRITICAL: 'critical' as const,
  HIGH: 'high' as const,
  MEDIUM: 'medium' as const,
  LOW: 'low' as const
};

const AlertStatus = {
  OPEN: 'open' as const,
  ACKNOWLEDGED: 'acknowledged' as const
};

const AlertType = {
  MEDICAL_EMERGENCY: 'medical_emergency' as const
};

describe('AlertNotification', () => {
  const mockOnDismiss = jest.fn();
  const mockOnAcknowledge = jest.fn();

  const mockAlert = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render alert notification', () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    expect(screen.getByText('CRITICAL ALERT')).toBeInTheDocument();
    expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
    expect(screen.getByText('Patient needs immediate attention')).toBeInTheDocument();
  });

  it('should show acknowledge button for open alerts', () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    expect(screen.getByText('Acknowledge')).toBeInTheDocument();
  });

  it('should not show acknowledge button for acknowledged alerts', () => {
    const acknowledgedAlert = { ...mockAlert, status: 'acknowledged' };
    
    render(
      <AlertNotification
        alert={acknowledgedAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
  });

  it('should call onAcknowledge when acknowledge button clicked', () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    fireEvent.click(screen.getByText('Acknowledge'));
    
    expect(mockOnAcknowledge).toHaveBeenCalledWith('alert-1');
  });

  it('should call onDismiss when dismiss button clicked', async () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    fireEvent.click(screen.getByText('Dismiss'));
    
    // Wait for the setTimeout to complete
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should call onDismiss when close button clicked', async () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    fireEvent.click(screen.getByText('×'));
    
    // Wait for the setTimeout to complete
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should auto-hide non-critical alerts', async () => {
    const lowPriorityAlert = { ...mockAlert, priority: 'low' };
    
    render(
      <AlertNotification
        alert={lowPriorityAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
        autoHide={true}
        duration={1000}
      />
    );
    
    // Wait for auto-hide to trigger
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should not auto-hide critical alerts', () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
        autoHide={true}
        duration={5000}
      />
    );
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('should display correct priority styling', () => {
    const { container } = render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    const notification = container.querySelector('.bg-red-600');
    expect(notification).toBeInTheDocument();
  });

  it('should show correct type icon', () => {
    render(
      <AlertNotification
        alert={mockAlert}
        onDismiss={mockOnDismiss}
        onAcknowledge={mockOnAcknowledge}
      />
    );
    
    expect(screen.getByText('🚨')).toBeInTheDocument();
  });
});