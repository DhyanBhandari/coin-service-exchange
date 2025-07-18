import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  changePassword, // Corrected import
  logout,
  forgotPassword, // Now present in controller
  resetPassword, // Now present in controller
  firebaseRegister,
  firebaseLogin,
  updateProfile // New import
} from '../controllers/auth.controller';
import { authenticateToken, validateFirebaseToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  firebaseRegisterSchema,
  firebaseLoginSchema
} from '../utils/validation';

const router = Router();

// Traditional email/password auth (keep for backward compatibility)
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

// Firebase authentication routes
router.post('/firebase-register', validateFirebaseToken, validateBody(firebaseRegisterSchema), firebaseRegister);
router.post('/firebase-login', validateFirebaseToken, validateBody(firebaseLoginSchema), firebaseLogin);

// Protected routes (work with both auth methods)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile); // New route
router.put('/password', authenticateToken, validateBody(updatePasswordSchema), changePassword); // Corrected handler
router.post('/logout', authenticateToken, logout);

export default router;