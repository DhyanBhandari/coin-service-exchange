// backend/src/services/transaction.service.ts

import { getDb } from '../config/database';
import { transactions, Transaction, NewTransaction } from '../models/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { createError, calculatePagination } from '../utils/helpers';
import { TransactionFilters, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '../models/schema';
import { UserService } from './user.service';

type Tx = PgTransaction<any, typeof schema, any>;

export class TransactionService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Creates a new transaction record. It can operate within a parent transaction.
   * It expects all data, including balances, to be provided.
   */
  async createTransaction(
    transactionData: NewTransaction,
    tx?: Tx
  ): Promise<Transaction> {
    const db = tx || getDb();

    const valuesToInsert: NewTransaction = {
      ...transactionData,
      amount: transactionData.amount?.toString(),
      coinAmount: transactionData.coinAmount?.toString(),
      fiatAmount: transactionData.fiatAmount?.toString(),
      balanceBefore: transactionData.balanceBefore?.toString(),
      balanceAfter: transactionData.balanceAfter?.toString(),
    };

    try {
      const [newTransaction] = await db
        .insert(transactions)
        .values(valuesToInsert)
        .returning();

      logger.info(`Transaction created: ${newTransaction.id} for user: ${transactionData.userId}`);
      return newTransaction;
    } catch (error: any) {
        logger.error({
            message: 'Failed to create transaction record in database.',
            data: valuesToInsert,
            error: error.message,
        });
        throw new Error(`Create transaction error: ${error.message}`);
    }
  }

  async getTransactions(
    filters: TransactionFilters = {},
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const db = getDb();
      const conditions = [];
      if (filters.userId) conditions.push(eq(transactions.userId, filters.userId));
      if (filters.serviceId) conditions.push(eq(transactions.serviceId, filters.serviceId));
      if (filters.type) conditions.push(eq(transactions.type, filters.type));
      if (filters.status) conditions.push(eq(transactions.status, filters.status));
      if (filters.startDate) conditions.push(gte(transactions.createdAt, new Date(filters.startDate)));
      if (filters.endDate) conditions.push(lte(transactions.createdAt, new Date(filters.endDate)));
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(whereClause);
      
      const total = countResult[0]?.count || 0;

      const offset = (pagination.page - 1) * pagination.limit;
      const data = await db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(desc(transactions.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error: any) {
      logger.error('Get transactions error:', error.message);
      throw createError(error.message || 'Failed to get transactions', 500);
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const db = getDb();
      const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
      return transaction || null;
    } catch (error: any) {
      logger.error('Get transaction by ID error:', error.message);
      throw createError(error.message || 'Failed to get transaction', 500);
    }
  }

  async updateTransactionStatus(
    id: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      const db = getDb();
      const [updatedTransaction] = await db
        .update(transactions)
        .set({ status, metadata, updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning();
      if (!updatedTransaction) {
        throw createError('Transaction not found', 404);
      }
      logger.info(`Transaction status updated: ${id} -> ${status}`);
      return updatedTransaction;
    } catch (error: any) {
      logger.error('Update transaction status error:', error.message);
      throw createError(error.message || 'Failed to update transaction status', 500);
    }
  }

  async getUserTransactionHistory(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      return this.getTransactions({ userId }, pagination);
    } catch (error: any) {
      logger.error('Get user transaction history error:', error.message);
      throw createError(error.message || 'Failed to get user transaction history', 500);
    }
  }

  async getTransactionStats(userId?: string): Promise<any> {
    try {
      const db = getDb();
      const whereClause = userId ? eq(transactions.userId, userId) : undefined;
      const allTransactions = await db.select().from(transactions).where(whereClause);
      const stats = {
        total: allTransactions.length,
        completed: allTransactions.filter(t => t.status === 'completed').length,
        pending: allTransactions.filter(t => t.status === 'pending').length,
        failed: allTransactions.filter(t => t.status === 'failed').length,
        totalAmount: allTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + parseFloat(t.amount!), 0),
        byType: {
          coin_purchase: allTransactions.filter(t => t.type === 'coin_purchase').length,
          service_booking: allTransactions.filter(t => t.type === 'service_booking').length,
          coin_conversion: allTransactions.filter(t => t.type === 'coin_conversion').length,
          refund: allTransactions.filter(t => t.type === 'refund').length
        }
      };
      return stats;
    } catch (error: any) {
      logger.error('Get transaction stats error:', error.message);
      throw createError(error.message || 'Failed to get transaction stats', 500);
    }
  }
}