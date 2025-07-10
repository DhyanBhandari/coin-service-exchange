import { db } from '@/config/database';
import { services, users, serviceReviews } from '@/models/schema';
import { eq, and, desc, asc, ilike, gte, lte, sql } from 'drizzle-orm';
import { Service, NewService, ServiceReview, NewServiceReview } from '@/models/schema';
import { createError, calculatePagination } from '@/utils/helpers';
import { SERVICE_STATUS } from '@/utils/constants';
import { ServiceFilters, PaginationParams, PaginatedResponse } from '@/types';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class ServiceService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async createService(
    serviceData: NewService,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Service> {
    try {
      const [newService] = await db
        .insert(services)
        .values({
          ...serviceData,
          organizationId: userId,
          status: SERVICE_STATUS.PENDING
        })
        .returning();

      # Log audit
      await this.auditService.log({
        userId,
        action: 'create',
        resource: 'service',
        resourceId: newService.id,
        newValues: newService,
        ipAddress,
        userAgent
      });

      logger.info(`New service created: ${newService.id} by org: ${userId}`);
      return newService;
    } catch (error) {
      logger.error('Create service error:', error);
      throw error;
    }
  }

  async getServices(
    filters: ServiceFilters = {},
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Service>> {
    try {
      let query = db.select().from(services);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(services);

      # Apply filters
      const conditions = [];

      if (filters.category) {
        conditions.push(eq(services.category, filters.category));
      }

      if (filters.status) {
        conditions.push(eq(services.status, filters.status));
      }

      if (filters.organizationId) {
        conditions.push(eq(services.organizationId, filters.organizationId));
      }

      if (filters.search) {
        conditions.push(
          ilike(services.title, `%${filters.search}%`)
        );
      }

      if (filters.minPrice) {
        conditions.push(gte(services.price, filters.minPrice.toString()));
      }

      if (filters.maxPrice) {
        conditions.push(lte(services.price, filters.maxPrice.toString()));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
        countQuery = countQuery.where(and(...conditions));
      }

      # Get total count
      const [{ count: total }] = await countQuery;

      # Apply pagination and sorting
      const offset = (pagination.page - 1) * pagination.limit;
      const orderColumn = pagination.sortBy === 'price' ? services.price :
                         pagination.sortBy === 'rating' ? services.rating :
                         services.createdAt;
      
      const orderDirection = pagination.sortOrder === 'desc' ? desc : asc;
      
      const data = await query
        .orderBy(orderDirection(orderColumn))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get services error:', error);
      throw error;
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      return service || null;
    } catch (error) {
      logger.error('Get service by ID error:', error);
      throw error;
    }
  }

  async updateService(
    id: string,
    updateData: Partial<Service>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Service> {
    try {
      const [existingService] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!existingService) {
        throw createError('Service not found', 404);
      }

      const [updatedService] = await db
        .update(services)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(services.id, id))
        .returning();

      # Log audit
      await this.auditService.log({
        userId,
        action: 'update',
        resource: 'service',
        resourceId: id,
        oldValues: existingService,
        newValues: updatedService,
        ipAddress,
        userAgent
      });

      logger.info(`Service updated: ${id} by user: ${userId}`);
      return updatedService;
    } catch (error) {
      logger.error('Update service error:', error);
      throw error;
    }
  }

  async deleteService(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const [existingService] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!existingService) {
        throw createError('Service not found', 404);
      }

      await db.delete(services).where(eq(services.id, id));

      # Log audit
      await this.auditService.log({
        userId,
        action: 'delete',
        resource: 'service',
        resourceId: id,
        oldValues: existingService,
        ipAddress,
        userAgent
      });

      logger.info(`Service deleted: ${id} by user: ${userId}`);
    } catch (error) {
      logger.error('Delete service error:', error);
      throw error;
    }
  }

  async approveService(
    id: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Service> {
    try {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!service) {
        throw createError('Service not found', 404);
      }

      const [updatedService] = await db
        .update(services)
        .set({
          status: SERVICE_STATUS.ACTIVE,
          updatedAt: new Date()
        })
        .where(eq(services.id, id))
        .returning();

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'approve',
        resource: 'service',
        resourceId: id,
        oldValues: { status: service.status },
        newValues: { status: SERVICE_STATUS.ACTIVE },
        ipAddress,
        userAgent
      });

      logger.info(`Service approved: ${id} by admin: ${adminId}`);
      return updatedService;
    } catch (error) {
      logger.error('Approve service error:', error);
      throw error;
    }
  }

  async addReview(
    serviceId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<ServiceReview> {
    try {
      # Check if service exists
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!service) {
        throw createError('Service not found', 404);
      }

      # Check if user already reviewed this service
      const [existingReview] = await db
        .select()
        .from(serviceReviews)
        .where(and(
          eq(serviceReviews.serviceId, serviceId),
          eq(serviceReviews.userId, userId)
        ))
        .limit(1);

      if (existingReview) {
        throw createError('You have already reviewed this service', 409);
      }

      # Create review
      const [newReview] = await db
        .insert(serviceReviews)
        .values({
          serviceId,
          userId,
          rating,
          review
        })
        .returning();

      # Update service rating
      await this.updateServiceRating(serviceId);

      logger.info(`Review added for service: ${serviceId} by user: ${userId}`);
      return newReview;
    } catch (error) {
      logger.error('Add review error:', error);
      throw error;
    }
  }

  private async updateServiceRating(serviceId: string): Promise<void> {
    try {
      const reviews = await db
        .select()
        .from(serviceReviews)
        .where(and(
          eq(serviceReviews.serviceId, serviceId),
          eq(serviceReviews.isVisible, true)
        ));

      if (reviews.length === 0) return;

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await db
        .update(services)
        .set({
          rating: averageRating.toFixed(2),
          reviewCount: reviews.length,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId));
    } catch (error) {
      logger.error('Update service rating error:', error);
    }
  }

  async incrementBookings(serviceId: string): Promise<void> {
    try {
      await db
        .update(services)
        .set({
          bookings: sql`${services.bookings} + 1`,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId));
    } catch (error) {
      logger.error('Increment bookings error:', error);
      throw error;
    }
  }
}
