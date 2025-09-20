import { LocationService } from '../../services/locationService';

// Mock the entire AWS Location SDK to avoid dependency issues
jest.mock('@aws-sdk/client-location', () => ({
  LocationClient: jest.fn(() => ({
    send: jest.fn()
  })),
  SearchPlaceIndexForTextCommand: jest.fn(),
  GetMapStyleDescriptorCommand: jest.fn()
}));

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    process.env.AWS_LOCATION_MAP_NAME = 'test-map';
    process.env.AWS_LOCATION_PLACE_INDEX = 'test-index';
    locationService = new LocationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization and Basic Functionality', () => {
    it('should create LocationService instance', () => {
      expect(locationService).toBeInstanceOf(LocationService);
    });

    it('should have required methods', () => {
      expect(typeof locationService.searchPlaces).toBe('function');
      expect(typeof locationService.geocodeAddress).toBe('function');
      expect(typeof locationService.findNearbyShelters).toBe('function');
      expect(typeof locationService.calculateRoute).toBe('function');
    });
  });

  describe('Distance Calculation - Basic Tests', () => {
    it('should calculate zero distance for same coordinates', async () => {
      const result = await locationService.calculateRoute(40.7, -74.0, 40.7, -74.0);
      expect(result.distance).toBe(0);
    });

    it('should calculate positive distance for different coordinates', async () => {
      const result = await locationService.calculateRoute(40.7, -74.0, 40.8, -74.1);
      expect(result.distance).toBeGreaterThan(0);
    });
  });

  describe('calculateDistance (Haversine Formula) - Comprehensive Tests', () => {
    it('should calculate distance between two coordinates correctly', () => {
      // Use reflection to access private method for testing
      const distance = (locationService as any).calculateDistance(
        40.7128, -74.0060, // New York City
        34.0522, -118.2437  // Los Angeles
      );
      
      // Expected distance is approximately 3936 km (verified calculation)
      expect(distance).toBeCloseTo(3936, 0);
    });

    it('should return 0 for identical coordinates', () => {
      const distance = (locationService as any).calculateDistance(
        40.7128, -74.0060,
        40.7128, -74.0060
      );
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates correctly', () => {
      const distance = (locationService as any).calculateDistance(
        -34.6037, 58.3816, // Buenos Aires
        51.5074, -0.1278   // London
      );
      
      // Expected distance is approximately 11140 km (verified calculation)
      expect(distance).toBeCloseTo(11140, 0);
    });

    it('should calculate short distances accurately', () => {
      const distance = (locationService as any).calculateDistance(
        40.7128, -74.0060, // NYC
        40.7589, -73.9851  // Central Park (about 5.4km actual)
      );
      
      expect(distance).toBeCloseTo(5.4, 1);
    });

    it('should handle coordinates across the antimeridian', () => {
      const distance = (locationService as any).calculateDistance(
        35.6762, 139.6503, // Tokyo
        21.3099, -157.8581 // Honolulu
      );
      
      // Expected distance is approximately 6209 km (verified calculation)
      expect(distance).toBeCloseTo(6209, 0);
    });
  });

  describe('toRad (Degree to Radian Conversion)', () => {
    it('should convert degrees to radians correctly', () => {
      const radians = (locationService as any).toRad(180);
      expect(radians).toBeCloseTo(Math.PI, 5);
    });

    it('should convert 0 degrees to 0 radians', () => {
      const radians = (locationService as any).toRad(0);
      expect(radians).toBe(0);
    });

    it('should convert 90 degrees to π/2 radians', () => {
      const radians = (locationService as any).toRad(90);
      expect(radians).toBeCloseTo(Math.PI / 2, 5);
    });

    it('should convert 360 degrees to 2π radians', () => {
      const radians = (locationService as any).toRad(360);
      expect(radians).toBeCloseTo(2 * Math.PI, 5);
    });

    it('should handle negative degrees', () => {
      const radians = (locationService as any).toRad(-90);
      expect(radians).toBeCloseTo(-Math.PI / 2, 5);
    });
  });

  describe('calculateRoute (Basic Routing)', () => {
    it('should calculate basic route with distance and time estimates', async () => {
      const route = await locationService.calculateRoute(
        40.7128, -74.0060, // Start: NYC
        40.7589, -73.9851  // End: Central Park
      );

      expect(route).toHaveProperty('distance');
      expect(route).toHaveProperty('estimatedTravelTime');
      expect(route).toHaveProperty('route');
      expect(route.route).toHaveLength(2);
      expect(route.route[0]).toEqual({ latitude: 40.7128, longitude: -74.0060 });
      expect(route.route[1]).toEqual({ latitude: 40.7589, longitude: -73.9851 });
      expect(typeof route.distance).toBe('number');
      expect(typeof route.estimatedTravelTime).toBe('number');
      expect(route.distance).toBeGreaterThan(0);
      expect(route.estimatedTravelTime).toBeGreaterThan(0);
    });

    it('should estimate travel time based on distance (40 km/h average)', async () => {
      const route = await locationService.calculateRoute(
        40.7128, -74.0060, // Start
        40.8128, -74.0060  // End (about 11km north)
      );

      // Should estimate time at roughly 40 km/h average: time = distance / 40 * 60 minutes
      const expectedTime = Math.ceil(route.distance / 40 * 60);
      expect(route.estimatedTravelTime).toBe(expectedTime);
    });

    it('should handle long distance routes', async () => {
      const route = await locationService.calculateRoute(
        40.7128, -74.0060, // NYC
        34.0522, -118.2437 // LA
      );

      expect(route.distance).toBeCloseTo(3936, 0);
      expect(route.estimatedTravelTime).toBeCloseTo(5904, 0); // ~98 hours
    });

    it('should return route points in correct order', async () => {
      const startLat = 40.7128, startLng = -74.0060;
      const endLat = 40.7589, endLng = -73.9851;
      
      const route = await locationService.calculateRoute(startLat, startLng, endLat, endLng);

      expect(route.route[0]).toEqual({ latitude: startLat, longitude: startLng });
      expect(route.route[1]).toEqual({ latitude: endLat, longitude: endLng });
    });
  });

  describe('findNearbyShelters (Placeholder Implementation)', () => {
    it('should return search parameters and empty shelter list', async () => {
      const result = await locationService.findNearbyShelters(40.7128, -74.0060, 25);

      expect(result).toEqual({
        center: { latitude: 40.7128, longitude: -74.0060 },
        radiusKm: 25,
        shelters: []
      });
    });

    it('should use default radius of 50km when not specified', async () => {
      const result = await locationService.findNearbyShelters(40.7128, -74.0060);

      expect(result.radiusKm).toBe(50);
      expect(result.center).toEqual({ latitude: 40.7128, longitude: -74.0060 });
      expect(result.shelters).toEqual([]);
    });

    it('should accept various coordinate ranges', async () => {
      // Test with different coordinate ranges
      const testCases = [
        { lat: 0, lng: 0 },
        { lat: 90, lng: 180 },
        { lat: -90, lng: -180 },
        { lat: 45.5, lng: -122.6 }
      ];

      for (const { lat, lng } of testCases) {
        const result = await locationService.findNearbyShelters(lat, lng, 10);
        expect(result.center).toEqual({ latitude: lat, longitude: lng });
        expect(result.radiusKm).toBe(10);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme coordinate values', () => {
      // Test maximum coordinate values
      const distance1 = (locationService as any).calculateDistance(90, 180, -90, -180);
      expect(distance1).toBeGreaterThan(0);
      expect(distance1).toBeLessThan(25000); // Should be less than Earth's circumference
      
      // Test coordinates at poles
      const distance2 = (locationService as any).calculateDistance(90, 0, 90, 180);
      expect(distance2).toBeCloseTo(0, 10); // Both points at North Pole (floating point precision)
    });

    it('should handle floating point precision correctly', () => {
      const distance = (locationService as any).calculateDistance(
        40.712800001, -74.006000001,
        40.712800002, -74.006000002
      );
      
      expect(distance).toBeCloseTo(0, 6);
    });
  });
});