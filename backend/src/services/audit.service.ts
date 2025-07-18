// Fixed audit.service.ts
import { getDb } from '../config/database';
import { auditLogs } from '../models/schema';
import { NewAuditLog, AuditLog } from '../models/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface AuditLogData {
  userId?: string | null; // Changed from number to string for UUID
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export interface AuditLogResponse {
  id: string;
  userId: string | null;
  sessionId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  method: string | null;
  endpoint: string | null;
  statusCode: number | null;
  duration: number | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  changes: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: Record<string, any> | null;
  deviceInfo: Record<string, any> | null;
  severity: string | null;
  category: string | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  createdAt: Date | null;
}

export class AuditService {
  async log(data: AuditLogData): Promise<AuditLogResponse> {
    try {
      const db = getDb();
      const auditData: NewAuditLog = {
  userId: data.userId ? parseInt(data.userId, 10) : null,
  action: data.action,
  resource: data.resource,
  resourceId: data.resourceId || null,
  oldValues: data.oldValues,
  newValues: data.newValues,
  ipAddress: data.ipAddress || null,
  userAgent: data.userAgent || null,
  metadata: data.metadata || null
};


      const [newAuditLog] = await db
        .insert(auditLogs)
        .values(auditData)
        .returning();

      if (!newAuditLog) {
        throw new Error('Failed to create audit log');
      }

      return newAuditLog as AuditLogResponse;
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
    pagination: { page: number; limit: number }
  ) {
    try {
      const db = getDb();
      // Apply filters
      const conditions = [];

      if (filters.userId) {
      conditions.push(eq(auditLogs.userId, parseInt(filters.userId, 10)));
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

      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        data: data as AuditLogResponse[],
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

  async getAuditLogById(id: string): Promise<AuditLogResponse | null> {
    try {
      const db = getDb();
      const [auditLog] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, id))
        .limit(1);

      return (auditLog as AuditLogResponse) || null;
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
        eq(auditLogs.userId, parseInt(userId, 10)),
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

// Create a singleton instance for convenience
const auditService = new AuditService();

// Export a convenience function that matches the expected interface
export const logActivity = async (
  userId: string,
  action: string,
  resource: string,
  metadata?: any
): Promise<AuditLogResponse> => {
  return auditService.log({
    userId,
    action,
    resource,
    metadata
  });
};