import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AwsLocationMap from '../../components/AwsLocationMap';

// Create a completely simplified mock that prevents all AWS calls
jest.mock('@aws-sdk/client-location', () => ({
  LocationClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockRejectedValue(new Error('Mock AWS error'))
  })),
  GetMapStyleDescriptorCommand: jest.fn(),
}));

// Mock maplibre-gl to prevent map initialization
jest.mock('maplibre-gl', () => ({
  Map: jest.fn(),
  Marker: jest.fn(),
  Popup: jest.fn(),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
}));

describe('AwsLocationMap Component - Basic Rendering Tests', () => {
  test('should render loading state initially', () => {
    render(<AwsLocationMap />);
    expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
  });

  test('should show error state when AWS service fails', async () => {
    render(<AwsLocationMap />);
    
    // Wait for the error state to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to initialize AWS Location Service. Please check your configuration.')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check that loading state is gone
    expect(screen.queryByText('Loading AWS Location Service...')).not.toBeInTheDocument();
  });

  test('should render with custom className', () => {
    render(<AwsLocationMap className="custom-height" />);
    // Just verify the component renders without error when custom className is provided
    expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
  });

  test('should render Map Error heading in error state', async () => {
    render(<AwsLocationMap />);
    
    await waitFor(() => {
      expect(screen.getByText('Map Error')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('should show configuration help text in error state', async () => {
    render(<AwsLocationMap />);
    
    await waitFor(() => {
      expect(screen.getByText('Check AWS configuration and Location Service setup')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});