import { LocationClient, SearchPlaceIndexForTextCommand, GetMapGlyphsCommand, GetMapStyleDescriptorCommand } from '@aws-sdk/client-location';

const client = new LocationClient({ region: process.env.AWS_REGION || 'us-east-1' });

export class LocationService {
  private mapName = process.env.AWS_LOCATION_MAP_NAME || '';
  private placeIndex = process.env.AWS_LOCATION_PLACE_INDEX || '';

  /**
   * Search for places using AWS Location Service
   */
  async searchPlaces(query: string, maxResults: number = 10) {
    try {
      const command = new SearchPlaceIndexForTextCommand({
        IndexName: this.placeIndex,
        Text: query,
        MaxResults: maxResults,
        FilterCountries: ['USA'], // Restrict to US for emergency services
      });

      const response = await client.send(command);
      
      return response.Results?.map(result => ({
        label: result.Place?.Label || '',
        geometry: {
          latitude: result.Place?.Geometry?.Point?.[1] || 0,
          longitude: result.Place?.Geometry?.Point?.[0] || 0,
        },
        address: {
          street: result.Place?.Street || '',
          municipality: result.Place?.Municipality || '',
          subRegion: result.Place?.SubRegion || '',
          region: result.Place?.Region || '',
          country: result.Place?.Country || '',
          postalCode: result.Place?.PostalCode || '',
        },
        relevance: result.Relevance || 0,
      })) || [];

    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  /**
   * Get map style descriptor for use with MapLibre GL JS
   */
  async getMapStyle() {
    try {
      const command = new GetMapStyleDescriptorCommand({
        MapName: this.mapName,
      });

      const response = await client.send(command);
      return response.Blob;

    } catch (error) {
      console.error('Error getting map style:', error);
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string) {
    try {
      const results = await this.searchPlaces(address, 1);
      
      if (results.length === 0) {
        throw new Error('Address not found');
      }

      return results[0].geometry;

    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Find nearby shelters based on coordinates
   * This would integrate with your shelter database
   */
  async findNearbyShelters(latitude: number, longitude: number, radiusKm: number = 50) {
    // Implementation would query your DynamoDB shelter table
    // using geo-spatial queries or distance calculations
    
    // Placeholder for now - integrate with ShelterService
    return {
      center: { latitude, longitude },
      radiusKm,
      shelters: [], // Would be populated from database query
    };
  }

  /**
   * Calculate route between two points
   * Note: This would require AWS Location Service Route Calculator
   * which is not included in the basic setup
   */
  async calculateRoute(startLat: number, startLng: number, endLat: number, endLng: number) {
    // For now, return basic distance calculation
    const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
    
    return {
      distance: distance,
      estimatedTravelTime: Math.ceil(distance / 40 * 60), // Rough estimate: 40 km/h average
      route: [
        { latitude: startLat, longitude: startLng },
        { latitude: endLat, longitude: endLng },
      ],
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();