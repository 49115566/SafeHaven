import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LocationClient, GetMapStyleDescriptorCommand } from '@aws-sdk/client-location';

// Configure MapLibre
MapLibreGL.setAccessToken(null);

// AWS credentials should be configured via AWS CLI or IAM roles
const locationClient = new LocationClient({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
});

interface MobileShelterMapProps {
  shelters?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: 'operational' | 'limited' | 'down';
    capacity?: number;
    currentOccupancy?: number;
  }>;
  style?: any;
}

export default function MobileShelterMap({ shelters = [], style }: MobileShelterMapProps) {
  const [mapStyle, setMapStyle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMapStyle = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const mapName = process.env.REACT_APP_AWS_LOCATION_MAP_NAME || 'safehaven-backend-map-dev';
        
        const styleCommand = new GetMapStyleDescriptorCommand({
          MapName: mapName,
        });

        const response = await locationClient.send(styleCommand);
        if (response.Blob) {
          const blobString = response.Blob as unknown as string;
          const styleJson = JSON.parse(atob(blobString));
          setMapStyle(styleJson);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading AWS Location Service style:', err);
        setError('Failed to load map. Check AWS configuration.');
        setIsLoading(false);
      }
    };

    loadMapStyle();
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'operational':
        return '#10B981'; // green-500
      case 'limited':
        return '#F59E0B'; // yellow-500
      case 'down':
        return '#EF4444'; // red-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.loadingText}>Loading AWS Location Service...</Text>
      </View>
    );
  }

  if (error || !mapStyle) {
    return (
      <View style={[styles.container, styles.centerContent, styles.errorContainer, style]}>
        <Text style={styles.errorTitle}>Map Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Check AWS configuration and Location Service setup</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapLibreGL.MapView
        style={styles.map}
        logoEnabled={false}
        attributionEnabled={true}
      >
        <MapLibreGL.Camera
          centerCoordinate={[-98.5795, 39.8283]} // Center of US
          zoomLevel={4}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {shelters.map((shelter) => (
          <MapLibreGL.PointAnnotation
            key={shelter.id}
            id={shelter.id}
            coordinate={[shelter.longitude, shelter.latitude]}
            onSelected={() => {
              Alert.alert(
                shelter.name,
                `Status: ${shelter.status}\n${
                  shelter.capacity ? `Capacity: ${shelter.currentOccupancy || 0}/${shelter.capacity}` : ''
                }`,
                [{ text: 'OK' }]
              );
            }}
          >
            <View style={[
              styles.marker,
              { backgroundColor: getMarkerColor(shelter.status) }
            ]}>
              <Text style={styles.markerText}>
                {shelter.capacity || '?'}
              </Text>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>
      
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>
          © AWS Location Service | © Esri
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  attributionText: {
    fontSize: 10,
    color: '#6b7280',
  },
});