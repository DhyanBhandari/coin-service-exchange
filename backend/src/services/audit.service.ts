// backend/src/services/audit.service.ts

import { getDb } from '../config/database';
import { auditLogs, NewAuditLog, AuditLog } from '../models/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '../models/schema';

// A type alias for the Drizzle transaction object for cleaner code.
type Tx = PgTransaction<any, typeof schema, any>;

export interface AuditLogData {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export class AuditService {

  /**
   * Logs an audit event. It can now operate within a parent database transaction.
   */
  async log(data: AuditLogData, tx?: Tx): Promise<AuditLog> {
    const db = tx || getDb(); 

    try {
      const auditData: NewAuditLog = {
        userId: data.userId || null, // CORRECTED: No longer uses parseInt
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
      };

      const [newAuditLog] = await db
        .insert(auditLogs)
        .values(auditData)
        .returning();

      if (!newAuditLog) {
        throw new Error('Failed to create audit log');
      }

      return newAuditLog;
    } catch (error: any) {
      logger.error({
        message: 'Failed to write to audit log.',
        logData: data,
        error: error.message,
      });
      // A failure to log should not crash a critical operation.
      // We log the error but don't re-throw.
      return {} as AuditLog;
    }
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    pagination: { page: number; limit: number }
  ) {
    try {
      const db = getDb();
      const conditions = [];
      if (filters.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId)); // CORRECTED: No longer uses parseInt
      }
      if (filters.action) {
        conditions.push(eq(auditLogs.action, filters.action));
      }
      if (filters.resource) {
        conditions.push(eq(auditLogs.resource, filters.resource));
      }
      if (filters.startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
      }
      if (filters.endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const totalQuery = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereClause);
      const total = totalQuery[0].count;
      const offset = (pagination.page - 1) * pagination.limit;
      const data = await db.select().from(auditLogs).where(whereClause).orderBy(desc(auditLogs.createdAt)).limit(pagination.limit).offset(offset);
      const totalPages = Math.ceil(total / pagination.limit);
      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      };
    } catch (error) {
      logger.error('Get audit logs error:', error);
      throw error;
    }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const db = getDb();
      const [auditLog] = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
      return auditLog || null;
    } catch (error) {
      logger.error('Get audit log by ID error:', error);
      throw error;
    }
  }

  async getActivitySummary(userId: string, days: number = 30): Promise<any> {
    try {
      const db = getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.userId, userId), // CORRECTED: No longer uses parseInt
          gte(auditLogs.createdAt, startDate)
        ))
        .orderBy(desc(auditLogs.createdAt));
      const summary = {
        totalActions: logs.length,
        actionBreakdown: logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        resourceBreakdown: logs.reduce((acc, log) => {
          acc[log.resource] = (acc[log.resource] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: logs.slice(0, 10)
      };
      return summary;
    } catch (error) {
      logger.error('Get activity summary error:', error);
      throw error;
    }
  }
}

// ✅ RESTORED: This section is added back to fix the export error.
const auditService = new AuditService();

export const logActivity = async (
  userId: string,
  action: string,
  resource: string,
  metadata?: any
): Promise<AuditLog> => {
  return auditService.log({
    userId,
    action,
    resource,
    metadata
  });
};