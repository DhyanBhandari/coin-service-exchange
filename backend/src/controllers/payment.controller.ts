import { Response } from 'express';
import { PaymentService } from '@/services/payment.service';
import { UserService } from '@/services/user.service';
import { createApiResponse, AppError, calculatePagination } from '@/utils/helpers';
import { AuthRequest } from '@/types';

export class PaymentController {
  private paymentService: PaymentService;
  private userService: UserService;

  constructor() {
    this.paymentService = new PaymentService();
    this.userService = new UserService();
  }

  createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { amount, currency = 'INR', purpose = 'coin_purchase' } = req.body;

      if (amount < 10) {
        res.status(400).json(
          createApiResponse(false, 'Minimum amount is ₹10')
        );
        return;
      }

      const order = await this.paymentService.createRazorpayOrder(
        userId,
        amount,
        currency,
        purpose
      );

      res.status(200).json(
        createApiResponse(true, 'Payment order created successfully', order)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        amount,
        purpose = 'coin_purchase'
      } = req.body;

      const verification = await this.paymentService.verifyPayment(
        { razorpay_order_id, razorpay_payment_id, razorpay_signature },
        userId
      );

      if (!verification.isValid) {
        res.status(400).json(
          createApiResponse(false, 'Payment verification failed')
        );
        return;
      }

      // If payment is for coin purchase, add coins to wallet
      if (purpose === 'coin_purchase' && verification.paymentTransaction?.status === 'completed') {
        const coinAmount = parseFloat(verification.paymentTransaction.amount);
        await this.userService.addCoinsAfterPayment(userId, coinAmount, razorpay_payment_id);
      }

      res.status(200).json(
        createApiResponse(true, 'Payment verified successfully', {
          verified: true,
          paymentTransaction: verification.paymentTransaction
        })
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  getPaymentMethods = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const methods = await this.paymentService.getUserPaymentMethods(userId);

      res.status(200).json(
        createApiResponse(true, 'Payment methods retrieved successfully', methods)
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  setDefaultPaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { paymentMethodId } = req.params;

      await this.paymentService.setDefaultPaymentMethod(userId, paymentMethodId);

      res.status(200).json(
        createApiResponse(true, 'Default payment method updated successfully')
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  deletePaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { paymentMethodId } = req.params;

      await this.paymentService.deletePaymentMethod(userId, paymentMethodId);

      res.status(200).json(
        createApiResponse(true, 'Payment method deleted successfully')
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const { payments, total } = await this.paymentService.getPaymentHistory(
        userId,
        Number(page),
        Number(limit)
      );

      const pagination = calculatePagination(Number(page), Number(limit), total);

      res.status(200).json(
        createApiResponse(true, 'Payment history retrieved successfully', {
          payments,
          pagination
        })
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const payload = req.body;

      await this.paymentService.handleWebhook(payload, signature);

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  };
}