import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ConversionService } from '../services/conversion.service';
import { createApiResponse, validatePaginationParams } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';

export class ConversionController {
  private conversionService: ConversionService;

  constructor() {
    this.conversionService = new ConversionService();
  }

  createRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { amount, bankDetails } = req.body;

    const request = await this.conversionService.createConversionRequest(
      req.user!.id,
      amount,
      bankDetails
    );

    res.status(201).json(
      createApiResponse(true, request, 'Conversion request created successfully')
    );
  });

  getRequests = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const pagination = validatePaginationParams(req.query.page as string, req.query.limit as string);
    const organizationId = req.user!.role === 'org' ? req.user!.id : undefined;

    const result = await this.conversionService.getConversionRequests(
      {
        page: pagination.page,
        limit: pagination.limit
      },
      organizationId
    );

    res.json(
      createApiResponse(true, result.data, 'Conversion requests retrieved successfully', result.pagination)
    );
  });

  getRequestById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, null, 'Request ID is required')
      );
      return;
    }

    const request = await this.conversionService.getConversionRequestById(id);
    if (!request) {
      res.status(404).json(
        createApiResponse(false, null, 'Conversion request not found')
      );
      return;
    }

    res.json(
      createApiResponse(true, request, 'Conversion request retrieved successfully')
    );
  });

  approveRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { transactionId } = req.body;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, null, 'Request ID is required')
      );
      return;
    }

    const request = await this.conversionService.approveConversionRequest(
      id,
      req.user!.id,
      transactionId
    );

    res.json(
      createApiResponse(true, request, 'Conversion request approved successfully')
    );
  });

  rejectRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, null, 'Request ID is required')
      );
      return;
    }

    const request = await this.conversionService.rejectConversionRequest(
      id,
      req.user!.id,
      reason
    );

    res.json(
      createApiResponse(true, request, 'Conversion request rejected successfully')
    );
  });
}