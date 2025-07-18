// backend/src/services/user.service.ts

import { getDb } from '../config/database';
import { users, User } from '../models/schema';
import { eq, sql } from 'drizzle-orm';
import { sanitizeUser, createError } from '../utils/helpers';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '../models/schema';

type Tx = PgTransaction<any, typeof schema, any>;

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
      const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!existingUser) {
        throw createError('User not found', 404);
      }
      const [updatedUser] = await db
        .update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      await this.auditService.log({
        userId,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        oldValues: sanitizeUser(existingUser),
        newValues: sanitizeUser(updatedUser),
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent })
      });
      logger.info(`User profile updated: ${userId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error: any) {
      logger.error('Update profile error:', error);
      throw createError(error.message || 'Failed to update profile', 500);
    }
  }
  
  async updateWalletBalance(
    userId: string, 
    amount: number, 
    direction: 'add' | 'subtract',
    tx?: Tx
  ): Promise<{ balanceBefore: number; balanceAfter: number }> {
    const db = tx || getDb();
    const operator = direction === 'add' ? sql`+` : sql`-`;

    if (amount < 0) {
      throw new Error('Update amount cannot be negative.');
    }

    try {
        const [updatedUser] = await db
        .update(users)
        .set({ walletBalance: sql`${users.walletBalance} ${operator} ${amount}` })
        .where(eq(users.id, userId))
        .returning({ walletBalance: users.walletBalance });
      
      if (!updatedUser || updatedUser.walletBalance === null) {
        throw new Error('User not found or wallet balance is null.');
      }

      const balanceAfter = parseFloat(updatedUser.walletBalance);
      const balanceBefore = direction === 'add' ? balanceAfter - amount : balanceAfter + amount;
      
      logger.info(`Wallet balance updated for user ${userId}: ${balanceBefore} -> ${balanceAfter}`);
      return { balanceBefore, balanceAfter };

    } catch(error: any) {
        logger.error({
            message: `Failed to update wallet balance for user ${userId}.`,
            error: error.message
        });
        throw error;
    }
  }

  async getUserById(id: string, tx?: Tx): Promise<User | null> {
    const db = tx || getDb();
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user ? sanitizeUser(user) as User : null;
    } catch (error: any) {
      logger.error('Get user by ID error:', error.message);
      throw createError(error.message || 'Failed to get user', 500);
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
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({ 
            isActive: false, // ✅ CORRECTED: Use isActive instead of status
            updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();

      await this.auditService.log({
        userId: adminId,
        action: 'suspend',
        resource: 'user',
        resourceId: userId,
        oldValues: { isActive: user.isActive },
        newValues: { isActive: false },
        metadata: { reason },
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent })
      });
      logger.info(`User suspended: ${userId} by admin: ${adminId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error: any) {
      logger.error('Suspend user error:', error.message);
      throw createError(error.message || 'Failed to suspend user', 500);
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
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({ 
            isActive: true, // ✅ CORRECTED: Use isActive instead of status
            updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();

      await this.auditService.log({
        userId: adminId,
        action: 'activate',
        resource: 'user',
        resourceId: userId,
        oldValues: { isActive: user.isActive },
        newValues: { isActive: true },
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent })
      });
      logger.info(`User reactivated: ${userId} by admin: ${adminId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error: any) {
      logger.error('Reactivate user error:', error.message);
      throw createError(error.message || 'Failed to reactivate user', 500);
    }
  }
}