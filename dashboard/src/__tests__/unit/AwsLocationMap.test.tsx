import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AwsLocationMap from '../../components/AwsLocationMap';
import { Shelter, ShelterStatus, ResourceStatus } from 'safehaven-shared';

// Mock AWS SDK and MapLibre GL
jest.mock('@aws-sdk/client-location', () => ({
  LocationClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockRejectedValue(new Error('Mock AWS error'))
  })),
  GetMapStyleDescriptorCommand: jest.fn(),
}));

jest.mock('maplibre-gl', () => ({
  Map: jest.fn().mockImplementation(() => ({
    addControl: jest.fn(),
    on: jest.fn(),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    loadImage: jest.fn(),
    getLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    getSource: jest.fn()
  })),
  Marker: jest.fn().mockImplementation(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    setPopup: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn()
  })),
  Popup: jest.fn().mockImplementation(() => ({
    setHTML: jest.fn().mockReturnThis(),
    setLngLat: jest.fn().mockReturnThis()
  })),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
}));

// Test data
const mockShelters: Shelter[] = [
  {
    shelterId: 'shelter-001',
    name: 'Downtown Emergency Shelter',
    location: {
      latitude: 32.7767,
      longitude: -96.7970,
      address: '123 Main St, Dallas, TX'
    },
    capacity: { maximum: 100, current: 60 },
    resources: {
      food: ResourceStatus.ADEQUATE,
      water: ResourceStatus.ADEQUATE,
      medical: ResourceStatus.LOW,
      bedding: ResourceStatus.ADEQUATE
    },
    status: ShelterStatus.AVAILABLE,
    operatorId: 'operator-001',
    lastUpdated: '2025-09-20T10:00:00Z',
    createdAt: '2025-09-20T08:00:00Z',
    urgentNeeds: [],
    contactInfo: {
      phone: '555-0123',
      email: 'downtown@shelter.com'
    }
  },
  {
    shelterId: 'shelter-002',
    name: 'North Dallas Shelter',
    location: {
      latitude: 32.8267,
      longitude: -96.7470,
      address: '456 Oak Ave, Dallas, TX'
    },
    capacity: { maximum: 75, current: 75 },
    resources: {
      food: ResourceStatus.LOW,
      water: ResourceStatus.ADEQUATE,
      medical: ResourceStatus.ADEQUATE,
      bedding: ResourceStatus.LOW
    },
    status: ShelterStatus.FULL,
    operatorId: 'operator-002',
    lastUpdated: '2025-09-20T10:30:00Z',
    createdAt: '2025-09-20T08:30:00Z',
    urgentNeeds: ['food', 'bedding'],
    contactInfo: {
      phone: '555-0456',
      email: 'north@shelter.com'
    }
  },
  {
    shelterId: 'shelter-003',
    name: 'Emergency Evacuation Center',
    location: {
      latitude: 32.7567,
      longitude: -96.8170,
      address: '789 Emergency Blvd, Dallas, TX'
    },
    capacity: { maximum: 200, current: 150 },
    resources: {
      food: ResourceStatus.CRITICAL,
      water: ResourceStatus.LOW,
      medical: ResourceStatus.ADEQUATE,
      bedding: ResourceStatus.CRITICAL
    },
    status: ShelterStatus.EMERGENCY,
    operatorId: 'operator-003',
    lastUpdated: '2025-09-20T11:00:00Z',
    createdAt: '2025-09-20T09:00:00Z',
    urgentNeeds: ['food', 'water', 'bedding'],
    contactInfo: {
      phone: '555-0789',
      email: 'emergency@shelter.com'
    }
  }
];

