import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { validateBody } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import Joi from 'joi';

const router = Router();
const paymentController = new PaymentController();

const paymentValidation = {
  createOrder: Joi.object({
    amount: Joi.number().min(10).max(1000000).required(),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    purpose: Joi.string().valid('coin_purchase', 'service_booking').default('coin_purchase')
  }),

  verifyPayment: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    amount: Joi.number().required(),
    purpose: Joi.string().valid('coin_purchase', 'service_booking').default('coin_purchase')
  })
};

// Webhook route (no authentication required)
router.post('/webhook', paymentController.handleWebhook);

// Authenticated routes
router.use(authenticateToken);

router.post('/create-order', validateBody(paymentValidation.createOrder), paymentController.createOrder);
router.post('/verify', validateBody(paymentValidation.verifyPayment), paymentController.verifyPayment);
router.get('/methods', paymentController.getPaymentMethods);
router.put('/methods/:paymentMethodId/default', paymentController.setDefaultPaymentMethod);
router.delete('/methods/:paymentMethodId', paymentController.deletePaymentMethod);
router.get('/history', paymentController.getPaymentHistory);

export default router;