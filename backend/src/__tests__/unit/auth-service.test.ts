import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/authService';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set JWT_SECRET for testing
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  });

  describe('validatePasswordStrength', () => {
    it('should return valid for strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'StrongP@ss1',
        'Complex#Pass9',
        'MySecure$Pass7'
      ];

      strongPasswords.forEach(password => {
        const result = AuthService.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should return invalid for passwords missing uppercase letter', () => {
      const password = 'password123!';
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should return invalid for passwords missing lowercase letter', () => {
      const password = 'PASSWORD123!';
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should return invalid for passwords missing number', () => {
      const password = 'Password!';
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return invalid for passwords too short', () => {
      const password = 'Pass1!';
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should return multiple errors for very weak passwords', () => {
      const password = 'weak';
      const result = AuthService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('hashPassword', () => {
    it('should hash password with salt', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate consistent hash length', async () => {
      const passwords = [
        'Short1!',
        'MediumLengthPassword123!',
        'VeryLongPasswordWithManyCharactersToTestConsistency123!'
      ];

      const hashes = await Promise.all(
        passwords.map(pwd => AuthService.hashPassword(pwd))
      );

      // All bcrypt hashes should be 60 characters
      hashes.forEach((hash: string) => {
        expect(hash.length).toBe(60);
      });
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456@';
      const hashedPassword = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashedPassword = await AuthService.hashPassword('TestPassword123!');

      const isValid = await AuthService.verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle malformed hash gracefully', async () => {
      const password = 'TestPassword123!';
      const malformedHash = 'not-a-valid-hash';

      // bcrypt gracefully returns false for malformed hashes instead of throwing
      const isValid = await AuthService.verifyPassword(password, malformedHash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with user data', () => {
      const userData = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: 'shelter_operator' as any,
        shelterId: 'shelter-123'
      };

      const token = AuthService.generateToken(userData);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const user1 = {
        userId: 'user-1',
        email: 'user1@example.com',
        role: 'shelter_operator' as any
      };

      const user2 = {
        userId: 'user-2',
        email: 'user2@example.com',
        role: 'first_responder' as any
      };

      const token1 = AuthService.generateToken(user1);
      const token2 = AuthService.generateToken(user2);

      expect(token1).not.toBe(token2);
    });

    it('should include expiration time in token', () => {
      const userData = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: 'shelter_operator' as any
      };

      const token = AuthService.generateToken(userData);
      
      // Decode the payload (base64)
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(payload.iss).toBe('safehaven-backend');
      expect(payload.aud).toBe('safehaven-clients');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return user data', () => {
      const userData = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: 'shelter_operator' as any,
        shelterId: 'shelter-123'
      };

      const token = AuthService.generateToken(userData);
      const decoded = AuthService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userData.userId);
      expect(decoded.email).toBe(userData.email);
      expect(decoded.role).toBe(userData.role);
      expect(decoded.shelterId).toBe(userData.shelterId);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';

      expect(() => {
        AuthService.verifyToken(malformedToken);
      }).toThrow();
    });

    it('should verify token issuer and audience', () => {
      const userData = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: 'admin' as any
      };

      const token = AuthService.generateToken(userData);
      const decoded = AuthService.verifyToken(token);

      expect(decoded.iss).toBe('safehaven-backend');
      expect(decoded.aud).toBe('safehaven-clients');
    });
  });

  describe('Error Handling', () => {
    it('should handle JWT secret not set', () => {
      delete process.env.JWT_SECRET;

      const userData = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: 'shelter_operator' as any
      };

      expect(() => {
        AuthService.generateToken(userData);
      }).toThrow();
    });

    it('should handle password hashing errors gracefully', async () => {
      // Test with extremely long password that might cause issues
      const veryLongPassword = 'x'.repeat(1000000);
      
      await expect(AuthService.hashPassword(veryLongPassword)).resolves.toBeDefined();
    });

    it('should handle token verification with wrong secret', () => {
      const userData = {
        userId: 'user-123',
        email: 'test@shelter.org',
        role: 'shelter_operator' as any
      };

      const token = AuthService.generateToken(userData);
      
      // Change the secret
      process.env.JWT_SECRET = 'different-secret';

      expect(() => {
        AuthService.verifyToken(token);
      }).toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should hash passwords efficiently', async () => {
      const password = 'TestPassword123!';
      const start = Date.now();
      
      await AuthService.hashPassword(password);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should verify passwords efficiently', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const start = Date.now();
      await AuthService.verifyPassword(password, hashedPassword);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent password operations', async () => {
      const passwords = ['Pass1!', 'Pass2!', 'Pass3!', 'Pass4!', 'Pass5!'];
      
      const hashPromises = passwords.map(pwd => AuthService.hashPassword(pwd));
      const hashes = await Promise.all(hashPromises);
      
      expect(hashes).toHaveLength(5);
      hashes.forEach((hash: string) => {
        expect(hash).toBeDefined();
        expect(hash.length).toBe(60);
      });
    });
  });
});