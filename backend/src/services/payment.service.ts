// backend/src/services/payment.service.ts

import { paymentTransactions, users, paymentMethods, PaymentTransaction, NewPaymentTransaction } from '../models/schema';
import { getDb } from '../config/database';
import { eq, sql, and } from 'drizzle-orm';
import { PaymentOrderData, PaymentVerificationData } from '../types';
import { razorpay, razorpayConfig } from '../config/razorpay';
import { createError, generateOrderId } from '../utils/helpers';
import { PAYMENT_STATUS } from '../utils/constants';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from '../models/schema';

// A type alias for the Drizzle transaction object for cleaner code.
type Tx = PgTransaction<any, typeof schema, any>;



export class PaymentService {
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  /**
   * Creates a new payment order with Razorpay.
   */
  async createPaymentOrder(
    userId: string,
    amount: number,
    purpose: string = 'coin_purchase',
    currency: string = 'INR',
    userLocation?: any
  ): Promise<PaymentOrderData> {
    if (!userId || !amount || amount <= 0) {
      throw createError('Invalid userId or amount provided.', 400);
    }

    const db = getDb();
    logger.info({ message: `Creating payment order for user: ${userId}`, amount, purpose });

    try {
      const minAmount = userLocation?.isIndia ? razorpayConfig.minAmount : 50;
      const maxAmount = userLocation?.isIndia ? razorpayConfig.maxAmount : 100000;

      if (amount < minAmount || amount > maxAmount) {
        throw createError(`Amount must be between ${minAmount} and ${maxAmount} ${currency}.`, 400);
      }

      const receipt = generateOrderId();
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // Razorpay works in the smallest currency unit (paise).
        currency,
        receipt,
        notes: { userId, purpose },
      });

      const paymentTransaction: NewPaymentTransaction = {
        userId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount.toString(),
        currency,
        status: PAYMENT_STATUS.PENDING,
        paymentMethod: 'online',
        gateway: 'razorpay',
        metadata: { purpose, receipt, userLocation, razorpayOrderData: razorpayOrder },
      };

      const [newPaymentTransaction] = await db
        .insert(paymentTransactions)
        .values(paymentTransaction)
        .returning();

      logger.info(`Payment order ${razorpayOrder.id} created successfully for user ${userId}.`);

