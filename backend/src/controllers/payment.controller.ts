import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { PaymentService } from '@/services/payment.service';
import { createApiResponse } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { amount, purpose } = req.body;

    const orderData = await this.paymentService.createPaymentOrder(
      req.user!.id,
      amount,
      purpose
    );

    res.status(201).json(
      createApiResponse(true, 'Payment order created successfully', orderData)
    );
  });

  verifyPayment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const verificationData = req.body;

    const result = await this.paymentService.verifyPayment(verificationData, req.user!.id);

    res.json(
      createApiResponse(true, 'Payment verified successfully', result)
    );
  });

  handleWebhook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { event, payload } = req.body;

    # Handle different webhook events
    switch (event) {
      case 'payment.failed':
        await this.paymentService.handlePaymentFailure(
          payload.order.id,
          payload.error.description
        );
        break;
      # Add more webhook event handlers as needed
    }

    res.json({ status: 'ok' });
  });

  processRefund = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentId, amount } = req.body;

    const result = await this.paymentService.processRefund(paymentId, amount, req.user!.id);

    res.json(
      createApiResponse(true, 'Refund processed successfully', result)
    );
  });
}
