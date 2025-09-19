import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { LocationClient, GetMapStyleDescriptorCommand } from '@aws-sdk/client-location';
import 'maplibre-gl/dist/maplibre-gl.css';

// AWS credentials should be configured via AWS CLI or IAM roles
const locationClient = new LocationClient({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
});

interface MapProps {
  shelters?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: 'operational' | 'limited' | 'down';
    capacity?: number;
    currentOccupancy?: number;
  }>;
  className?: string;
}

export default function AwsLocationMap({ shelters = [], className = "h-96" }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
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
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    shelters.forEach((shelter) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'shelter-marker';
      markerElement.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${
          shelter.status === 'operational' ? 'bg-green-500' :
          shelter.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
        }">
          ${shelter.capacity || '?'}
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold text-sm">${shelter.name}</h3>
          <p class="text-xs text-gray-600">Status: <span class="capitalize ${
            shelter.status === 'operational' ? 'text-green-600' :
            shelter.status === 'limited' ? 'text-yellow-600' : 'text-red-600'
          }">${shelter.status}</span></p>
          ${shelter.capacity ? `<p class="text-xs text-gray-600">Capacity: ${shelter.currentOccupancy || 0}/${shelter.capacity}</p>` : ''}
        </div>
      `);

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([shelter.longitude, shelter.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [shelters, isLoading, error]);

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
    </div>
  );
}