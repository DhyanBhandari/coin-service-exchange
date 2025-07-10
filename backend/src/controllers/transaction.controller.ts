import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { TransactionService } from '@/services/transaction.service';
import { createApiResponse, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getTransactions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const filters = {
      userId: req.user!.role === 'admin' ? req.query.userId as string : req.user!.id,
      type: req.query.type as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const result = await this.transactionService.getTransactions(filters, pagination);

    res.json(
      createApiResponse(true, 'Transactions retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getTransactionById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const transaction = await this.transactionService.getTransactionById(id);
    if (!transaction) {
      return res.status(404).json(
        createApiResponse(false, 'Transaction not found')
      );
    }

    res.json(
      createApiResponse(true, 'Transaction retrieved successfully', transaction)
    );
  });

  getStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
    const stats = await this.transactionService.getTransactionStats(userId);

    res.json(
      createApiResponse(true, 'Transaction stats retrieved successfully', stats)
    );
  });

  getUserTransactionHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);

    const result = await this.transactionService.getUserTransactionHistory(req.user!.id, pagination);

    res.json(
      createApiResponse(true, 'Transaction history retrieved successfully', result.data, undefined, result.pagination)
    );
  });
}
