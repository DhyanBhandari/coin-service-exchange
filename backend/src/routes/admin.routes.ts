import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { validateBody } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { authValidation } from '@/utils/validation';

const router = Router();
const authController = new AuthController();

router.post('/register', validateBody(authValidation.register), authController.register);
router.post('/login', validateBody(authValidation.login), authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/refresh', authenticateToken, authController.refreshToken);

export default router;