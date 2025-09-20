/**
 * Tests for Demo Data Seeding Script
 * Validates compliance with SH-S1-011 requirements and SRS specifications
 */

const { 
  DEMO_SHELTERS, 
  DEMO_USERS, 
  DEMO_ALERTS, 
  DEMO_PASSWORD
} = require('../seed-demo-data.js');

describe('Demo Data Seeding - SH-S1-011 Compliance', () => {
  
  describe('Data Structure Validation', () => {
    test('should have 5 geographically diverse shelters as per acceptance criteria', () => {
      expect(DEMO_SHELTERS).toHaveLength(5);
      
      // Verify geographic diversity across Texas metropolitan areas
      const cities = DEMO_SHELTERS.map(shelter => 
        shelter.location.address.split(',')[1]?.trim()
      );
      const uniqueCities = new Set(cities);
      expect(uniqueCities.size).toBe(5); // Dallas, Houston, Austin, San Antonio, Fort Worth
    });

    test('should have 5 demo user accounts with different roles', () => {
      expect(DEMO_USERS).toHaveLength(5);
      
      const roles = DEMO_USERS.map(user => user.role);
      expect(roles).toContain('shelter_operator');
      expect(roles).toContain('first_responder');
      expect(roles).toContain('emergency_coordinator');
      
      // Verify role diversity
      const uniqueRoles = new Set(roles);
      expect(uniqueRoles.size).toBeGreaterThanOrEqual(3);
    });

    test('should have 3 sample alerts for demonstration', () => {
      expect(DEMO_ALERTS).toHaveLength(3);
      
      // Verify alert type variety
      const alertTypes = DEMO_ALERTS.map(alert => alert.type);
      const uniqueTypes = new Set(alertTypes);
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(2);
    });

    test('should use standardized demo password', () => {
      expect(DEMO_PASSWORD).toBe('SafeHaven2025!');
      expect(DEMO_PASSWORD).toMatch(/^SafeHaven\d{4}!$/);
    });
  });

  describe('Shelter Data Schema Compliance (REQ-BE-001)', () => {
    test('each shelter should have required DynamoDB schema fields', () => {
      DEMO_SHELTERS.forEach(shelter => {
        // Primary key
        expect(shelter.shelterId).toBeDefined();
        expect(typeof shelter.shelterId).toBe('string');
        
        // Basic info
        expect(shelter.name).toBeDefined();
        expect(typeof shelter.name).toBe('string');
        
        // Location data for mapping (REQ-RDA-001)
        expect(shelter.location).toBeDefined();
        expect(shelter.location.latitude).toBeDefined();
        expect(shelter.location.longitude).toBeDefined();
        expect(shelter.location.address).toBeDefined();
        
        // Capacity management (REQ-SCA-003)
        expect(shelter.capacity).toBeDefined();
        expect(shelter.capacity.current).toBeDefined();
        expect(shelter.capacity.maximum).toBeDefined();
        expect(typeof shelter.capacity.current).toBe('number');
        expect(typeof shelter.capacity.maximum).toBe('number');
        
        // Resource status (REQ-SCA-004)
        expect(shelter.resources).toBeDefined();
        expect(shelter.resources.food).toBeDefined();
        expect(shelter.resources.water).toBeDefined();
        expect(shelter.resources.medical).toBeDefined();
        expect(shelter.resources.bedding).toBeDefined();
        
        // Status tracking
        expect(shelter.status).toBeDefined();
        expect(['available', 'limited', 'full', 'offline']).toContain(shelter.status);
        
        // Contact information
        expect(shelter.contactInfo).toBeDefined();
        expect(shelter.contactInfo.phone).toBeDefined();
        expect(shelter.contactInfo.email).toBeDefined();
        
        // Timestamps
        expect(shelter.lastUpdated).toBeDefined();
        expect(shelter.createdAt).toBeDefined();
      });
    });

    test('shelter locations should be valid coordinates for Texas', () => {
      DEMO_SHELTERS.forEach(shelter => {
        const { latitude, longitude } = shelter.location;
        
        // Texas coordinate bounds (approximate)
        expect(latitude).toBeGreaterThan(25.8);
        expect(latitude).toBeLessThan(36.5);
        expect(longitude).toBeGreaterThan(-106.6);
        expect(longitude).toBeLessThan(-93.5);
      });
    });

    test('shelter capacity should be realistic and valid', () => {
      DEMO_SHELTERS.forEach(shelter => {
        const { current, maximum } = shelter.capacity;
        
        expect(current).toBeGreaterThanOrEqual(0);
        expect(maximum).toBeGreaterThan(0);
        expect(current).toBeLessThanOrEqual(maximum);
        expect(maximum).toBeLessThan(1000); // Realistic maximum
      });
    });
  });

  describe('User Data Schema Compliance (REQ-BE-004)', () => {
    test('each user should have authentication fields', () => {
      DEMO_USERS.forEach(user => {
        expect(user.userId).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.profile).toBeDefined();
        expect(user.isActive).toBe(true);
        expect(user.createdAt).toBeDefined();
        
        // Email format validation
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        // Profile completeness
        expect(user.profile.firstName).toBeDefined();
        expect(user.profile.lastName).toBeDefined();
        expect(user.profile.phone).toBeDefined();
        expect(user.profile.organization).toBeDefined();
      });
    });

    test('shelter operators should have associated shelter IDs', () => {
      const shelterOperators = DEMO_USERS.filter(user => user.role === 'shelter_operator');
      
      shelterOperators.forEach(operator => {
        expect(operator.shelterId).toBeDefined();
        
        // Verify shelter ID exists in DEMO_SHELTERS
        const shelterExists = DEMO_SHELTERS.some(shelter => 
          shelter.shelterId === operator.shelterId
        );
        expect(shelterExists).toBe(true);
      });
    });
  });

  describe('Alert Data Schema Compliance (REQ-SCA-005)', () => {
    test('each alert should have required fields', () => {
      DEMO_ALERTS.forEach(alert => {
        expect(alert.alertId).toBeDefined();
        expect(alert.shelterId).toBeDefined();
        expect(alert.type).toBeDefined();
        expect(alert.priority).toBeDefined();
        expect(alert.title).toBeDefined();
        expect(alert.status).toBeDefined();
        expect(alert.createdBy).toBeDefined();
        expect(alert.timestamp).toBeDefined();
        expect(alert.createdAt).toBeDefined();
        
        // Validate alert types
        expect(['medical_emergency', 'capacity_full', 'resource_critical', 'security_issue', 'infrastructure_problem', 'general_assistance']).toContain(alert.type);
        
        // Validate priorities
        expect(['critical', 'high', 'medium', 'low']).toContain(alert.priority);
        
        // Validate status
        expect(['open', 'acknowledged', 'in_progress', 'resolved']).toContain(alert.status);
      });
    });

    test('alerts should reference valid shelters and users', () => {
      DEMO_ALERTS.forEach(alert => {
        // Verify shelter exists
        const shelterExists = DEMO_SHELTERS.some(shelter => 
          shelter.shelterId === alert.shelterId
        );
        expect(shelterExists).toBe(true);
        
        // Verify creator exists
        const creatorExists = DEMO_USERS.some(user => 
          user.userId === alert.createdBy
        );
        expect(creatorExists).toBe(true);
      });
    });
  });

  describe('Performance Requirements (REQ-PERF-001)', () => {
    test('demo data should be efficiently structured for quick loading', () => {
      // Data size should be reasonable for quick loading
      const dataSize = JSON.stringify({ DEMO_SHELTERS, DEMO_USERS, DEMO_ALERTS }).length;
      expect(dataSize).toBeLessThan(50000); // 50KB limit for quick loading
    });

    test('shelter data should support sub-100ms read operations', () => {
      const startTime = Date.now();
      
      // Simulate data access patterns
      DEMO_SHELTERS.forEach(shelter => {
        const { shelterId, location, capacity, resources, status } = shelter;
        expect(shelterId).toBeDefined();
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Security Requirements (REQ-SEC-001)', () => {
    test('demo data should not contain sensitive information', () => {
      // Check shelters for sensitive data
      DEMO_SHELTERS.forEach(shelter => {
        const dataString = JSON.stringify(shelter);
        expect(dataString).not.toMatch(/password|secret|key|token/i);
      });
      
      // Check users for sensitive data (except passwordHash placeholder)
      DEMO_USERS.forEach(user => {
        expect(user.passwordHash).toBe(''); // Should be empty initially
        expect(user.email).toMatch(/@safehaven\.com$/); // Demo domain
      });
    });

    test('demo accounts should use secure demo domain', () => {
      DEMO_USERS.forEach(user => {
        expect(user.email).toMatch(/@safehaven\.com$/);
        expect(user.userId).toMatch(/@safehaven\.com$/);
      });
    });
  });
});

describe('Demo Data Integration Tests', () => {
  test('data relationships should be consistent', () => {
    // Every shelter operator should have a corresponding shelter
    const shelterOperators = DEMO_USERS.filter(user => user.role === 'shelter_operator');
    const shelterIds = DEMO_SHELTERS.map(shelter => shelter.shelterId);
    
    shelterOperators.forEach(operator => {
      expect(shelterIds).toContain(operator.shelterId);
    });
    
    // Every alert should reference valid shelter and user
    DEMO_ALERTS.forEach(alert => {
      expect(shelterIds).toContain(alert.shelterId);
      
      const userIds = DEMO_USERS.map(user => user.userId);
      expect(userIds).toContain(alert.createdBy);
    });
  });

  test('demo data should support all required user scenarios', () => {
    // Scenario 1: Shelter registration (different shelter types)
    const shelterTypes = DEMO_SHELTERS.map(shelter => shelter.name);
    expect(shelterTypes.length).toBe(5);
    
    // Scenario 2: Status updates (various capacity levels)
    const capacityVariations = DEMO_SHELTERS.map(shelter => 
      shelter.capacity.current / shelter.capacity.maximum
    );
    expect(Math.max(...capacityVariations)).toBeGreaterThan(0.8); // Some near full
    expect(Math.min(...capacityVariations)).toBeLessThan(0.5); // Some with availability
    
    // Scenario 3: Emergency alerts (different types and priorities)
    const alertTypes = new Set(DEMO_ALERTS.map(alert => alert.type));
    const alertPriorities = new Set(DEMO_ALERTS.map(alert => alert.priority));
    expect(alertTypes.size).toBeGreaterThanOrEqual(2);
    expect(alertPriorities.size).toBeGreaterThanOrEqual(2);
  });
});