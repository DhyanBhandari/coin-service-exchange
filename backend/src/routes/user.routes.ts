import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkOwnership, requireAnyRole } from '@/middleware/role.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const userController = new UserController();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  address: Joi.object().optional(),
  preferences: Joi.object().optional(),
  profileImage: Joi.string().uri().optional()
});

const userIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Routes
router.get('/profile', authenticateToken, requireAnyRole, userController.getProfile);
router.put('/profile', authenticateToken, requireAnyRole, validateBody(updateProfileSchema), userController.updateProfile);
router.get('/wallet', authenticateToken, requireAnyRole, userController.getWalletBalance);
router.get('/:id', authenticateToken, validateParams(userIdSchema), checkOwnership, userController.getUserById);

export default router;
