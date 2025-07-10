import { db } from '@/config/database';
import { conversionRequests } from '@/models/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ConversionRequest, NewConversionRequest } from '@/models/schema';
import { createError, calculatePagination } from '@/utils/helpers';
import { CONVERSION_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/utils/constants';
import { PaginationParams, PaginatedResponse } from '@/types';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class ConversionService {
  private transactionService: TransactionService;
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.transactionService = new TransactionService();
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  async createConversionRequest(
    organizationId: string,
    amount: number,
    bankDetails: any
  ): Promise<ConversionRequest> {
    try {
      # Check if organization has sufficient balance
      const user = await this.userService.getUserById(organizationId);
      if (!user) {
        throw createError('Organization not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      if (currentBalance < amount) {
        throw createError('Insufficient wallet balance', 400);
      }

      # Create conversion request
      const conversionData: NewConversionRequest = {
        organizationId,
        amount: amount.toString(),
        currency: 'INR',
        status: CONVERSION_STATUS.PENDING,
        bankDetails
      };

      const [newRequest] = await db
        .insert(conversionRequests)
        .values(conversionData)
        .returning();

      # Log audit
      await this.auditService.log({
        userId: organizationId,
        action: 'create',
        resource: 'conversion',
        resourceId: newRequest.id,
        newValues: newRequest
      });

      logger.info(`Conversion request created: ${newRequest.id} by org: ${organizationId}`);
      return newRequest;
    } catch (error) {
      logger.error('Create conversion request error:', error);
      throw error;
    }
  }

  async getConversionRequests(
    pagination: PaginationParams,
    organizationId?: string
  ): Promise<PaginatedResponse<ConversionRequest>> {
    try {
      let query = db.select().from(conversionRequests);
      
      if (organizationId) {
        query = query.where(eq(conversionRequests.organizationId, organizationId));
      }

      # Get total count
      const totalQuery = organizationId 
        ? db.select().from(conversionRequests).where(eq(conversionRequests.organizationId, organizationId))
        : db.select().from(conversionRequests);
      
      const total = (await totalQuery).length;

      # Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const data = await query
        .orderBy(desc(conversionRequests.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get conversion requests error:', error);
      throw error;
    }
  }

  async approveConversionRequest(
    requestId: string,
    adminId: string,
    transactionId?: string
  ): Promise<ConversionRequest> {
    try {
      const [request] = await db
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw createError('Conversion request not found', 404);
      }

      if (request.status !== CONVERSION_STATUS.PENDING) {
        throw createError('Conversion request is not pending', 400);
      }

      # Update request status
      const [updatedRequest] = await db
        .update(conversionRequests)
        .set({
          status: CONVERSION_STATUS.APPROVED,
          processedBy: adminId,
          processedAt: new Date(),
          transactionId,
          updatedAt: new Date()
        })
        .where(eq(conversionRequests.id, requestId))
        .returning();

      # Deduct amount from organization wallet
      const amount = parseFloat(request.amount);
      await this.userService.updateWalletBalance(
        request.organizationId,
        amount.toString(),
        'subtract'
      );

      # Create transaction record
      await this.transactionService.createTransaction({
        userId: request.organizationId,
        type: TRANSACTION_TYPES.COIN_CONVERSION,
        amount: amount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Coin conversion to bank account`,
        metadata: {
          conversionRequestId: requestId,
          bankDetails: request.bankDetails,
          transactionId
        }
      });

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'approve',
        resource: 'conversion',
        resourceId: requestId,
        oldValues: { status: request.status },
        newValues: { status: CONVERSION_STATUS.APPROVED },
        metadata: { amount, transactionId }
      });

      logger.info(`Conversion request approved: ${requestId} by admin: ${adminId}`);
      return updatedRequest;
    } catch (error) {
      logger.error('Approve conversion request error:', error);
      throw error;
    }
  }

  async rejectConversionRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<ConversionRequest> {
    try {
      const [request] = await db
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw createError('Conversion request not found', 404);
      }

      if (request.status !== CONVERSION_STATUS.PENDING) {
        throw createError('Conversion request is not pending', 400);
      }

      # Update request status
      const [updatedRequest] = await db
        .update(conversionRequests)
        .set({
          status: CONVERSION_STATUS.REJECTED,
          processedBy: adminId,
          processedAt: new Date(),
          reason,
          updatedAt: new Date()
        })
        .where(eq(conversionRequests.id, requestId))
        .returning();

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'reject',
        resource: 'conversion',
        resourceId: requestId,
        oldValues: { status: request.status },
        newValues: { status: CONVERSION_STATUS.REJECTED },
        metadata: { reason }
      });

      logger.info(`Conversion request rejected: ${requestId} by admin: ${adminId}`);
      return updatedRequest;
    } catch (error) {
      logger.error('Reject conversion request error:', error);
      throw error;
    }
  }

  async getConversionRequestById(id: string): Promise<ConversionRequest | null> {
    try {
      const [request] = await db
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, id))
        .limit(1);

      return request || null;
    } catch (error) {
      logger.error('Get conversion request by ID error:', error);
      throw error;
    }
  }
}
