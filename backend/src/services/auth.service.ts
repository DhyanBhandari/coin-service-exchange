import { getDb } from '../config/database';
import { users, passwordResetTokens } from '../models/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  createError,
  generatePasswordResetToken
} from '../utils/helpers';
import { User, NewUser, NewPasswordResetToken } from '../models/schema';
import { USER_ROLES } from '../utils/constants';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';

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
      const db = getDb();

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw createError('User already exists with this email', 409);
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user - using passwordHash field
      const newUserData: NewUser = {
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role || USER_ROLES.USER,
        isActive: true,
        walletBalance: '0',
        emailVerified: false
      };

      const [newUser] = await db
        .insert(users)
        .values(newUserData)
        .returning();

      if (!newUser) {
        throw createError('Failed to create user', 500);
      }

      // Generate token
      const token = generateToken({
        userId: newUser.id,
        role: newUser.role,
        email: newUser.email
      });

      // Log audit
      await this.auditService.log({
        userId: newUser.id,
        action: 'register',
        resource: 'user',
        resourceId: newUser.id,
        newValues: sanitizeUser(newUser),
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
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
      const db = getDb();

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw createError('Invalid credentials', 401);
      }

      // Check password - use passwordHash field
      const isPasswordValid = await comparePassword(password, user.passwordHash || '');
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      // Check user status - use isActive field
      if (!user.isActive) {
        throw createError('Account is suspended', 403);
      }

      // Update last login
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Generate token
      const token = generateToken({
        userId: user.id,
        role: user.role,
        metadata: { loginTime: new Date() },
        ipAddress,
        userAgent
      });

      await this.auditService.log({
        userId: user.id,
        action: 'login',
        resource: 'user',
        resourceId: user.id,
        metadata: { loginTime: new Date() },
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
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

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user ? sanitizeUser(user) as User : undefined;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user ? sanitizeUser(user) as User : undefined;
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
      const db = getDb();

      // Get user with password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      // Verify current password - use passwordHash field
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash || '');
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 400);
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password - use passwordHash field
      await db
        .update(users)
        .set({
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.auditService.log({
        userId,
        action: 'update_password',
        resource: 'user',
        resourceId: userId,
        metadata: { passwordChanged: true },
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
      });

      logger.info(`Password updated for user: ${user.email}`);
    } catch (error) {
      logger.error('Update password error:', error);
      throw error;
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    try {
      const db = getDb();

      await db
        .update(users)
        .set({
          emailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Log audit
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
      await this.auditService.log({
        userId,
        action: 'logout',
        resource: 'user',
        resourceId: userId,
        metadata: { logoutTime: new Date() },
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const db = getDb();

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Don't reveal if email exists or not for security
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
      }

      // Check user status - use isActive field
      if (!user.isActive) {
        throw createError('Account is suspended', 403);
      }

      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Invalidate any existing tokens for this user
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true, updatedAt: new Date() })
        .where(and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.isUsed, false)
        ));

      // Create new reset token - include tokenHash
      const newTokenData: NewPasswordResetToken = {
        userId: user.id,
        token: resetToken,
        tokenHash: tokenHash,
        expiresAt,
        isUsed: false
      };

      await db
        .insert(passwordResetTokens)
        .values(newTokenData);

      // Log audit
      await this.auditService.log({
        userId: user.id,
        action: 'forgot_password',
        resource: 'user',
        resourceId: user.id,
        metadata: { tokenGenerated: true }
      });

      logger.info(`Password reset token generated for user: ${user.email}`);

      // TODO: Send email with reset token
      // For now, we'll just log it (in production, you'd send an email)
      logger.info(`Password reset token for ${user.email}: ${resetToken}`);

      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const db = getDb();

      // Find valid reset token
      const [resetTokenRecord] = await db
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false),
          gt(passwordResetTokens.expiresAt, new Date())
        ))
        .limit(1);

      if (!resetTokenRecord) {
        throw createError('Invalid or expired reset token', 400);
      }

      // Get user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, resetTokenRecord.userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check user status - use isActive field
      if (!user.isActive) {
        throw createError('Account is suspended', 403);
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password - use passwordHash field
      await db
        .update(users)
        .set({
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({
          isUsed: true,
          updatedAt: new Date()
        })
        .where(eq(passwordResetTokens.id, resetTokenRecord.id));

      // Log audit
      await this.auditService.log({
        userId: user.id,
        action: 'reset_password',
        resource: 'user',
        resourceId: user.id,
        metadata: { passwordReset: true }
      });

      logger.info(`Password reset successful for user: ${user.email}`);

      return { message: 'Password has been reset successfully.' };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }
}