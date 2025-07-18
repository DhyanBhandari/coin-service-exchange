// backend/src/services/payment.service.ts - Fixed UUID handling
import { paymentTransactions, transactions, users, paymentMethods } from '../models/schema';
import { getDb } from '../config/database';
import { eq, and } from 'drizzle-orm'; // Corrected import path
import { PaymentTransaction, NewPaymentTransaction } from '../models/schema';
import { razorpay, razorpayConfig } from '../config/razorpay';
import { createError, generateOrderId } from '../utils/helpers';
import { PAYMENT_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '../utils/constants';
import { PaymentOrderData, PaymentVerificationData } from '../types';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class PaymentService {
  private transactionService: TransactionService;
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.transactionService = new TransactionService();
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  /**
   * Create a new payment order - FIXED for UUID handling
   */
  async createPaymentOrder(
    userId: string, // This is already a UUID string
    amount: number,
    purpose: string = 'coin_purchase',
    currency: string = 'INR',
    userLocation?: any
  ): Promise<PaymentOrderData> {
    if (!userId || !amount || amount <= 0) {
      throw createError('Invalid userId or amount', 400);
    }

    try {
      const db = getDb();

      // Validate amount based on region
      const minAmount = userLocation?.isIndia ? razorpayConfig.minAmount : 50;
      const maxAmount = userLocation?.isIndia ? razorpayConfig.maxAmount : 100000;

      if (amount < minAmount || amount > maxAmount) {
        throw createError(
          `Amount must be between ${minAmount} and ${maxAmount} ${currency}`,
          400
        );
      }

      // Create Razorpay order
      const receipt = generateOrderId();
      const orderData: any = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
        notes: {
          userId,
          purpose,
          userRegion: userLocation?.isIndia ? 'IN' : 'INTL',
          userCountry: userLocation?.countryCode || 'XX',
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderData);

      // Create payment transaction record - FIXED: Don't parseInt UUID
      const paymentTransaction: NewPaymentTransaction = {
        userId: userId, // Keep as UUID string, don't parseInt!
        razorpayOrderId: razorpayOrder.id,
        amount: amount.toString(),
        currency,
        status: PAYMENT_STATUS.PENDING,
        paymentMethod: 'online',
        gateway: 'razorpay',
        metadata: {
          purpose,
          receipt,
          userLocation,
          razorpayOrderData: razorpayOrder,
        },
      };

      const [newPaymentTransaction] = await db
        .insert(paymentTransactions)
        .values(paymentTransaction)
        .returning();

      logger.info(
        `Payment order created: ${razorpayOrder.id} for user: ${userId}`
      );

      return {
        orderId: razorpayOrder.id,
        amount,
        currency,
        receipt,
        paymentTransactionId: newPaymentTransaction.id,
        keyId: razorpayConfig.keyId,
      };
    } catch (error) {
      logger.error('Create payment order error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to create payment order',
        500
      );
    }
  }

  /**
   * Verify payment - FIXED for UUID handling
   */
  async verifyPayment(
    verificationData: PaymentVerificationData & { userLocation?: any },
    userId: string // This is already a UUID string
  ): Promise<PaymentTransaction> {
    if (!userId || !verificationData.razorpay_order_id || !verificationData.razorpay_payment_id) {
      throw createError('Missing required verification data', 400);
    }

    try {
      const db = getDb();
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userLocation } =
        verificationData;

      // Verify signature
      const isSignatureValid = this.verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isSignatureValid) {
        throw createError('Invalid payment signature', 400);
      }

      // Get payment transaction
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayOrderId, razorpay_order_id))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      // Check if the payment belongs to the user - FIXED: Compare UUID strings
      if (paymentTransaction.userId !== userId) {
        throw createError('Unauthorized to verify this payment', 403);
      }

      // Fetch payment details from Razorpay
      let paymentDetails: any;
      try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      } catch (error) {
        logger.error(`Failed to fetch payment details for ${razorpay_payment_id}:`, error);
        throw createError('Failed to fetch payment details', 500);
      }

      // Update payment transaction
      const [updatedPaymentTransaction] = await db
        .update(paymentTransactions)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: PAYMENT_STATUS.COMPLETED,
          gatewayResponse: paymentDetails || null,
          capturedAt: new Date(),
          metadata: {
            ...(paymentTransaction.metadata || {}),
            paymentDetails,
            verificationTimestamp: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id))
        .returning();

      // Create transaction record - FIXED: Keep userId as UUID string
      const amount = parseFloat(paymentTransaction.amount);
      const transactionData = {
        userId: userId, // Keep as UUID string
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: amount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Coin purchase via payment: ${razorpay_payment_id}`,
        paymentId: razorpay_payment_id,
        paymentMethod: paymentDetails?.method || 'unknown',
        metadata: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          paymentMethod: paymentDetails?.method || undefined,
          userLocation,
          gatewayFee: paymentDetails?.fee || 0,
        },
      };

      await this.transactionService.createTransaction(transactionData);

      // Update user wallet balance
      await this.userService.updateWalletBalance(userId, amount.toString(), 'add');

      // Log audit - FIXED: Use userId as string
      await this.auditService.log({
        userId: userId,
        action: 'payment_completed',
        resource: 'payment',
        resourceId: paymentTransaction.id.toString(),
        newValues: { 
          status: PAYMENT_STATUS.COMPLETED, 
          amount: amount,
          paymentId: razorpay_payment_id
        },
      });

      logger.info(
        `Payment verified successfully: ${razorpay_payment_id} for user: ${userId}`
      );
      return updatedPaymentTransaction;
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to verify payment',
        error instanceof Error && error.message.includes('404') ? 404 : 500
      );
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  private verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) {
      logger.warn('Missing parameters for signature verification');
      return false;
    }

    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }

  // Add other methods as needed...


  /**
   * Process payment refund
   */
  async processRefund(
    paymentId: string,
    amount?: number,
    adminId?: string,
    reason?: string
  ): Promise<PaymentTransaction> {
    if (!paymentId) {
      throw createError('Missing paymentId', 400);
    }

    try {
      const db = getDb();

      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayPaymentId, paymentId))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      const refundAmount = amount || parseFloat(paymentTransaction.amount);
      if (refundAmount <= 0 || refundAmount > parseFloat(paymentTransaction.amount)) {
        throw createError('Invalid refund amount', 400);
      }

      // Create refund with Razorpay
      const refund = await razorpay.payments.refund(paymentId, {
        amount: refundAmount * 100, // Convert to paise
        notes: {
          reason: reason || 'Customer requested refund',
          processedBy: adminId || 'system',
        },
      });

      // Update payment transaction
      const [updatedTransaction] = await db
        .update(paymentTransactions)
        .set({
          refundId: refund.id,
          refundAmount: refundAmount.toString(),
          refundStatus: 'processed',
          refundReason: reason,
          refundedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id))
        .returning();

      // Deduct amount from user wallet
      await this.userService.updateWalletBalance(
        paymentTransaction.userId.toString(),
        refundAmount.toString(),
        'subtract'
      );

      // Create refund transaction record
      await this.transactionService.createTransaction({
        userId: paymentTransaction.userId.toString(),

        type: TRANSACTION_TYPES.REFUND,
        amount: refundAmount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Refund for payment: ${paymentId}`,
        paymentId: refund.id,
        paymentMethod: 'razorpay_refund',
        metadata: {
          originalPaymentId: paymentId,
          refundId: refund.id,
          reason,
        },
      });

      // Log audit
      await this.auditService.log({
        userId: adminId ? adminId : paymentTransaction.userId.toString(),
        action: 'refund_processed',
        resource: 'payment',
        resourceId: paymentTransaction.id.toString(),
        newValues: {
          refundAmount,
          refundId: refund.id,
          reason,
        },
      });

      logger.info(`Refund processed: ${refund.id} for payment: ${paymentId}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('Process refund error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to process refund',
        error instanceof Error && error.message.includes('404') ? 404 : 500
      );
    }
  }

  /**
   * Get user's saved payment methods
   */
  async getUserPaymentMethods(userId: string): Promise<any[]> {
    if (!userId) {
      throw createError('Missing userId', 400);
    }

    try {
      const db = getDb();

      const methods = await db
        .select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)));

      // Sanitize sensitive data before returning
      return methods.map((method) => ({
        ...method,
        details: this.sanitizePaymentMethodDetails(method.details),
      }));
    } catch (error) {
      logger.error('Get user payment methods error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to get payment methods',
        500
      );
    }
  }

  /**
   * Save a new payment method for user
   */
  async savePaymentMethod(userId: string, methodData: any): Promise<any> {
    if (!userId || !methodData || !methodData.type || !methodData.provider) {
      throw createError('Invalid payment method data', 400);
    }

    try {
      const db = getDb();

      // If this is set as default, unset other defaults
      if (methodData.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(paymentMethods.userId, userId));
      }

      const [savedMethod] = await db
        .insert(paymentMethods)
        .values({
          userId: userId,
          ...methodData,
          details: this.encryptPaymentMethodDetails(methodData.details),
        })
        .returning();

      // Log audit
      await this.auditService.log({
        userId: userId,
        action: 'save_payment_method',
        resource: 'payment_method',
        resourceId: savedMethod.id,
        newValues: {
          type: methodData.type,
          provider: methodData.provider,
        },
      });

      return {
        ...savedMethod,
        details: this.sanitizePaymentMethodDetails(savedMethod.details),
      };
    } catch (error) {
      logger.error('Save payment method error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to save payment method',
        500
      );
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    if (!userId || !methodId) {
      throw createError('Missing userId or methodId', 400);
    }

    try {
      const db = getDb();

      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.userId, userId)))
        .limit(1);

      if (!existingMethod) {
        throw createError('Payment method not found', 404);
      }

      await db
        .update(paymentMethods)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.userId, userId)));

      // Log audit
      await this.auditService.log({
        userId: userId,
        action: 'delete_payment_method',
        resource: 'payment_method',
        resourceId: methodId,
      });
    } catch (error) {
      logger.error('Delete payment method error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to delete payment method',
        error instanceof Error && error.message.includes('404') ? 404 : 500
      );
    }
  }

  /**
   * Get payment statistics for analytics
   */
  async getPaymentStats(userId?: string): Promise<any> {
    try {
      const db = getDb();

      const whereClause = userId ? eq(paymentTransactions.userId, userId) : undefined;

      const transactions = await db
        .select()
        .from(paymentTransactions)
        .where(whereClause);

      const stats = {
        total: transactions.length,
        completed: transactions.filter((t) => t.status === PAYMENT_STATUS.COMPLETED).length,
        failed: transactions.filter((t) => t.status === PAYMENT_STATUS.FAILED).length,
        pending: transactions.filter((t) => t.status === PAYMENT_STATUS.PENDING).length,
        totalAmount: transactions
          .filter((t) => t.status === PAYMENT_STATUS.COMPLETED)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        averageAmount:
          transactions.length > 0
            ? transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) /
              transactions.length
            : 0,
        paymentMethods: this.groupByPaymentMethod(transactions),
        regions: this.groupByRegion(transactions),
      };

      return stats;
    } catch (error) {
      logger.error('Get payment stats error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to get payment stats',
        500
      );
    }
  }

  /**
   * Sanitize payment method details for API response
   */
  private sanitizePaymentMethodDetails(details: any): any {
    if (!details) return details;

    const sanitized = { ...details };

    // Remove sensitive fields
    if (sanitized.cardNumber) {
      sanitized.last4 = sanitized.cardNumber.slice(-4);
      delete sanitized.cardNumber;
    }

    if (sanitized.cvv) {
      delete sanitized.cvv;
    }

    return sanitized;
  }

  /**
   * Encrypt sensitive payment method details
   */
  private encryptPaymentMethodDetails(details: any): any {
    // In production, implement proper encryption (e.g., using a library like node-jose)
    // For now, return sanitized details
    return this.sanitizePaymentMethodDetails(details);
  }

  /**
   * Group transactions by payment method
   */
  private groupByPaymentMethod(transactions: any[]): any {
    return transactions.reduce((acc, transaction) => {
      const method = transaction.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group transactions by region
   */
  private groupByRegion(transactions: any[]): any {
    return transactions.reduce((acc, transaction) => {
      const region = transaction.metadata?.userLocation?.isIndia ? 'India' : 'International';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});
  }
}