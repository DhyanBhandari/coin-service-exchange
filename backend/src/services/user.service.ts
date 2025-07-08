import { db } from '@/config/database';
import { users, transactions } from '@/models/schema';
import { eq, desc } from 'drizzle-orm';
import { AppError, generateOrderId } from '@/utils/helpers';
import { User, Transaction } from '@/types';
import { TRANSACTION_TYPES, TRANSACTION_STATUS, MIN_COIN_PURCHASE } from '@/utils/constants';

export class UserService {
  async getUserProfile(userId: string): Promise<User> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser as User;
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser as User;
  }

  async addCoins(
    userId: string,
    amount: number,
    paymentMethod: string
  ): Promise<{ transaction: Transaction; newBalance: number }> {
    if (amount < MIN_COIN_PURCHASE) {
      throw new AppError(`Minimum purchase amount is ${MIN_COIN_PURCHASE} coins`, 400);
    }

    // Start transaction
    return await db.transaction(async (tx) => {
      // Get current user
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Create transaction record
      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId,
          type: TRANSACTION_TYPES.COIN_PURCHASE,
          amount: amount.toString(),
          status: TRANSACTION_STATUS.COMPLETED,
          description: `Coin purchase via ${paymentMethod}`,
          metadata: {
            paymentMethod,
            orderId: generateOrderId()
          }
        })
        .returning();

      // Update user wallet balance
      const newBalance = parseFloat(user.walletBalance) + amount;
      
      await tx
        .update(users)
        .set({
          walletBalance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { transaction: transaction as Transaction, newBalance };
    });
  }

  async getWalletBalance(userId: string): Promise<number> {
    const [user] = await db
      .select({ walletBalance: users.walletBalance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return parseFloat(user.walletBalance);
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const offset = (page - 1) * limit;

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    return {
      transactions: userTransactions as Transaction[],
      total: count
    };
  }
// Add this method to the existing UserService class

async addCoinsAfterPayment(
  userId: string,
  amount: number,
  paymentId: string
): Promise<{ transaction: Transaction; newBalance: number }> {
  return await db.transaction(async (tx) => {
    // Get current user
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Create transaction record
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: amount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Coin purchase via Razorpay`,
        metadata: {
          paymentId,
          paymentMethod: 'razorpay'
        }
      })
      .returning();

    // Update user wallet balance
    const newBalance = parseFloat(user.walletBalance) + amount;
    
    await tx
      .update(users)
      .set({
        walletBalance: newBalance.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return { transaction: transaction as Transaction, newBalance };
  });
}
  async deductCoins(userId: string, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      if (currentBalance < amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      const newBalance = currentBalance - amount;

      await tx
        .update(users)
        .set({
          walletBalance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    });
  }
}