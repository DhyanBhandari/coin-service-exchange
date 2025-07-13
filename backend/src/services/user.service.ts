import { getDb } from '../config/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { User } from '../models/schema';
import { sanitizeUser, createError } from '../utils/helpers';
import { USER_STATUS } from '../utils/constants';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';

export class UserService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async updateProfile(
    userId: string,
    updateData: Partial<User>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    try {
      const db = getDb();

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Log audit
      await this.auditService.log({
        userId,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        oldValues: sanitizeUser(existingUser),
        newValues: sanitizeUser(updatedUser),
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
      });

      logger.info(`User profile updated: ${userId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async updateWalletBalance(
    userId: string,
    amount: string,
    operation: 'add' | 'subtract' = 'add'
  ): Promise<User> {
    try {
      const db = getDb();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      const changeAmount = parseFloat(amount);

      let newBalance: number;
      if (operation === 'add') {
        newBalance = currentBalance + changeAmount;
      } else {
        newBalance = currentBalance - changeAmount;
        if (newBalance < 0) {
          throw createError('Insufficient wallet balance', 400);
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          walletBalance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      logger.info(`Wallet balance updated for user ${userId}: ${currentBalance} -> ${newBalance}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Update wallet balance error:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const db = getDb();

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

  async suspendUser(
    userId: string,
    adminId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    try {
      const db = getDb();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          status: USER_STATUS.SUSPENDED,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'suspend',
        resource: 'user',
        resourceId: userId,
        oldValues: { status: user.status },
        newValues: { status: USER_STATUS.SUSPENDED },
        metadata: { reason },
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
      });

      logger.info(`User suspended: ${userId} by admin: ${adminId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Suspend user error:', error);
      throw error;
    }
  }

  async reactivateUser(
    userId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    try {
      const db = getDb();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          status: USER_STATUS.ACTIVE,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'activate',
        resource: 'user',
        resourceId: userId,
        oldValues: { status: user.status },
        newValues: { status: USER_STATUS.ACTIVE },
        ...(ipAddress ? { ipAddress } : {}),
        ...(userAgent ? { userAgent } : {})
      });

      logger.info(`User reactivated: ${userId} by admin: ${adminId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Reactivate user error:', error);
      throw error;
    }
  }
}
