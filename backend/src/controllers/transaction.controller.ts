import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { TransactionService } from '../services/transaction.service';
import { createApiResponse, validatePaginationParams } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getTransactions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const pagination = validatePaginationParams(req.query.page as string, req.query.limit as string);
    
    // Create filters object with proper type handling
    const filters: any = {};
    
    // Set userId based on user role
    if (req.user!.role === 'admin' && req.query.userId) {
      filters.userId = req.query.userId as string;
    } else {
      filters.userId = req.user!.id;
    }
    
    // Set other filters only if they exist
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.startDate) filters.startDate = req.query.startDate as string;
    if (req.query.endDate) filters.endDate = req.query.endDate as string;
    if (req.query.serviceId) filters.serviceId = req.query.serviceId as string;

    const result = await this.transactionService.getTransactions(filters, pagination);

    res.json(
      createApiResponse(true, 'Transactions retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getTransactionById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Transaction ID is required')
      );
      return;
    }

    const transaction = await this.transactionService.getTransactionById(id);
    if (!transaction) {
      res.status(404).json(
        createApiResponse(false, 'Transaction not found')
      );
      return;
    }

    res.json(
      createApiResponse(true, 'Transaction retrieved successfully', transaction)
    );
  });

  getStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
    const stats = await this.transactionService.getTransactionStats(userId);

    res.json(
      createApiResponse(true, 'Transaction stats retrieved successfully', stats)
    );
  });

  getUserTransactionHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const pagination = validatePaginationParams(req.query.page as string, req.query.limit as string);

    const result = await this.transactionService.getUserTransactionHistory(req.user!.id, pagination);

    res.json(
      createApiResponse(true, 'Transaction history retrieved successfully', result.data, undefined, result.pagination)
    );
  });
}