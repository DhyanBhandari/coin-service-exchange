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
  purpose: Joi.string().valid('coin_purchase', 'service_booking').optional(),
  currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
  userLocation: Joi.object({
    country: Joi.string(),
    countryCode: Joi.string(),
    isIndia: Joi.boolean()
  }).optional()
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  userLocation: Joi.object({
    country: Joi.string(),
    countryCode: Joi.string(),
    isIndia: Joi.boolean()
  }).optional()
});

const refundSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().min(1).optional(),
  reason: Joi.string().max(500).optional()
});

const savePaymentMethodSchema = Joi.object({
  type: Joi.string().valid('card', 'upi', 'wallet', 'netbanking').required(),
  provider: Joi.string().required(),
  details: Joi.object().required(),
  isDefault: Joi.boolean().default(false)
});

// Routes
router.post('/orders', authenticateToken, requireUser, validateBody(createOrderSchema), paymentController.createOrder);
router.post('/verify', authenticateToken, requireUser, validateBody(verifyPaymentSchema), paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); // No auth for webhooks
router.post('/refund', authenticateToken, requireAdmin, validateBody(refundSchema), paymentController.processRefund);

// Payment methods management
router.get('/methods', authenticateToken, paymentController.getPaymentMethods);
router.post('/methods', authenticateToken, validateBody(savePaymentMethodSchema), paymentController.savePaymentMethod);
router.delete('/methods/:id', authenticateToken, paymentController.deletePaymentMethod);

export default router;