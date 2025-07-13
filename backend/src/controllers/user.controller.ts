import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserService } from '../services/user.service';
import { createApiResponse, getClientIp, getUserAgent } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.json(
      createApiResponse(true, 'Profile retrieved successfully', req.user)
    );
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const updateData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const updatedUser = await this.userService.updateProfile(
      req.user!.id,
      updateData,
      ipAddress,
      userAgent
    );

    res.json(
      createApiResponse(true, 'Profile updated successfully', updatedUser)
    );
  });

  getUserById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(
        createApiResponse(false, 'User ID is required')
      );
    }

    const user = await this.userService.getUserById(id);
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    return res.json(
      createApiResponse(true, 'User retrieved successfully', user)
    );
  });

  getWalletBalance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.json(
      createApiResponse(true, 'Wallet balance retrieved successfully', {
        balance: req.user!.walletBalance,
        currency: 'INR'
      })
    );
  });
}
