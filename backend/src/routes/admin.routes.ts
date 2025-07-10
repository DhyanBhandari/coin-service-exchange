import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireAdmin } from '@/middleware/role.middleware';
import { validateParams, validateQuery, validateBody } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const adminController = new AdminController();

# Validation schemas
const userIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const serviceIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const suspendUserSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required()
});

const getAuditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  userId: Joi.string().uuid().optional(),
  action: Joi.string().optional(),
  resource: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

const recentActivityQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).optional()
});

# Routes - All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/activity', validateQuery(recentActivityQuerySchema), adminController.getRecentActivity);
router.get('/health', adminController.getSystemHealth);
router.post('/services/:id/approve', validateParams(serviceIdSchema), adminController.approveService);
router.post('/users/:id/suspend', validateParams(userIdSchema), validateBody(suspendUserSchema), adminController.suspendUser);
router.post('/users/:id/reactivate', validateParams(userIdSchema), adminController.reactivateUser);
router.get('/audit-logs', validateQuery(getAuditLogsQuerySchema), adminController.getAuditLogs);

export default router;
