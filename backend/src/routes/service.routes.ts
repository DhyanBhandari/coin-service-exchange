import { Router } from 'express';
import { ServiceController } from '@/controllers/service.controller';
import { authenticateToken, optionalAuth } from '@/middleware/auth.middleware';
import { requireOrg, requireOrgOrAdmin, requireUser } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const serviceController = new ServiceController();

# Validation schemas
const createServiceSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(2000).required(),
  price: Joi.number().min(1).max(1000000).required(),
  category: Joi.string().required(),
  features: Joi.array().items(Joi.string()).required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

const updateServiceSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(20).max(2000).optional(),
  price: Joi.number().min(1).max(1000000).optional(),
  category: Joi.string().optional(),
  features: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

const serviceIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const getServicesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().optional(),
  search: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional(),
  organizationId: Joi.string().uuid().optional(),
  sortBy: Joi.string().valid('createdAt', 'price', 'rating').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});

const addReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(1000).optional()
});

# Routes
router.post('/', authenticateToken, requireOrg, validateBody(createServiceSchema), serviceController.createService);
router.get('/', optionalAuth, validateQuery(getServicesQuerySchema), serviceController.getServices);
router.get('/:id', optionalAuth, validateParams(serviceIdSchema), serviceController.getServiceById);
router.put('/:id', authenticateToken, requireOrgOrAdmin, validateParams(serviceIdSchema), validateBody(updateServiceSchema), serviceController.updateService);
router.delete('/:id', authenticateToken, requireOrgOrAdmin, validateParams(serviceIdSchema), serviceController.deleteService);
router.post('/:id/reviews', authenticateToken, requireUser, validateParams(serviceIdSchema), validateBody(addReviewSchema), serviceController.addReview);
router.post('/:id/book', authenticateToken, requireUser, validateParams(serviceIdSchema), serviceController.bookService);

export default router;