      return {
        orderId: razorpayOrder.id,
        amount,
        currency,
        receipt,
        paymentTransactionId: newPaymentTransaction.id,
        keyId: razorpayConfig.keyId,
      };
    } catch (error: any) {
      logger.error({
        message: `Failed to create payment order for user: ${userId}.`,
        error: error.message,
        stack: error.stack,
      });
      throw createError('Could not create payment order. Please try again later.', 500);
    }
  }

  /**
   * Verifies a payment and credits coins to the user's wallet in a single, atomic transaction.
   */
  async verifyPayment(
    verificationData: PaymentVerificationData,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;

    if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw createError('Missing required payment verification data.', 400);
    }

    logger.info(`Starting payment verification for order: ${razorpay_order_id}`);

    if (!this.verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      logger.warn(`Invalid payment signature for order: ${razorpay_order_id}`);
      throw createError('Invalid payment signature.', 400);
    }

    const db = getDb();

    const [existingPayment] = await db
      .select({ status: paymentTransactions.status })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.razorpayOrderId, razorpay_order_id));

    if (existingPayment?.status === PAYMENT_STATUS.COMPLETED) {
      logger.warn(`Attempted to re-verify an already completed payment: ${razorpay_order_id}`);
      return { success: true, message: 'This payment has already been verified.' };
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [paymentRecord] = await tx
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.razorpayOrderId, razorpay_order_id))
          .for('update')
          .limit(1);

        if (!paymentRecord) throw new Error('Payment record not found.');
        if (paymentRecord.userId !== userId) throw new Error('Payment does not belong to this user.');

        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        const amountToAdd = parseFloat(paymentRecord.amount!);

        const { balanceBefore, balanceAfter } = await this.userService.updateWalletBalance(userId, amountToAdd, 'add', tx);


        await tx
          .update(paymentTransactions)
          .set({
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: PAYMENT_STATUS.COMPLETED,
            gatewayResponse: paymentDetails,
            capturedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, paymentRecord.id));

        return { success: true };
      });

      logger.info(`Payment verified and coins credited for order: ${razorpay_order_id}`);
      return {
        success: true,
        message: 'Payment verified and coins added successfully.',
      };

    } catch (error: any) {
      logger.error({
        message: `Payment verification failed during database transaction. The transaction has been rolled back.`,
        orderId: razorpay_order_id,
        error: error.message,
      });
      throw createError('An error occurred while verifying your payment. Please contact support.', 500);
    }
  }

  private verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(body)
        .digest('hex');
      return expectedSignature === signature;
    } catch (error) {
      logger.error('Critical error during signature verification:', error);
      return false;
    }
  }

  /**
   * Processes a payment refund within a single, atomic transaction.
   */
  async processRefund(
    paymentId: string,
    amount?: number,
    adminId?: string,
    reason?: string
  ): Promise<PaymentTransaction> {
    if (!paymentId) {
      throw createError('Missing paymentId for refund.', 400);
    }

    const db = getDb();
    logger.info({ message: 'Starting refund process', paymentId, amount, adminId });

    try {
      return await db.transaction(async (tx) => {
        const [paymentTransaction] = await tx
          .select()
          .from(paymentTransactions)
          .where(eq(paymentTransactions.razorpayPaymentId, paymentId))
          .for('update')
          .limit(1);

        if (!paymentTransaction) throw new Error('Payment transaction not found.');
        if (paymentTransaction.status !== 'completed') throw new Error('Only completed transactions can be refunded.');

        const refundAmount = amount || parseFloat(paymentTransaction.amount!);
        if (refundAmount <= 0 || refundAmount > parseFloat(paymentTransaction.amount!)) {
          throw new Error('Invalid refund amount.');
        }

        const refund = await razorpay.payments.refund(paymentId, {
          amount: refundAmount * 100,
          notes: { reason: reason || 'Refund processed', processedBy: adminId || 'system' },
        });

        const { balanceBefore, balanceAfter } = await this.userService.updateWalletBalance(paymentTransaction.userId!, refundAmount, 'subtract', tx);


        const [updatedTransaction] = await tx
          .update(paymentTransactions)
          .set({
            refundId: refund.id,
            refundAmount: refundAmount.toString(),
            refundStatus: 'processed',
            refundReason: reason,
            refundedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, paymentTransaction.id))
          .returning();

        // ✅ CORRECTED: Pass the transaction object `tx` to the audit service.
        await this.auditService.log({
          userId: adminId || paymentTransaction.userId!,
          action: 'refund_processed',
          resource: 'payment',
          resourceId: paymentTransaction.id.toString(),
        }, tx);

        logger.info({ message: `Refund processed successfully`, refundId: refund.id, paymentId });
        return updatedTransaction;
      });
    } catch (error: any) {
      logger.error({ message: `Refund processing failed`, paymentId, error: error.message });
      throw createError(error.message || 'Failed to process refund.', 500);
    }
  }

  /**
   * Handles webhook events from Razorpay
   * @param payload The webhook payload
   * @param signature The webhook signature for verification
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    if (!payload || !signature) {
      throw createError('Missing webhook payload or signature', 400);
    }

    try {
      // Verify the webhook signature
      const isValid = this.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        logger.warn('Invalid webhook signature received');
        throw createError('Invalid webhook signature', 400);
      }

      // Process the webhook based on event type
      const event = payload.event;
      logger.info(`Processing webhook event: ${event}`);

      switch (event) {
        case 'payment.authorized':
          await this.handlePaymentAuthorized(payload.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload.payload.payment.entity);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(payload.payload.refund.entity);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event}`);
      }
    } catch (error: any) {
      logger.error('Webhook processing error:', error);
      throw createError(error.message || 'Failed to process webhook', 500);
    }
  }

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
      return methods.map((method) => ({
        ...method,
        details: this.sanitizePaymentMethodDetails(method.details),
      }));
    } catch (error: any) {
      logger.error('Get user payment methods error:', error.message);
      throw createError('Failed to get payment methods', 500);
    }
  }

  async savePaymentMethod(userId: string, methodData: any): Promise<any> {
    if (!userId || !methodData || !methodData.type || !methodData.provider) {
      throw createError('Invalid payment method data', 400);
    }
    try {
      const db = getDb();
      if (methodData.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
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
      await this.auditService.log({
        userId: userId,
        action: 'save_payment_method',
        resource: 'payment_method',
        resourceId: savedMethod.id,
      });
      return {
        ...savedMethod,
        details: this.sanitizePaymentMethodDetails(savedMethod.details),
      };
    } catch (error: any) {
      logger.error('Save payment method error:', error.message);
      throw createError('Failed to save payment method', 500);
    }
  }

  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    if (!userId || !methodId) {
      throw createError('Missing userId or methodId', 400);
    }
    try {
      const db = getDb();
      const result = await db
        .update(paymentMethods)
        .set({ isActive: false })
        .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.userId, userId)))
        .returning();
      if (result.length === 0) {
        throw createError('Payment method not found or does not belong to user.', 404);
      }
      await this.auditService.log({
        userId: userId,
        action: 'delete_payment_method',
        resource: 'payment_method',
        resourceId: methodId,
      });
    } catch (error: any) {
      logger.error('Delete payment method error:', error.message);
      throw createError(error.message || 'Failed to delete payment method', 500);
    }
  }

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
        failed: transactions.filter((t) => t.status === 'failed').length,
        pending: transactions.filter((t) => t.status === PAYMENT_STATUS.PENDING).length,
        totalAmount: transactions
          .filter((t) => t.status === PAYMENT_STATUS.COMPLETED)
          .reduce((sum, t) => sum + parseFloat(t.amount!), 0),
        averageAmount:
          transactions.length > 0
            ? transactions.reduce((sum, t) => sum + parseFloat(t.amount!), 0) /
            transactions.length
            : 0,
        paymentMethods: this.groupByPaymentMethod(transactions),
        regions: this.groupByRegion(transactions),
      };
      return stats;
    } catch (error: any) {
      logger.error('Get payment stats error:', error);
      throw createError(
        error instanceof Error ? error.message : 'Failed to get payment stats',
        500
      );
    }
  }

  private sanitizePaymentMethodDetails(details: any): any {
    if (!details) return null;
    const sanitized = { ...details };
    if (sanitized.cardNumber) {
      sanitized.last4 = sanitized.cardNumber.slice(-4);
      delete sanitized.cardNumber;
    }
    if (sanitized.cvv) delete sanitized.cvv;
    return sanitized;
  }

  private encryptPaymentMethodDetails(details: any): any {
    return details; // Placeholder for real encryption
  }

  private groupByPaymentMethod(transactions: any[]): any {
    return transactions.reduce((acc, transaction) => {
      const method = transaction.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByRegion(transactions: any[]): any {
    return transactions.reduce((acc, transaction) => {
      const region = transaction.metadata?.userLocation?.isIndia ? 'India' : 'International';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Verifies the webhook signature from Razorpay
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const body = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.webhookSecret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handles payment.authorized webhook event
   */
  private async handlePaymentAuthorized(payment: any): Promise<void> {
    const db = getDb();
    const paymentId = payment.id;
    const orderId = payment.order_id;

    try {
      const [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayOrderId, orderId));

      if (!transaction) {
        logger.warn(`No transaction found for order ID: ${orderId}`);
        return;
      }

      // If payment is already completed, don't process again
      if (transaction.status === PAYMENT_STATUS.COMPLETED) {
        logger.info(`Payment already marked as completed for order: ${orderId}`);
        return;
      }

      // Update transaction status
      await db
        .update(paymentTransactions)
        .set({
          razorpayPaymentId: paymentId,
          status: PAYMENT_STATUS.COMPLETED,
          gatewayResponse: payment,
          capturedAt: new Date(),
        })
        .where(eq(paymentTransactions.razorpayOrderId, orderId));

      // Credit user's wallet
      const amountToAdd = parseFloat(transaction.amount!);
      await this.userService.updateWalletBalance(transaction.userId!, amountToAdd, 'add');

      logger.info(`Payment completed via webhook for order: ${orderId}`);
    } catch (error) {
      logger.error(`Failed to process payment.authorized webhook for payment: ${paymentId}`, error);
    }
  }

  /**
   * Handles payment.failed webhook event
   */
  private async handlePaymentFailed(payment: any): Promise<void> {
    const db = getDb();
    const paymentId = payment.id;
    const orderId = payment.order_id;

    try {
      await db
        .update(paymentTransactions)
        .set({
          razorpayPaymentId: paymentId,
          status: 'failed',
          gatewayResponse: payment,
          failureReason: payment.error_description || 'Payment failed',
          updatedAt: new Date(), // Use updatedAt instead of failedAt
        })
        .where(eq(paymentTransactions.razorpayOrderId, orderId));

      logger.info(`Payment marked as failed via webhook for order: ${orderId}`);
    } catch (error) {
      logger.error(`Failed to process payment.failed webhook for payment: ${paymentId}`, error);
    }
  }

  /**
   * Handles refund.processed webhook event
   */
  private async handleRefundProcessed(refund: any): Promise<void> {
    const db = getDb();
    const refundId = refund.id;
    const paymentId = refund.payment_id;

    try {
      await db
        .update(paymentTransactions)
        .set({
          refundId: refundId,
          refundAmount: (refund.amount / 100).toString(),
          refundStatus: 'completed',
          refundedAt: new Date(),
        })
        .where(eq(paymentTransactions.razorpayPaymentId, paymentId));

      logger.info(`Refund marked as completed via webhook for payment: ${paymentId}`);
    } catch (error) {
      logger.error(`Failed to process refund.processed webhook for refund: ${refundId}`, error);
    }
  }
}