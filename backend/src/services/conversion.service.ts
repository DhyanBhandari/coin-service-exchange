import { db } from '@/config/database';
import { conversionRequests, users } from '@/models/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { AppError } from '@/utils/helpers';
import { ConversionRequest } from '@/types';
import { CONVERSION_STATUS, MIN_CONVERSION_AMOUNT } from '@/utils/constants';

export class ConversionService {
  async createConversionRequest(
    organizationId: string,
    amount: number,
    currency: string
  ): Promise<ConversionRequest> {
    if (amount < MIN_CONVERSION_AMOUNT) {
      throw new AppError(`Minimum conversion amount is ${MIN_CONVERSION_AMOUNT}`, 400);
    }

    // Check if organization has sufficient balance
    const [organization] = await db
      .select()
      .from(users)
      .where(eq(users.id, organizationId))
      .limit(1);

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    const orgBalance = parseFloat(organization.walletBalance);
    if (orgBalance < amount) {
      throw new AppError('Insufficient coin balance', 400);
    }

    const [conversionRequest] = await db
      .insert(conversionRequests)
      .values({
        organizationId,
        amount: amount.toString(),
        currency,
        status: CONVERSION_STATUS.PENDING
      })
      .returning();

    return conversionRequest as ConversionRequest;
  }

  async getConversionRequestById(requestId: string): Promise<ConversionRequest | null> {
    const [request] = await db
      .select()
      .from(conversionRequests)
      .where(eq(conversionRequests.id, requestId))
      .limit(1);

    return request as ConversionRequest || null;
  }

  async getOrganizationConversions(
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ conversions: ConversionRequest[]; total: number }> {
    const offset = (page - 1) * limit;

    const conversions = await db
      .select()
      .from(conversionRequests)
      .where(eq(conversionRequests.organizationId, organizationId))
      .orderBy(desc(conversionRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversionRequests)
      .where(eq(conversionRequests.organizationId, organizationId));

    return {
      conversions: conversions as ConversionRequest[],
      total: count
    };
  }

  async getAllConversions(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ conversions: any[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereCondition = undefined;
    if (status) {
      whereCondition = eq(conversionRequests.status, status);
    }

    const conversions = await db
      .select({
        ...conversionRequests,
        organizationName: users.name,
        organizationEmail: users.email
      })
      .from(conversionRequests)
      .leftJoin(users, eq(conversionRequests.organizationId, users.id))
      .where(whereCondition)
      .orderBy(desc(conversionRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversionRequests)
      .where(whereCondition);

    return {
      conversions,
      total: count
    };
  }

  async updateConversionStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    adminId: string,
    reason?: string
  ): Promise<ConversionRequest> {
    return await db.transaction(async (tx) => {
      const [request] = await tx
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw new AppError('Conversion request not found', 404);
      }

      if (request.status !== CONVERSION_STATUS.PENDING) {
        throw new AppError('Conversion request has already been processed', 400);
      }

      const [updatedRequest] = await tx
        .update(conversionRequests)
        .set({
          status,
          reason,
          processedBy: adminId,
          processedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(conversionRequests.id, requestId))
        .returning();

      // If approved, deduct coins from organization's balance
      if (status === CONVERSION_STATUS.APPROVED) {
        const [organization] = await tx
          .select()
          .from(users)
          .where(eq(users.id, request.organizationId))
          .limit(1);

        if (organization) {
          const currentBalance = parseFloat(organization.walletBalance);
          const conversionAmount = parseFloat(request.amount);
          const newBalance = currentBalance - conversionAmount;

          await tx
            .update(users)
            .set({
              walletBalance: newBalance.toString(),
              updatedAt: new Date()
            })
            .where(eq(users.id, request.organizationId));
        }
      }

      return updatedRequest as ConversionRequest;
    });
  }

  async getPendingConversions(): Promise<ConversionRequest[]> {
    const pendingConversions = await db
      .select({
        ...conversionRequests,
        organizationName: users.name,
        organizationEmail: users.email
      })
      .from(conversionRequests)
      .leftJoin(users, eq(conversionRequests.organizationId, users.id))
      .where(eq(conversionRequests.status, CONVERSION_STATUS.PENDING))
      .orderBy(desc(conversionRequests.createdAt));

    return pendingConversions as ConversionRequest[];
  }
}