import { db } from '@/config/database';
import { transactions } from '@/models/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { Transaction, NewTransaction } from '@/models/schema';
import { createError, calculatePagination } from '@/utils/helpers';
import { TransactionFilters, PaginationParams, PaginatedResponse } from '@/types';
import { UserService } from './user.service';
import { logger } from '@/utils/logger';

export class TransactionService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createTransaction(transactionData: NewTransaction): Promise<Transaction> {
    try {
      # Get user's current balance
      const user = await this.userService.getUserById(transactionData.userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      const transactionAmount = parseFloat(transactionData.amount);

      # Calculate new balance based on transaction type
      let newBalance = currentBalance;
      if (transactionData.type === 'coin_purchase') {
        newBalance += transactionAmount;
      } else if (transactionData.type === 'service_booking' || transactionData.type === 'coin_conversion') {
        newBalance -= transactionAmount;
      } else if (transactionData.type === 'refund') {
        newBalance += transactionAmount;
      }

      # Create transaction with balance information
      const [newTransaction] = await db
        .insert(transactions)
        .values({
          ...transactionData,
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString()
        })
        .returning();

      logger.info(`Transaction created: ${newTransaction.id} for user: ${transactionData.userId}`);
      return newTransaction;
    } catch (error) {
      logger.error('Create transaction error:', error);
      throw error;
    }
  }

  async getTransactions(
    filters: TransactionFilters = {},
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      let query = db.select().from(transactions);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(transactions);

      # Apply filters
      const conditions = [];

      if (filters.userId) {
        conditions.push(eq(transactions.userId, filters.userId));
      }

      if (filters.serviceId) {
        conditions.push(eq(transactions.serviceId, filters.serviceId));
      }

      if (filters.type) {
        conditions.push(eq(transactions.type, filters.type));
      }

      if (filters.status) {
        conditions.push(eq(transactions.status, filters.status));
      }

      if (filters.startDate) {
        conditions.push(gte(transactions.createdAt, new Date(filters.startDate)));
      }

      if (filters.endDate) {
        conditions.push(lte(transactions.createdAt, new Date(filters.endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
        countQuery = countQuery.where(and(...conditions));
      }

      # Get total count
      const [{ count: total }] = await countQuery;

      # Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const data = await query
        .orderBy(desc(transactions.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get transactions error:', error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      return transaction || null;
    } catch (error) {
      logger.error('Get transaction by ID error:', error);
      throw error;
    }
  }

  async updateTransactionStatus(
    id: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      const [updatedTransaction] = await db
        .update(transactions)
        .set({
          status,
          metadata,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, id))
        .returning();

      if (!updatedTransaction) {
        throw createError('Transaction not found', 404);
      }

      logger.info(`Transaction status updated: ${id} -> ${status}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('Update transaction status error:', error);
      throw error;
    }
  }

  async getUserTransactionHistory(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      return this.getTransactions({ userId }, pagination);
    } catch (error) {
      logger.error('Get user transaction history error:', error);
      throw error;
    }
  }

  async getTransactionStats(userId?: string): Promise<any> {
    try {
      let query = db.select().from(transactions);
      
      if (userId) {
        query = query.where(eq(transactions.userId, userId));
      }

      const allTransactions = await query;

      const stats = {
        total: allTransactions.length,
        completed: allTransactions.filter(t => t.status === 'completed').length,
        pending: allTransactions.filter(t => t.status === 'pending').length,
        failed: allTransactions.filter(t => t.status === 'failed').length,
        totalAmount: allTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        byType: {
          coin_purchase: allTransactions.filter(t => t.type === 'coin_purchase').length,
          service_booking: allTransactions.filter(t => t.type === 'service_booking').length,
          coin_conversion: allTransactions.filter(t => t.type === 'coin_conversion').length,
          refund: allTransactions.filter(t => t.type === 'refund').length
        }
      };

      return stats;
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      throw error;
    }
  }
}
