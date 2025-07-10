import { db } from '@/config/database';
import { paymentTransactions, transactions, users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { PaymentTransaction, NewPaymentTransaction } from '@/models/schema';
import { razorpay, razorpayConfig } from '@/config/razorpay';
import { createError, generateOrderId } from '@/utils/helpers';
import { PAYMENT_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/utils/constants';
import { PaymentOrderData, PaymentVerificationData } from '@/types';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';
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

  async createPaymentOrder(
    userId: string,
    amount: number,
    purpose: string = 'coin_purchase'
  ): Promise<PaymentOrderData> {
    try {
      # Validate amount
      if (amount < razorpayConfig.minAmount || amount > razorpayConfig.maxAmount) {
        throw createError(
          `Amount must be between ${razorpayConfig.minAmount} and ${razorpayConfig.maxAmount}`,
          400
        );
      }

      # Create Razorpay order
      const receipt = generateOrderId();
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, # Razorpay expects amount in paise
        currency: razorpayConfig.currency,
        receipt,
        notes: {
          userId,
          purpose
        }
      });

      # Create payment transaction record
      const paymentTransaction: NewPaymentTransaction = {
        userId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount.toString(),
        currency: razorpayConfig.currency,
        status: PAYMENT_STATUS.PENDING,
        paymentMethod: 'online',
        gateway: 'razorpay',
        metadata: {
          purpose,
          receipt
        }
      };

      const [newPaymentTransaction] = await db
        .insert(paymentTransactions)
        .values(paymentTransaction)
        .returning();

      logger.info(`Payment order created: ${razorpayOrder.id} for user: ${userId}`);

      return {
        orderId: razorpayOrder.id,
        amount,
        currency: razorpayConfig.currency,
        receipt,
        paymentTransactionId: newPaymentTransaction.id,
        keyId: razorpayConfig.keyId
      };
    } catch (error) {
      logger.error('Create payment order error:', error);
      throw error;
    }
  }

  async verifyPayment(
    verificationData: PaymentVerificationData,
    userId: string
  ): Promise<PaymentTransaction> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;

      # Verify signature
      const isSignatureValid = this.verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isSignatureValid) {
        throw createError('Invalid payment signature', 400);
      }

      # Get payment transaction
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayOrderId, razorpay_order_id))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      if (paymentTransaction.userId !== userId) {
        throw createError('Unauthorized payment verification', 403);
      }

      # Update payment transaction
      const [updatedPaymentTransaction] = await db
        .update(paymentTransactions)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: PAYMENT_STATUS.COMPLETED,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id))
        .returning();

      # Create transaction record
      const amount = parseFloat(paymentTransaction.amount);
      await this.transactionService.createTransaction({
        userId,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: amount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Coin purchase via payment: ${razorpay_payment_id}`,
        paymentId: razorpay_payment_id,
        paymentMethod: 'razorpay',
        metadata: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id
        }
      });

      # Update user wallet balance
      await this.userService.updateWalletBalance(userId, amount.toString(), 'add');

      # Log audit
      await this.auditService.log({
        userId,
        action: 'payment_completed',
        resource: 'payment',
        resourceId: paymentTransaction.id,
        newValues: { status: PAYMENT_STATUS.COMPLETED, amount },
        metadata: { paymentId: razorpay_payment_id }
      });

      logger.info(`Payment verified successfully: ${razorpay_payment_id} for user: ${userId}`);
      return updatedPaymentTransaction;
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw error;
    }
  }

  async handlePaymentFailure(
    orderId: string,
    reason: string
  ): Promise<void> {
    try {
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayOrderId, orderId))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      await db
        .update(paymentTransactions)
        .set({
          status: PAYMENT_STATUS.FAILED,
          failureReason: reason,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id));

      # Log audit
      await this.auditService.log({
        userId: paymentTransaction.userId,
        action: 'payment_failed',
        resource: 'payment',
        resourceId: paymentTransaction.id,
        newValues: { status: PAYMENT_STATUS.FAILED, reason }
      });

      logger.warn(`Payment failed: ${orderId} - ${reason}`);
    } catch (error) {
      logger.error('Handle payment failure error:', error);
      throw error;
    }
  }

  private verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = orderId + '|' + paymentId;
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

  async processRefund(
    paymentId: string,
    amount?: number,
    adminId?: string
  ): Promise<PaymentTransaction> {
    try {
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayPaymentId, paymentId))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      const refundAmount = amount || parseFloat(paymentTransaction.amount);
      
      # Create refund with Razorpay
      const refund = await razorpay.payments.refund(paymentId, {
        amount: refundAmount * 100, # Convert to paise
        notes: {
          reason: 'Customer requested refund',
          processedBy: adminId || 'system'
        }
      });

      # Update payment transaction
      const [updatedTransaction] = await db
        .update(paymentTransactions)
        .set({
          refundId: refund.id,
          refundAmount: refundAmount.toString(),
          refundStatus: 'processed',
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id))
        .returning();

      # Deduct amount from user wallet
      await this.userService.updateWalletBalance(
        paymentTransaction.userId,
        refundAmount.toString(),
        'subtract'
      );

      # Create refund transaction record
      await this.transactionService.createTransaction({
        userId: paymentTransaction.userId,
        type: TRANSACTION_TYPES.REFUND,
        amount: refundAmount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Refund for payment: ${paymentId}`,
        paymentId: refund.id,
        paymentMethod: 'razorpay_refund',
        metadata: {
          originalPaymentId: paymentId,
          refundId: refund.id
        }
      });

      logger.info(`Refund processed: ${refund.id} for payment: ${paymentId}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('Process refund error:', error);
      throw error;
    }
  }
}
