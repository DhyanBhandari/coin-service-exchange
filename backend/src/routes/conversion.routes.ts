import { Router } from 'express';
import { ConversionController } from '@/controllers/conversion.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireOrg, requireAdmin, requireOrgOrAdmin } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const conversionController = new ConversionController();

# Validation schemas
const createRequestSchema = Joi.object({
  amount: Joi.number().min(50).max(100000).required(),
  bankDetails: Joi.object({
    accountNumber: Joi.string().required(),
    ifscCode: Joi.string().required(),
    accountHolderName: Joi.string().required(),
    bankName: Joi.string().required()
  }).required()
});

const requestIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const approveRequestSchema = Joi.object({
  transactionId: Joi.string().optional()
});

const rejectRequestSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required()
});

const getRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

# Routes
router.post('/', authenticateToken, requireOrg, validateBody(createRequestSchema), conversionController.createRequest);
router.get('/', authenticateToken, requireOrgOrAdmin, validateQuery(getRequestsQuerySchema), conversionController.getRequests);
router.get('/:id', authenticateToken, requireOrgOrAdmin, validateParams(requestIdSchema), conversionController.getRequestById);
router.post('/:id/approve', authenticateToken, requireAdmin, validateParams(requestIdSchema), validateBody(approveRequestSchema), conversionController.approveRequest);
router.post('/:id/reject', authenticateToken, requireAdmin, validateParams(requestIdSchema), validateBody(rejectRequestSchema), conversionController.rejectRequest);

export default router;
