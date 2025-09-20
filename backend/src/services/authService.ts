import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Define types locally to avoid module resolution issues in tests
export enum UserRole {
  SHELTER_OPERATOR = 'shelter_operator',
  FIRST_RESPONDER = 'first_responder',
  EMERGENCY_COORDINATOR = 'emergency_coordinator',
  ADMIN = 'admin'
}

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    organization?: string;
  };
  shelterId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  shelterId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  shelterId?: string;
}

/**
 * Authentication service providing secure user authentication operations
 */
export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly TOKEN_EXPIRY = '24h';
  private static readonly TOKEN_ISSUER = 'safehaven-backend';
  private static readonly TOKEN_AUDIENCE = 'safehaven-clients';

  /**
   * Hash a password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AuthService.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for an authenticated user
   */
  static generateToken(user: AuthUser): string {
    const payload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      shelterId: user.shelterId
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: AuthService.TOKEN_EXPIRY,
      issuer: AuthService.TOKEN_ISSUER,
      audience: AuthService.TOKEN_AUDIENCE
    });
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: AuthService.TOKEN_ISSUER,
      audience: AuthService.TOKEN_AUDIENCE
    }) as JwtPayload;
  }

  /**
   * Get user from database with password hash
   */
  static async getUserWithPassword(userId: string): Promise<(User & { passwordHash: string }) | null> {
    const command = new GetCommand({
      TableName: process.env.USERS_TABLE!,
      Key: { userId }
    });

    const result = await dynamo.send(command);
    return result.Item ? (result.Item as User & { passwordHash: string }) : null;
  }

  /**
   * Get user by email from database with password hash (for login)
   */
  static async getUserByEmailWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
    const command = new QueryCommand({
      TableName: process.env.USERS_TABLE!,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });

    const result = await dynamo.send(command);
    return result.Items && result.Items.length > 0 ? (result.Items[0] as User & { passwordHash: string }) : null;
  }

  /**
   * Get user from database without sensitive data
   */
  static async getUser(userId: string): Promise<User | null> {
    const userWithPassword = await AuthService.getUserWithPassword(userId);
    if (!userWithPassword) {
      return null;
    }

    // Remove password hash from user object
    const { passwordHash, ...user } = userWithPassword;
    return user;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password should contain at least one special character');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
    }

    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract user info from authorization context
   */
  static extractUserFromContext(context: any): AuthUser | null {
    if (!context || !context.userId || !context.email || !context.role) {
      return null;
    }

    return {
      userId: context.userId,
      email: context.email,
      role: context.role as UserRole,
      shelterId: context.shelterId
    };
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: AuthUser, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(user.role);
  }

  /**
   * Check if user can access shelter-specific resources
   */
  static canAccessShelter(user: AuthUser, shelterId: string): boolean {
    // Admin and emergency coordinators can access any shelter
    if (user.role === UserRole.ADMIN || user.role === UserRole.EMERGENCY_COORDINATOR) {
      return true;
    }

    // Shelter operators can only access their own shelter
    if (user.role === UserRole.SHELTER_OPERATOR) {
      return user.shelterId === shelterId;
    }

    // First responders can access any shelter for viewing
    if (user.role === UserRole.FIRST_RESPONDER) {
      return true;
    }

    return false;
  }
}

/**
 * Simple rate limiting implementation
 * In production, consider using Redis or DynamoDB for distributed rate limiting
 */
export class RateLimiter {
  private static store = new Map<string, { attempts: number; lastAttempt: number; resetTime: number }>();
  
  /**
   * Check if request is within rate limits
   */
  static checkLimit(
    identifier: string,
    maxAttempts: number = 10,
    windowMinutes: number = 5
  ): { allowed: boolean; attemptsRemaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const record = RateLimiter.store.get(identifier);
    
    if (!record) {
      const resetTime = now + windowMs;
      RateLimiter.store.set(identifier, {
        attempts: 1,
        lastAttempt: now,
        resetTime
      });
      
      return {
        allowed: true,
        attemptsRemaining: maxAttempts - 1,
        resetTime
      };
    }
    
    // Reset if window has passed
    if (now >= record.resetTime) {
      const resetTime = now + windowMs;
      RateLimiter.store.set(identifier, {
        attempts: 1,
        lastAttempt: now,
        resetTime
      });
      
      return {
        allowed: true,
        attemptsRemaining: maxAttempts - 1,
        resetTime
      };
    }
    
    // Check if under limit
    if (record.attempts < maxAttempts) {
      record.attempts++;
      record.lastAttempt = now;
      
      return {
        allowed: true,
        attemptsRemaining: maxAttempts - record.attempts,
        resetTime: record.resetTime
      };
    }
    
    return {
      allowed: false,
      attemptsRemaining: 0,
      resetTime: record.resetTime
    };
  }
  
  /**
   * Clean up old entries (call periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    
    for (const [key, record] of RateLimiter.store.entries()) {
      if (now >= record.resetTime) {
        RateLimiter.store.delete(key);
      }
    }
  }
}