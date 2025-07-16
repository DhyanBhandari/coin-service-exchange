import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { PaymentService } from '../services/payment.service';
import { createApiResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';
import { number } from 'joi';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { amount, purpose, currency = 'INR', userLocation } = req.body;

    // Validate amount based on region
    const minAmount = userLocation?.isIndia ? 10 : 50; // Higher minimum for international
    const maxAmount = userLocation?.isIndia ? 500000 : 100000; // Different limits

    if (amount < minAmount || amount > maxAmount) {
      return res.status(400).json(
        createApiResponse(false, `Amount must be between ₹${minAmount} and ₹${maxAmount}`)
      );
    }

    const orderData = await this.paymentService.createPaymentOrder(
      req.user!.id.toString(),
      amount,
      purpose,
      currency,
      userLocation
    );

    res.status(201).json(
      createApiResponse(true, orderData, 'Payment order created successfully')
    );
  });

  verifyPayment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const verificationData = req.body;

    const result = await this.paymentService.verifyPayment(verificationData, req.user!.id.toString());

    res.json(
      createApiResponse(true, result, 'Payment verified successfully')
    );
  });

  handleWebhook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = req.body;

    try {
      await this.paymentService.handleWebhook(payload, signature);
      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(400).json({ status: 'error' });
    }
  });

  processRefund = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentId, amount, reason } = req.body;

    const result = await this.paymentService.processRefund(paymentId, amount, req.user!.id.toString(), reason);

    res.json(
      createApiResponse(true, result, 'Refund processed successfully')
    );
  });

  getPaymentMethods = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const methods = await this.paymentService.getUserPaymentMethods(req.user!.id.toString());

    res.json(
      createApiResponse(true, methods, 'Payment methods retrieved successfully')
    );
  });

  savePaymentMethod = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const methodData = req.body;

    const savedMethod = await this.paymentService.savePaymentMethod(req.user!.id.toString(), methodData);

    res.status(201).json(
      createApiResponse(true, 'Payment method saved successfully', savedMethod)
    );
  });

  deletePaymentMethod = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    await this.paymentService.deletePaymentMethod(req.user!.id.toString(), id);

    res.json(
      createApiResponse(true, 'Payment method deleted successfully')
    );
  });
}