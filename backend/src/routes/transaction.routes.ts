import { Router } from 'express';
import { TransactionController } from '@/controllers/transaction.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireAnyRole, requireAdmin } from '@/middleware/role.middleware';
import { validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const transactionController = new TransactionController();

# Validation schemas
const transactionIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const getTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('coin_purchase', 'service_booking', 'coin_conversion', 'refund').optional(),
  status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
  userId: Joi.string().uuid().optional(),
  serviceId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

# Routes
router.get('/', authenticateToken, requireAnyRole, validateQuery(getTransactionsQuerySchema), transactionController.getTransactions);
router.get('/stats', authenticateToken, requireAnyRole, transactionController.getStats);
router.get('/history', authenticateToken, requireAnyRole, transactionController.getUserTransactionHistory);
router.get('/:id', authenticateToken, requireAnyRole, validateParams(transactionIdSchema), transactionController.getTransactionById);

export default router;
