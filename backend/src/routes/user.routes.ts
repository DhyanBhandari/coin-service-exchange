import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { ServiceController } from '@/controllers/service.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkOwnership, requireAnyRole, requireUser } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const userController = new UserController();
const serviceController = new ServiceController();

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

const getUserBookingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

const bookingIdSchema = Joi.object({
  bookingId: Joi.string().uuid().required()
});

const cancelBookingSchema = Joi.object({
  reason: Joi.string().max(500).optional()
});

// Routes
router.get('/profile', authenticateToken, requireAnyRole, userController.getProfile);
router.put('/profile', authenticateToken, requireAnyRole, validateBody(updateProfileSchema), userController.updateProfile);
router.get('/wallet', authenticateToken, requireAnyRole, userController.getWalletBalance);
router.get('/:id', authenticateToken, validateParams(userIdSchema), checkOwnership, userController.getUserById);

// User booking routes - temporarily commented out until booking service is implemented
// router.get('/bookings', authenticateToken, requireUser, validateQuery(getUserBookingsQuerySchema), serviceController.getUserBookings);
// router.get('/bookings/:bookingId', authenticateToken, requireUser, validateParams(bookingIdSchema), serviceController.getBookingById);
// router.post('/bookings/:bookingId/cancel', authenticateToken, requireUser, validateParams(bookingIdSchema), validateBody(cancelBookingSchema), serviceController.cancelBooking);

export default router;
