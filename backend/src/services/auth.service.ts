import { db } from '@/config/database';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  createError
} from '@/utils/helpers';
import { User, NewUser } from '@/models/schema';
import { USER_ROLES, USER_STATUS } from '@/utils/constants';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class AuthService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }, ipAddress?: string, userAgent?: string): Promise<{ user: User; token: string }> {
    try {
      # Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw createError('User already exists with this email', 409);
      }

      # Hash password
      const hashedPassword = await hashPassword(userData.password);

      # Create user
      const newUserData: NewUser = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || USER_ROLES.USER,
        status: USER_STATUS.ACTIVE,
        walletBalance: '0',
        emailVerified: false
      };

      const [newUser] = await db
        .insert(users)
        .values(newUserData)
        .returning();

      # Generate token
      const token = generateToken({ 
        userId: newUser.id, 
        role: newUser.role,
        email: newUser.email 
      });

      # Log audit
      await this.auditService.log({
        userId: newUser.id,
        action: 'register',
        resource: 'user',
        resourceId: newUser.id,
        newValues: sanitizeUser(newUser),
        ipAddress,
        userAgent
      });

      logger.info(`New user registered: ${newUser.email} (${newUser.role})`);

      return {
        user: sanitizeUser(newUser) as User,
        token
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(
    email: string, 
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; token: string }> {
    try {
      # Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw createError('Invalid credentials', 401);
      }

      # Check password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      # Check user status
      if (user.status !== USER_STATUS.ACTIVE) {
        throw createError(`Account is ${user.status}`, 403);
      }

      # Update last login
      await db
        .update(users)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      # Generate token
      const token = generateToken({ 
        userId: user.id, 
        role: user.role,
        email: user.email 
      });

      # Log audit
      await this.auditService.log({
        userId: user.id,
        action: 'login',
        resource: 'user',
        resourceId: user.id,
        metadata: { loginTime: new Date() },
        ipAddress,
        userAgent
      });

      logger.info(`User logged in: ${user.email} (${user.role})`);

      return {
        user: sanitizeUser(user) as User,
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user ? sanitizeUser(user) as User : null;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user ? sanitizeUser(user) as User : null;
    } catch (error) {
      logger.error('Get user by email error:', error);
      throw error;
    }
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      # Get user with password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      # Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 400);
      }

      # Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      # Update password
      await db
        .update(users)
        .set({ 
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      # Log audit
      await this.auditService.log({
        userId,
        action: 'update_password',
        resource: 'user',
        resourceId: userId,
        metadata: { passwordChanged: true },
        ipAddress,
        userAgent
      });

      logger.info(`Password updated for user: ${user.email}`);
    } catch (error) {
      logger.error('Update password error:', error);
      throw error;
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          emailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      # Log audit
      await this.auditService.log({
        userId,
        action: 'verify_email',
        resource: 'user',
        resourceId: userId,
        newValues: { emailVerified: true }
      });

      logger.info(`Email verified for user: ${userId}`);
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  async logout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      # Log audit
      await this.auditService.log({
        userId,
        action: 'logout',
        resource: 'user',
        resourceId: userId,
        metadata: { logoutTime: new Date() },
        ipAddress,
        userAgent
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
}