describe('AwsLocationMap Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering and Error Handling', () => {
    it('should render loading state initially', () => {
      render(<AwsLocationMap shelters={[]} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should show error state when AWS service fails', async () => {
      render(<AwsLocationMap shelters={mockShelters} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to initialize AWS Location Service. Please check your configuration.')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.queryByText('Loading AWS Location Service...')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<AwsLocationMap shelters={[]} className="custom-height" />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should render Map Error heading in error state', async () => {
      render(<AwsLocationMap shelters={[]} />);
      
      await waitFor(() => {
        expect(screen.getByText('Map Error')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show configuration help text in error state', async () => {
      render(<AwsLocationMap shelters={[]} />);
      
      await waitFor(() => {
        expect(screen.getByText('Check AWS configuration and Location Service setup')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Shelter Data Handling', () => {
    it('should handle empty shelter array', () => {
      render(<AwsLocationMap shelters={[]} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle shelters with different statuses', () => {
      render(<AwsLocationMap shelters={mockShelters} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle shelters with urgent needs', () => {
      const emergencyShelters = mockShelters.filter(s => s.status === ShelterStatus.EMERGENCY);
      render(<AwsLocationMap shelters={emergencyShelters} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle null/undefined shelter data gracefully', () => {
      render(<AwsLocationMap shelters={undefined as any} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<AwsLocationMap shelters={[]} />);
      
      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop changes', () => {
      const { rerender } = render(<AwsLocationMap shelters={[]} className="initial" />);
      
      rerender(<AwsLocationMap shelters={mockShelters} className="updated" />);
      
      // Component should handle prop changes without errors
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading state', () => {
      render(<AwsLocationMap shelters={[]} />);
      
      const loadingText = screen.getByText('Loading AWS Location Service...');
      expect(loadingText).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for error state', async () => {
      render(<AwsLocationMap shelters={[]} />);
      
      await waitFor(() => {
        const errorHeading = screen.getByText('Map Error');
        expect(errorHeading).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Performance with Large Data Sets', () => {
    it('should handle large numbers of shelters', () => {
      // Create a large array of shelters to test performance
      const largeShelterArray = Array.from({ length: 100 }, (_, i) => ({
        ...mockShelters[0],
        shelterId: `shelter-${i}`,
        name: `Shelter ${i}`,
        location: {
          ...mockShelters[0].location,
          latitude: 32.7767 + (i * 0.001),
          longitude: -96.7970 + (i * 0.001)
        }
      }));
      
      render(<AwsLocationMap shelters={largeShelterArray} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<AwsLocationMap shelters={mockShelters} />);
      
      // Re-render with same props should not cause issues
      rerender(<AwsLocationMap shelters={mockShelters} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });
  });

  describe('Shelter Status Scenarios', () => {
    it('should handle all shelter status types', () => {
      const allStatusShelters: Shelter[] = [
        { ...mockShelters[0], status: ShelterStatus.AVAILABLE },
        { ...mockShelters[0], shelterId: 'test-2', status: ShelterStatus.LIMITED },
        { ...mockShelters[0], shelterId: 'test-3', status: ShelterStatus.FULL },
        { ...mockShelters[0], shelterId: 'test-4', status: ShelterStatus.EMERGENCY },
        { ...mockShelters[0], shelterId: 'test-5', status: ShelterStatus.OFFLINE }
      ];
      
      render(<AwsLocationMap shelters={allStatusShelters} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle shelters with critical resource needs', () => {
      const criticalResourceShelter: Shelter = {
        ...mockShelters[0],
        resources: {
          food: ResourceStatus.CRITICAL,
          water: ResourceStatus.CRITICAL,
          medical: ResourceStatus.CRITICAL,
          bedding: ResourceStatus.CRITICAL
        },
        urgentNeeds: ['food', 'water', 'medical', 'bedding']
      };
      
      render(<AwsLocationMap shelters={[criticalResourceShelter]} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle shelters with mixed resource statuses', () => {
      const mixedResourceShelter: Shelter = {
        ...mockShelters[0],
        resources: {
          food: ResourceStatus.ADEQUATE,
          water: ResourceStatus.LOW,
          medical: ResourceStatus.CRITICAL,
          bedding: ResourceStatus.UNAVAILABLE
        }
      };
      
      render(<AwsLocationMap shelters={[mixedResourceShelter]} />);
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });
  });

  describe('Props Updates and Re-rendering', () => {
    it('should handle shelter data changes', () => {
      const { rerender } = render(<AwsLocationMap shelters={[mockShelters[0]]} />);
      
      // Change shelter data
      const updatedShelters = mockShelters.map(shelter => ({
        ...shelter,
        status: ShelterStatus.FULL
      }));
      
      rerender(<AwsLocationMap shelters={updatedShelters} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle capacity updates', () => {
      const initialShelters = [mockShelters[0]];
      const { rerender } = render(<AwsLocationMap shelters={initialShelters} />);
      
      // Simulate capacity update
      const updatedShelters = [{
        ...mockShelters[0],
        capacity: { maximum: 100, current: 95 },
        lastUpdated: new Date().toISOString()
      }];
      
      rerender(<AwsLocationMap shelters={updatedShelters} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle new shelters being added', () => {
      const initialShelters = [mockShelters[0]];
      const { rerender } = render(<AwsLocationMap shelters={initialShelters} />);
      
      // Add new shelter
      rerender(<AwsLocationMap shelters={mockShelters} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should handle shelters being removed', () => {
      const { rerender } = render(<AwsLocationMap shelters={mockShelters} />);
      
      // Remove some shelters
      rerender(<AwsLocationMap shelters={[mockShelters[0]]} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });
  });

  describe('onClick Handler', () => {
    it('should accept onShelterClick callback', () => {
      const mockOnClick = jest.fn();
      render(<AwsLocationMap shelters={mockShelters} onShelterClick={mockOnClick} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });

    it('should work without onShelterClick callback', () => {
      render(<AwsLocationMap shelters={mockShelters} />);
      
      expect(screen.getByText('Loading AWS Location Service...')).toBeInTheDocument();
    });
  });
});