import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { ConversionService } from '@/services/conversion.service';
import { createApiResponse, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class ConversionController {
  private conversionService: ConversionService;

  constructor() {
    this.conversionService = new ConversionService();
  }

  createRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { amount, bankDetails } = req.body;

    const request = await this.conversionService.createConversionRequest(
      req.user!.id,
      amount,
      bankDetails
    );

    res.status(201).json(
      createApiResponse(true, 'Conversion request created successfully', request)
    );
  });

  getRequests = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const organizationId = req.user!.role === 'org' ? req.user!.id : undefined;

    const result = await this.conversionService.getConversionRequests(pagination, organizationId);

    res.json(
      createApiResponse(true, 'Conversion requests retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getRequestById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const request = await this.conversionService.getConversionRequestById(id);
    if (!request) {
      return res.status(404).json(
        createApiResponse(false, 'Conversion request not found')
      );
    }

    res.json(
      createApiResponse(true, 'Conversion request retrieved successfully', request)
    );
  });

  approveRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { transactionId } = req.body;

    const request = await this.conversionService.approveConversionRequest(
      id,
      req.user!.id,
      transactionId
    );

    res.json(
      createApiResponse(true, 'Conversion request approved successfully', request)
    );
  });

  rejectRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await this.conversionService.rejectConversionRequest(
      id,
      req.user!.id,
      reason
    );

    res.json(
      createApiResponse(true, 'Conversion request rejected successfully', request)
    );
  });
}
