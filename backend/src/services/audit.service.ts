// Fixed audit.service.ts
import { getDb } from '../config/database';
import { auditLogs } from '../models/schema';
import { NewAuditLog, AuditLog } from '../models/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { AuditLogData, PaginationParams, PaginatedResponse } from '../types';
import { calculatePagination } from '../utils/helpers';
import { logger } from '../utils/logger';

export class AuditService {
  async log(data: AuditLogData): Promise<AuditLog> {
    try {
      const db = getDb();
      const auditData: NewAuditLog = {
        userId: data.userId ?? null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata ?? null
      };

      const [newAuditLog] = await db
        .insert(auditLogs)
        .values(auditData)
        .returning();

      if (!newAuditLog) {
        throw new Error('Failed to create audit log');
      }

      return newAuditLog;
    } catch (error) {
      logger.error('Audit log error:', error);
      throw error;
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
    pagination: PaginationParams
  ): Promise<PaginatedResponse<AuditLog>> {
    try {
      const db = getDb();
      // Apply filters
      const conditions = [];

      if (filters.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId));
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

      // Get total count
      const totalQuery = conditions.length > 0
        ? db.select().from(auditLogs).where(and(...conditions))
        : db.select().from(auditLogs);

      const total = (await totalQuery).length;

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const dataQuery = conditions.length > 0
        ? db.select().from(auditLogs).where(and(...conditions))
        : db.select().from(auditLogs);

      const data = await dataQuery
        .orderBy(desc(auditLogs.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get audit logs error:', error);
      throw error;
    }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const db = getDb();
      const [auditLog] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, id))
        .limit(1);

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
          eq(auditLogs.userId, userId),
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
