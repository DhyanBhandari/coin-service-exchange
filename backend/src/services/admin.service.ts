// Fixed admin.service.ts
import { getDb } from '../config/database';
import { users, services, conversionRequests, serviceCategories } from '../models/schema';
import { eq, count, desc, gte, sql } from 'drizzle-orm';
import { DashboardStats, UserStats, ServiceStats, FinancialStats } from '../types';
import { USER_ROLES, SERVICE_STATUS } from '../utils/constants';
import { logger } from '../utils/logger';

export class AdminService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const db = getDb();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const thisMonth = new Date();
      thisMonth.setDate(1);

      // User stats
      const totalUsers = await db.select({ count: count() }).from(users);
      const activeUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true));

      const newUsersThisMonth = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, thisMonth));

      const totalOrganizations = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, USER_ROLES.ORG));

      const userStats: UserStats = {
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsers[0].count,
        newUsersThisMonth: newUsersThisMonth[0].count,
        totalOrganizations: totalOrganizations[0].count
      };

      // Service stats
      const totalServices = await db.select({ count: count() }).from(services);
      const activeServices = await db
        .select({ count: count() })
        .from(services)
        .where(eq(services.status, SERVICE_STATUS.ACTIVE));

      const pendingServices = await db
        .select({ count: count() })
        .from(services)
        .where(eq(services.status, SERVICE_STATUS.PENDING));

      const totalBookingsResult = await db
        .select({ total: sql<number>`sum(${services.bookingCount})` })
        .from(services);

      const serviceStats: ServiceStats = {
        totalServices: totalServices[0].count,
        activeServices: activeServices[0].count,
        pendingServices: pendingServices[0].count,
        totalBookings: totalBookingsResult[0].total || 0
      };

      // Financial stats
      const allUsers = await db.select().from(users);
      const totalCoinsInCirculation = allUsers.reduce(
        (sum, user) => sum + parseFloat(user.walletBalance?.toString() || '0'),
        0
      );

      const totalRevenue = 0;
      const thisMonthRevenue = 0;

      const pendingConversions = await db
        .select({ count: count() })
        .from(conversionRequests)
        .where(eq(conversionRequests.status, 'pending'));

      const financialStats: FinancialStats = {
        totalCoinsInCirculation,
        totalRevenue,
        pendingConversions: pendingConversions[0].count,
        thisMonthRevenue
      };

      return {
        users: userStats,
        services: serviceStats,
        financial: financialStats
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  static async getManagementData() {
    try {
      const db = getDb();

      const recentServices = await db
        .select()
        .from(services)
        .orderBy(desc(services.createdAt))
        .limit(10);

      const recentUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(10);

      return {
        services: recentServices,
        users: recentUsers.map(user => {
          const { passwordHash, ...safeUser } = user;
          return safeUser;
        })
      };
    } catch (error) {
      logger.error('Get management data error:', error);
      throw error;
    }
  }

  static async getSystemHealth() {
    try {
      const db = getDb();

      // Check database connectivity
      const dbCheck = await db.select({ count: count() }).from(users);
      const isDatabaseHealthy = dbCheck[0].count >= 0;

      // Calculate uptime (simplified)
      const uptime = process.uptime();

      // Memory usage
      const memoryUsage = process.memoryUsage();

      return {
        database: {
          status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
          responseTime: '< 100ms'
        },
        server: {
          uptime: Math.floor(uptime),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
          }
        },
        external: {
          razorpay: 'healthy',
          supabase: 'healthy'
        }
      };
    } catch (error) {
      logger.error('Get system health error:', error);
      throw error;
    }
  }

  static async approveService(id: string) {
    try {
      const db = getDb();

      const [updatedService] = await db
        .update(services)
        .set({
          status: SERVICE_STATUS.ACTIVE,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(services.id, id))
        .returning();

      if (!updatedService) {
        throw new Error('Service not found');
      }

      logger.info(`Service approved: ${id}`);
      return updatedService;
    } catch (error) {
      logger.error('Approve service error:', error);
      throw error;
    }
  }

  static async suspendUser(id: string) {
    try {
      const db = getDb();

      const [updatedUser] = await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      logger.info(`User suspended: ${id}`);
      return updatedUser;
    } catch (error) {
      logger.error('Suspend user error:', error);
      throw error;
    }
  }

  static async createServiceCategory(name: string, description: string) {
    try {
      const db = getDb();

      const [newCategory] = await db
        .insert(serviceCategories)
        .values({
          name,
          description,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          isActive: true
        })
        .returning();

      logger.info(`Service category created: ${name}`);
      return newCategory;
    } catch (error) {
      logger.error('Create service category error:', error);
      throw error;
    }
  }
}