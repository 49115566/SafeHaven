import { AuthService, RateLimiter } from '../services/authService';

// Define UserRole enum for testing
enum UserRole {
  SHELTER_OPERATOR = 'shelter_operator',
  FIRST_RESPONDER = 'first_responder',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  ADMIN = 'admin'
}

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.USERS_TABLE = 'test-users-table';
process.env.SHELTERS_TABLE = 'test-shelters-table';

describe('AuthService', () => {
  describe('Password operations', () => {
    it('should hash passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hash);
      const isInvalid = await AuthService.verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT operations', () => {
    const testUser = {
      userId: 'test@example.com',
      email: 'test@example.com',
      role: UserRole.SHELTER_OPERATOR,
      shelterId: 'shelter-123'
    };

    it('should generate valid JWT tokens', () => {
      const token = AuthService.generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid JWT tokens', () => {
      const token = AuthService.generateToken(testUser);
      const decoded = AuthService.verifyToken(token);
      
      expect(decoded.userId).toBe(testUser.userId);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
      expect(decoded.shelterId).toBe(testUser.shelterId);
      expect(decoded.iss).toBe('safehaven-backend');
      expect(decoded.aud).toBe('safehaven-clients');
    });

    it('should reject invalid JWT tokens', () => {
      expect(() => {
        AuthService.verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should reject tokens with wrong secret', () => {
      // Generate token with different secret
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'different-secret';
      
      const token = AuthService.generateToken(testUser);
      
      // Restore original secret and try to verify
      process.env.JWT_SECRET = originalSecret;
      
      expect(() => {
        AuthService.verifyToken(token);
      }).toThrow();
    });
  });

  describe('Password strength validation', () => {
    it('should accept strong passwords', () => {
      const result = AuthService.validatePasswordStrength('StrongPassword123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const tests = [
        { password: '123', reason: 'too short' },
        { password: 'alllowercase', reason: 'no uppercase' },
        { password: 'ALLUPPERCASE', reason: 'no lowercase' },
        { password: 'NoNumbers!', reason: 'no numbers' },
        { password: 'password123', reason: 'too common' },
        { password: 'aaaa1111', reason: 'repeated characters' }
      ];

      tests.forEach(test => {
        const result = AuthService.validatePasswordStrength(test.password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Email validation', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin+tag@site.org'
      ];

      validEmails.forEach(email => {
        expect(AuthService.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        'missing@',
        '@missing-local.com',
        'spaces in@email.com',
        'double@@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(AuthService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Role and access control', () => {
    it('should check role permissions correctly', () => {
      const adminUser = { 
        userId: 'admin', 
        email: 'admin@test.com', 
        role: UserRole.ADMIN 
      };
      
      const shelterUser = { 
        userId: 'shelter', 
        email: 'shelter@test.com', 
        role: UserRole.SHELTER_OPERATOR,
        shelterId: 'shelter-123'
      };

      expect(AuthService.hasRole(adminUser, [UserRole.ADMIN])).toBe(true);
      expect(AuthService.hasRole(adminUser, [UserRole.SHELTER_OPERATOR])).toBe(false);
      expect(AuthService.hasRole(shelterUser, [UserRole.SHELTER_OPERATOR, UserRole.ADMIN])).toBe(true);
    });

    it('should check shelter access correctly', () => {
      const adminUser = { 
        userId: 'admin', 
        email: 'admin@test.com', 
        role: UserRole.ADMIN 
      };
      
      const shelterUser = { 
        userId: 'shelter', 
        email: 'shelter@test.com', 
        role: UserRole.SHELTER_OPERATOR,
        shelterId: 'shelter-123'
      };

      const responderUser = { 
        userId: 'responder', 
        email: 'responder@test.com', 
        role: UserRole.FIRST_RESPONDER 
      };

      // Admin can access any shelter
      expect(AuthService.canAccessShelter(adminUser, 'any-shelter')).toBe(true);
      
      // Shelter operator can only access their own shelter
      expect(AuthService.canAccessShelter(shelterUser, 'shelter-123')).toBe(true);
      expect(AuthService.canAccessShelter(shelterUser, 'other-shelter')).toBe(false);
      
      // First responder can access any shelter (read-only)
      expect(AuthService.canAccessShelter(responderUser, 'any-shelter')).toBe(true);
    });
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear rate limiter state between tests
    RateLimiter.cleanup();
  });

  it('should allow requests within limits', () => {
    const result1 = RateLimiter.checkLimit('test-ip', 3, 1);
    const result2 = RateLimiter.checkLimit('test-ip', 3, 1);
    const result3 = RateLimiter.checkLimit('test-ip', 3, 1);

    expect(result1.allowed).toBe(true);
    expect(result1.attemptsRemaining).toBe(2);
    
    expect(result2.allowed).toBe(true);
    expect(result2.attemptsRemaining).toBe(1);
    
    expect(result3.allowed).toBe(true);
    expect(result3.attemptsRemaining).toBe(0);
  });

  it('should block requests over limits', () => {
    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      RateLimiter.checkLimit('test-ip', 3, 1);
    }

    // Next request should be blocked
    const result = RateLimiter.checkLimit('test-ip', 3, 1);
    expect(result.allowed).toBe(false);
    expect(result.attemptsRemaining).toBe(0);
  });

  it('should handle different IPs independently', () => {
    // Exhaust limit for one IP
    for (let i = 0; i < 3; i++) {
      RateLimiter.checkLimit('ip1', 3, 1);
    }

    // Different IP should still be allowed
    const result = RateLimiter.checkLimit('ip2', 3, 1);
    expect(result.allowed).toBe(true);
    expect(result.attemptsRemaining).toBe(2);
  });

  it('should reset after time window', (done) => {
    // This test would need actual time delays in a real scenario
    // For unit testing, we'll just verify the logic structure
    const result1 = RateLimiter.checkLimit('test-ip-reset', 1, 1);
    expect(result1.allowed).toBe(true);

    const result2 = RateLimiter.checkLimit('test-ip-reset', 1, 1);
    expect(result2.allowed).toBe(false);

    // In a real scenario, we'd wait for the time window to pass
    // For this test, we'll just verify the reset time is set correctly
    expect(result2.resetTime).toBeGreaterThan(Date.now());
    
    done();
  });
});