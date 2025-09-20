import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { LocationClient, GetMapStyleDescriptorCommand } from '@aws-sdk/client-location';
import { Shelter, ShelterStatus, ResourceStatus } from 'safehaven-shared';
import 'maplibre-gl/dist/maplibre-gl.css';

// AWS credentials should be configured via AWS CLI or IAM roles
const locationClient = new LocationClient({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
});

interface MapProps {
  shelters: Shelter[];
  onShelterClick?: (shelter: Shelter) => void;
  className?: string;
}

// Status color mapping based on shelter status and capacity
function getShelterMarkerColor(shelter: Shelter): string {
  switch (shelter.status) {
    case ShelterStatus.AVAILABLE:
      return 'bg-green-500';
    case ShelterStatus.LIMITED:
      return 'bg-yellow-500';
    case ShelterStatus.FULL:
      return 'bg-orange-500';
    case ShelterStatus.EMERGENCY:
      return 'bg-red-500';
    case ShelterStatus.OFFLINE:
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}

// Get status text for display
function getStatusText(status: ShelterStatus): string {
  switch (status) {
    case ShelterStatus.AVAILABLE:
      return 'Available';
    case ShelterStatus.LIMITED:
      return 'Limited';
    case ShelterStatus.FULL:
      return 'Full';
    case ShelterStatus.EMERGENCY:
      return 'Emergency';
    case ShelterStatus.OFFLINE:
      return 'Offline';
    default:
      return 'Unknown';
  }
}

// Get resource status indicator
function getResourceIndicator(status: ResourceStatus): string {
  switch (status) {
    case ResourceStatus.ADEQUATE:
      return '🟢';
    case ResourceStatus.LOW:
      return '🟡';
    case ResourceStatus.CRITICAL:
      return '🔴';
    case ResourceStatus.UNAVAILABLE:
      return '⚫';
    default:
      return '❓';
  }
}

export default function AwsLocationMap({ shelters = [], onShelterClick, className = "h-96" }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get the map style from AWS Location Service
        const mapName = process.env.REACT_APP_AWS_LOCATION_MAP_NAME || 'safehaven-backend-map-dev';
        
        const styleCommand = new GetMapStyleDescriptorCommand({
          MapName: mapName,
        });

        const response = await locationClient.send(styleCommand);
        
        // Convert Blob to string for MapLibre
        const styleBlob = response.Blob;
        if (!styleBlob) {
          throw new Error('No style data received from AWS Location Service');
        }
        
        // Handle different Blob types
        let styleString: string;
        if (typeof styleBlob === 'string') {
          styleString = styleBlob;
        } else if (styleBlob instanceof Uint8Array) {
          styleString = new TextDecoder().decode(styleBlob);
        } else {
          // For other blob types, convert to string
          styleString = String(styleBlob);
        }
        
        // Parse the style JSON
        const styleJson = JSON.parse(styleString);
        
        // Initialize MapLibre GL JS map
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: styleJson,
          center: [-98.5795, 39.8283], // Center of US
          zoom: 4,
          attributionControl: false,
        });

        // Add navigation controls
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add custom attribution for AWS Location Service
        map.current.addControl(
          new maplibregl.AttributionControl({
            customAttribution: [
              '<a href="https://aws.amazon.com/location/" target="_blank">© AWS Location Service</a>',
              '<a href="https://www.esri.com/" target="_blank">© Esri</a>',
            ],
          })
        );

        map.current.on('load', () => {
          setIsLoading(false);
        });

        map.current.on('error', (e: any) => {
          console.error('Map error:', e);
          setError('Failed to load map. Please check your AWS configuration.');
          setIsLoading(false);
        });

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize AWS Location Service. Please check your configuration.');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when shelters change
  useEffect(() => {
    if (!map.current || isLoading || error) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers for each shelter
    shelters.forEach((shelter) => {
      const markerColor = getShelterMarkerColor(shelter);
      const availableSpaces = shelter.capacity.maximum - shelter.capacity.current;
      
      const markerElement = document.createElement('div');
      markerElement.className = 'shelter-marker cursor-pointer';
      markerElement.innerHTML = `
        <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${markerColor} hover:scale-110 transition-transform">
          ${availableSpaces > 99 ? '99+' : availableSpaces}
        </div>
      `;

      // Create detailed popup content
      const popupContent = `
        <div class="p-3 min-w-64">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-sm text-gray-900">${shelter.name}</h3>
            <span class="px-2 py-1 text-xs rounded-full ${markerColor} text-white">
              ${getStatusText(shelter.status)}
            </span>
          </div>
          
          <div class="space-y-2 text-xs text-gray-600">
            <div class="flex justify-between">
              <span>Capacity:</span>
              <span class="font-semibold">${shelter.capacity.current}/${shelter.capacity.maximum}</span>
            </div>
            
            <div class="flex justify-between">
              <span>Available:</span>
              <span class="font-semibold text-green-600">${availableSpaces} spaces</span>
            </div>
            
            <div class="border-t pt-2">
              <div class="text-xs font-semibold mb-1">Resources:</div>
              <div class="grid grid-cols-2 gap-1 text-xs">
                <div>Food ${getResourceIndicator(shelter.resources.food)}</div>
                <div>Water ${getResourceIndicator(shelter.resources.water)}</div>
                <div>Medical ${getResourceIndicator(shelter.resources.medical)}</div>
                <div>Bedding ${getResourceIndicator(shelter.resources.bedding)}</div>
              </div>
            </div>
            
            ${shelter.urgentNeeds && shelter.urgentNeeds.length > 0 ? `
              <div class="border-t pt-2">
                <div class="text-xs font-semibold text-red-600 mb-1">Urgent Needs:</div>
                <div class="text-xs text-red-600">${shelter.urgentNeeds.join(', ')}</div>
              </div>
            ` : ''}
            
            <div class="border-t pt-2 text-xs text-gray-400">
              Last updated: ${new Date(shelter.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: true
      }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([shelter.location.longitude, shelter.location.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler for shelter selection
      markerElement.addEventListener('click', () => {
        if (onShelterClick) {
          onShelterClick(shelter);
        }
      });

      // Store marker reference for updates
      markersRef.current[shelter.shelterId] = marker;
    });

    // Auto-fit map to show all shelters if there are any
    if (shelters.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      shelters.forEach(shelter => {
        bounds.extend([shelter.location.longitude, shelter.location.latitude]);
      });
      
      // Add padding to the bounds
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12
      });
    }
  }, [shelters, isLoading, error, onShelterClick]);

  if (error) {
    return (
      <div className={`${className} bg-red-50 border border-red-200 rounded flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="text-red-600 font-semibold mb-2">Map Error</div>
          <div className="text-red-500 text-sm">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            Check AWS configuration and Location Service setup
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 ${className} bg-gray-100 border rounded flex items-center justify-center z-10`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600 text-sm">Loading AWS Location Service...</div>
          </div>
        </div>
      )}
      <div ref={mapContainer} className={`${className} rounded border`} />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
        <div className="text-xs font-semibold mb-2">Shelter Status</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Limited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Full</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}