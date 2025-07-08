import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@/config/database';
import { paymentTransactions, paymentMethods, transactions, users } from '@/models/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AppError, generateOrderId } from '@/utils/helpers';

export interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createRazorpayOrder(
    userId: string,
    amount: number,
    currency: string = 'INR',
    purpose: string = 'coin_purchase'
  ): Promise<any> {
    try {
      const receipt = `${purpose}_${generateOrderId()}`;
      
      const orderOptions: RazorpayOrderOptions = {
        amount: amount * 100, // Razorpay expects amount in paisa
        currency,
        receipt,
        notes: {
          userId,
          purpose,
          timestamp: new Date().toISOString()
        }
      };

      const order = await this.razorpay.orders.create(orderOptions);

      // Store payment transaction record
      const [paymentTransaction] = await db
        .insert(paymentTransactions)
        .values({
          userId,
          razorpayOrderId: order.id,
          amount: amount.toString(),
          currency,
          status: 'pending',
          paymentMethod: 'unknown',
          provider: 'razorpay',
          gateway: 'razorpay',
          metadata: {
            purpose,
            receipt,
            orderOptions
          }
        })
        .returning();

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        paymentTransactionId: paymentTransaction.id,
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new AppError('Failed to create payment order', 500);
    }
  }

  async verifyPayment(
    paymentData: PaymentVerificationData,
    userId: string
  ): Promise<{ isValid: boolean; paymentTransaction?: any }> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Verify signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isSignatureValid = generatedSignature === razorpay_signature;

      // Get payment transaction
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(
          and(
            eq(paymentTransactions.razorpayOrderId, razorpay_order_id),
            eq(paymentTransactions.userId, userId)
          )
        )
        .limit(1);

      if (!paymentTransaction) {
        throw new AppError('Payment transaction not found', 404);
      }

      if (isSignatureValid) {
        // Fetch payment details from Razorpay
        const paymentDetails = await this.razorpay.payments.fetch(razorpay_payment_id);

        // Update payment transaction
        const [updatedTransaction] = await db
          .update(paymentTransactions)
          .set({
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: paymentDetails.status === 'captured' ? 'completed' : 'processing',
            paymentMethod: paymentDetails.method,
            provider: this.getPaymentProvider(paymentDetails),
            gatewayResponse: paymentDetails,
            updatedAt: new Date()
          })
          .where(eq(paymentTransactions.id, paymentTransaction.id))
          .returning();

        // Save payment method if it's new
        if (paymentDetails.status === 'captured') {
          await this.savePaymentMethod(userId, paymentDetails);
        }

        return {
          isValid: true,
          paymentTransaction: updatedTransaction
        };
      } else {
        // Update failed payment
        await db
          .update(paymentTransactions)
          .set({
            status: 'failed',
            failureReason: 'Invalid signature',
            updatedAt: new Date()
          })
          .where(eq(paymentTransactions.id, paymentTransaction.id));

        return { isValid: false };
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw new AppError('Payment verification failed', 500);
    }
  }

  private getPaymentProvider(paymentDetails: any): string {
    switch (paymentDetails.method) {
      case 'upi':
        if (paymentDetails.upi?.vpa?.includes('paytm')) return 'paytm';
        if (paymentDetails.upi?.vpa?.includes('google')) return 'gpay';
        return 'upi';
      case 'wallet':
        return paymentDetails.wallet || 'wallet';
      case 'card':
        return paymentDetails.card?.network || 'card';
      case 'netbanking':
        return paymentDetails.bank || 'netbanking';
      default:
        return paymentDetails.method || 'unknown';
    }
  }

  private async savePaymentMethod(userId: string, paymentDetails: any): Promise<void> {
    try {
      let details: any = {};
      let type = paymentDetails.method;
      let provider = this.getPaymentProvider(paymentDetails);

      switch (paymentDetails.method) {
        case 'card':
          details = {
            last4: paymentDetails.card?.last4,
            cardType: paymentDetails.card?.type,
            holderName: paymentDetails.card?.name
          };
          break;
        case 'upi':
          details = {
            upiId: paymentDetails.upi?.vpa
          };
          break;
        case 'wallet':
          details = {
            walletProvider: paymentDetails.wallet
          };
          break;
      }

      // Check if this payment method already exists
      const existingMethod = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.userId, userId),
            eq(paymentMethods.type, type),
            eq(paymentMethods.provider, provider)
          )
        )
        .limit(1);

      if (existingMethod.length === 0) {
        await db
          .insert(paymentMethods)
          .values({
            userId,
            type,
            provider,
            details,
            isDefault: false,
            isActive: true
          });
      }
    } catch (error) {
      console.error('Failed to save payment method:', error);
      // Don't throw error as this is not critical for payment completion
    }
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    const methods = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.isActive, true)
        )
      )
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

    return methods;
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove default from all methods
      await tx
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, userId));

      // Set new default
      await tx
        .update(paymentMethods)
        .set({ isDefault: true })
        .where(
          and(
            eq(paymentMethods.id, paymentMethodId),
            eq(paymentMethods.userId, userId)
          )
        );
    });
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await db
      .update(paymentMethods)
      .set({ isActive: false })
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, userId)
        )
      );
  }

  async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ payments: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const payments = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, userId));

    return {
      payments,
      total: count
    };
  }

  async initiateRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      const refundData: any = {
        payment_id: paymentId,
        notes: {
          reason: reason || 'Customer request',
          timestamp: new Date().toISOString()
        }
      };

      if (amount) {
        refundData.amount = amount * 100; // Convert to paisa
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundData);

      // Update payment transaction with refund details
      await db
        .update(paymentTransactions)
        .set({
          refundId: refund.id,
          refundAmount: amount ? amount.toString() : undefined,
          refundStatus: 'pending',
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.razorpayPaymentId, paymentId));

      return refund;
    } catch (error) {
      console.error('Refund initiation failed:', error);
      throw new AppError('Failed to initiate refund', 500);
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new AppError('Invalid webhook signature', 400);
      }

      const { event, payload: eventPayload } = payload;

      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(eventPayload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(eventPayload.payment.entity);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(eventPayload.refund.entity);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  private async handlePaymentCaptured(payment: any): Promise<void> {
    await db
      .update(paymentTransactions)
      .set({
        status: 'completed',
        gatewayResponse: payment,
        updatedAt: new Date()
      })
      .where(eq(paymentTransactions.razorpayPaymentId, payment.id));
  }

  private async handlePaymentFailed(payment: any): Promise<void> {
    await db
      .update(paymentTransactions)
      .set({
        status: 'failed',
        failureReason: payment.error_description,
        gatewayResponse: payment,
        updatedAt: new Date()
      })
      .where(eq(paymentTransactions.razorpayPaymentId, payment.id));
  }

  private async handleRefundProcessed(refund: any): Promise<void> {
    await db
      .update(paymentTransactions)
      .set({
        refundStatus: 'processed',
        updatedAt: new Date()
      })
      .where(eq(paymentTransactions.refundId, refund.id));
  }
}