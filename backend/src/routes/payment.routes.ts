import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireUser, requireAdmin } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const paymentController = new PaymentController();

// Validation schemas
const createOrderSchema = Joi.object({
  amount: Joi.number().min(10).max(1000000).required(),
  purpose: Joi.string().valid('coin_purchase', 'service_booking').optional()
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
});

const refundSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().min(1).optional()
});

// Routes
router.post('/orders', authenticateToken, requireUser, validateBody(createOrderSchema), paymentController.createOrder);
router.post('/verify', authenticateToken, requireUser, validateBody(verifyPaymentSchema), paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); // No auth for webhooks
router.post('/refund', authenticateToken, requireAdmin, validateBody(refundSchema), paymentController.processRefund);

export default router;
