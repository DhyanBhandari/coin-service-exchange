import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { validateBody, validateQuery } from '@/middleware/validation.middleware';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireUser } from '@/middleware/role.middleware';
import { userValidation, paginationValidation } from '@/utils/validation';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticateToken);

router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(userValidation.updateProfile), userController.updateProfile);
router.post('/coins/add', requireUser, validateBody(userValidation.addCoins), userController.addCoins);
router.get('/wallet/balance', userController.getWalletBalance);
router.get('/transactions', validateQuery(paginationValidation), userController.getTransactionHistory);

export default router;