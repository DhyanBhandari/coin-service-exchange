import { Response } from 'express';
import { UserService } from '@/services/user.service';
import { createApiResponse, AppError, calculatePagination } from '@/utils/helpers';
import { AuthRequest } from '@/types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.userService.getUserProfile(userId);

      res.status(200).json(
        createApiResponse(true, 'Profile retrieved successfully', profile)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const updatedProfile = await this.userService.updateProfile(userId, updateData);

      res.status(200).json(
        createApiResponse(true, 'Profile updated successfully', updatedProfile)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  addCoins = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { amount, paymentMethod } = req.body;

      const result = await this.userService.addCoins(userId, amount, paymentMethod);

      res.status(200).json(
        createApiResponse(true, 'Coins added successfully', result)
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  getWalletBalance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const balance = await this.userService.getWalletBalance(userId);

      res.status(200).json(
        createApiResponse(true, 'Wallet balance retrieved successfully', { balance })
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };

  getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const { transactions, total } = await this.userService.getTransactionHistory(
        userId,
        Number(page),
        Number(limit)
      );

      const pagination = calculatePagination(Number(page), Number(limit), total);

      res.status(200).json(
        createApiResponse(true, 'Transaction history retrieved successfully', {
          transactions,
          pagination
        })
      );
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          createApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          createApiResponse(false, 'Internal server error')
        );
      }
    }
  };
}