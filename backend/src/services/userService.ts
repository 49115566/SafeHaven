import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { User, PublicUser, UserRole } from '../models/types';
import { AuthService } from './authService';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    organization?: string;
  };
  shelterId?: string; // For shelter operators
}

export interface UpdateUserInput {
  profile?: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    organization: string;
  }>;
  isActive?: boolean;
  shelterId?: string;
  role?: UserRole;
}

export class UserService {
  private tableName = process.env.USERS_TABLE || '';

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<PublicUser> {
    // Validate email format
    if (!AuthService.validateEmail(input.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = AuthService.validatePasswordStrength(input.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(input.password);

    const userId = uuidv4();
    const user: User = {
      userId,
      email: input.email,
      passwordHash,
      role: input.role,
      profile: input.profile,
      shelterId: input.shelterId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Save user to DynamoDB
    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: user
    }));

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<PublicUser | null> {
    const response = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { userId }
    }));

    if (!response.Item) {
      return null;
    }

    // Remove password hash from response
    const { passwordHash, ...user } = response.Item as User;
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<PublicUser | null> {
    const response = await docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    // Remove password hash from response
    const { passwordHash, ...user } = response.Items[0] as User;
    return user;
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updates: UpdateUserInput): Promise<PublicUser | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.profile) {
      if (updates.profile.firstName) {
        updateExpressions.push('profile.firstName = :firstName');
        expressionAttributeValues[':firstName'] = updates.profile.firstName;
      }
      if (updates.profile.lastName) {
        updateExpressions.push('profile.lastName = :lastName');
        expressionAttributeValues[':lastName'] = updates.profile.lastName;
      }
      if (updates.profile.phone !== undefined) {
        updateExpressions.push('profile.phone = :phone');
        expressionAttributeValues[':phone'] = updates.profile.phone;
      }
      if (updates.profile.organization !== undefined) {
        updateExpressions.push('profile.organization = :organization');
        expressionAttributeValues[':organization'] = updates.profile.organization;
      }
    }

    if (updates.isActive !== undefined) {
      updateExpressions.push('isActive = :isActive');
      expressionAttributeValues[':isActive'] = updates.isActive;
    }

    if (updates.shelterId !== undefined) {
      updateExpressions.push('shelterId = :shelterId');
      expressionAttributeValues[':shelterId'] = updates.shelterId;
    }

    if (updates.role) {
      updateExpressions.push('#role = :role');
      expressionAttributeNames['#role'] = 'role';
      expressionAttributeValues[':role'] = updates.role;
    }

    if (updateExpressions.length === 0) {
      throw new Error('No updates provided');
    }

    const response = await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    if (!response.Attributes) {
      return null;
    }

    // Remove password hash from response
    const { passwordHash, ...user } = response.Attributes as User;
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Get user with password hash
    const userWithPassword = await AuthService.getUserWithPassword(userId);
    if (!userWithPassword) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthService.verifyPassword(currentPassword, userWithPassword.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = AuthService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const newPasswordHash = await AuthService.hashPassword(newPassword);

    // Update password in database
    await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: 'SET passwordHash = :passwordHash',
      ExpressionAttributeValues: {
        ':passwordHash': newPasswordHash
      }
    }));

    return true;
  }

  /**
   * Reset password (admin function)
   */
  async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    // Validate new password strength
    const passwordValidation = AuthService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const passwordHash = await AuthService.hashPassword(newPassword);

    // Update password in database
    await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: 'SET passwordHash = :passwordHash',
      ExpressionAttributeValues: {
        ':passwordHash': passwordHash
      }
    }));

    return true;
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      await this.updateUser(userId, { isActive: false });
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<boolean> {
    try {
      await this.updateUser(userId, { isActive: true });
      return true;
    } catch (error) {
      console.error('Error activating user:', error);
      return false;
    }
  }

  /**
   * Get all users with optional role filtering
   */
  async getAllUsers(role?: UserRole, limit?: number): Promise<PublicUser[]> {
    if (role) {
      const response = await docClient.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#role = :role',
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': role },
        Limit: limit
      }));

      return (response.Items || []).map(item => {
        const { passwordHash, ...user } = item as User;
        return user;
      });
    } else {
      const response = await docClient.send(new ScanCommand({
        TableName: this.tableName,
        Limit: limit
      }));

      return (response.Items || []).map(item => {
        const { passwordHash, ...user } = item as User;
        return user;
      });
    }
  }

  /**
   * Get users by shelter ID (for shelter operators)
   */
  async getUsersByShelter(shelterId: string): Promise<PublicUser[]> {
    const response = await docClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'shelterId = :shelterId',
      ExpressionAttributeValues: { ':shelterId': shelterId }
    }));

    return (response.Items || []).map(item => {
      const { passwordHash, ...user } = item as User;
      return user;
    });
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: 'SET lastLogin = :lastLogin',
      ExpressionAttributeValues: {
        ':lastLogin': new Date().toISOString()
      }
    }));
  }

  /**
   * Check if user exists by email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<UserRole, number>;
  }> {
    const allUsers = await this.getAllUsers();
    
    const stats = {
      total: allUsers.length,
      active: allUsers.filter(user => user.isActive).length,
      byRole: {
        [UserRole.ADMIN]: 0,
        [UserRole.EMERGENCY_COORDINATOR]: 0,
        [UserRole.FIRST_RESPONDER]: 0,
        [UserRole.SHELTER_OPERATOR]: 0
      }
    };

    allUsers.forEach(user => {
      stats.byRole[user.role]++;
    });

    return stats;
  }
}