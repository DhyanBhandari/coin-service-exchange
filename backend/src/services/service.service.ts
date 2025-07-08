import { db } from '@/config/database';
import { services, users, transactions } from '@/models/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { AppError } from '@/utils/helpers';
import { Service, Transaction } from '@/types';
import { SERVICE_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/utils/constants';

export class ServiceService {
  async createService(organizationId: string, serviceData: {
    title: string;
    description: string;
    price: number;
    category: string;
    features?: string[];
  }): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values({
        ...serviceData,
        organizationId,
        features: serviceData.features || [],
        status: SERVICE_STATUS.PENDING
      })
      .returning();

    return newService as Service;
  }

  async getServiceById(serviceId: string): Promise<Service | null> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    return service as Service || null;
  }

  async getServicesByOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ services: Service[]; total: number }> {
    const offset = (page - 1) * limit;

    const orgServices = await db
      .select()
      .from(services)
      .where(eq(services.organizationId, organizationId))
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(eq(services.organizationId, organizationId));

    return {
      services: orgServices as Service[],
      total: count
    };
  }

  async getPublicServices(
    page: number = 1,
    limit: number = 10,
    category?: string,
    search?: string
  ): Promise<{ services: Service[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereConditions = eq(services.status, SERVICE_STATUS.ACTIVE);

    if (category) {
      whereConditions = and(whereConditions, eq(services.category, category));
    }

    if (search) {
      whereConditions = and(
        whereConditions,
        ilike(services.title, `%${search}%`)
      );
    }

    const publicServices = await db
      .select({
        ...services,
        organizationName: users.name
      })
      .from(services)
      .leftJoin(users, eq(services.organizationId, users.id))
      .where(whereConditions)
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(whereConditions);

    return {
      services: publicServices as Service[],
      total: count
    };
  }

  async updateService(
    serviceId: string,
    organizationId: string,
    updateData: Partial<Service>
  ): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.organizationId, organizationId)
        )
      )
      .returning();

    if (!updatedService) {
      throw new AppError('Service not found or unauthorized', 404);
    }

    return updatedService as Service;
  }

  async deleteService(serviceId: string, organizationId: string): Promise<void> {
    const result = await db
      .delete(services)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.organizationId, organizationId)
        )
      );

    if (result.rowCount === 0) {
      throw new AppError('Service not found or unauthorized', 404);
    }
  }

  async bookService(userId: string, serviceId: string): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      // Get service details
      const [service] = await tx
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!service) {
        throw new AppError('Service not found', 404);
      }

      if (service.status !== SERVICE_STATUS.ACTIVE) {
        throw new AppError('Service is not available for booking', 400);
      }

      // Get user details
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const servicePrice = parseFloat(service.price);
      const userBalance = parseFloat(user.walletBalance);

      if (userBalance < servicePrice) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      // Create transaction
      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId,
          serviceId,
          type: TRANSACTION_TYPES.SERVICE_BOOKING,
          amount: service.price,
          status: TRANSACTION_STATUS.COMPLETED,
          description: `Booked service: ${service.title}`,
          metadata: {
            serviceName: service.title,
            organizationId: service.organizationId
          }
        })
        .returning();

      // Update user balance
      const newBalance = userBalance - servicePrice;
      await tx
        .update(users)
        .set({
          walletBalance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Update service bookings count
      await tx
        .update(services)
        .set({
          bookings: sql`${services.bookings} + 1`,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId));

      return transaction as Transaction;
    });
  }

  async getServiceCategories(): Promise<string[]> {
    const categories = await db
      .selectDistinct({ category: services.category })
      .from(services)
      .where(eq(services.status, SERVICE_STATUS.ACTIVE));

    return categories.map(c => c.category);
  }
}