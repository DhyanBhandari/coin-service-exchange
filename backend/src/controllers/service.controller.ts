import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { ServiceService } from '@/services/service.service';
import { createApiResponse, getClientIp, getUserAgent, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  createService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const serviceData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const newService = await this.serviceService.createService(
      serviceData,
      req.user!.id,
      ipAddress,
      userAgent
    );

    res.status(201).json(
      createApiResponse(true, 'Service created successfully', newService)
    );
  });

  getServices = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const filters = {
      category: req.query.category as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      status: req.query.status as string,
      organizationId: req.query.organizationId as string
    };

    const result = await this.serviceService.getServices(filters, pagination);

    res.json(
      createApiResponse(true, 'Services retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getServiceById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const service = await this.serviceService.getServiceById(id);
    if (!service) {
      return res.status(404).json(
        createApiResponse(false, 'Service not found')
      );
    }

    res.json(
      createApiResponse(true, 'Service retrieved successfully', service)
    );
  });

  updateService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const updatedService = await this.serviceService.updateService(
      id,
      updateData,
      req.user!.id,
      ipAddress,
      userAgent
    );

    res.json(
      createApiResponse(true, 'Service updated successfully', updatedService)
    );
  });

  deleteService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await this.serviceService.deleteService(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Service deleted successfully')
    );
  });

  addReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { rating, review } = req.body;

    const newReview = await this.serviceService.addReview(id, req.user!.id, rating, review);

    res.status(201).json(
      createApiResponse(true, 'Review added successfully', newReview)
    );
  });

  bookService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    # Get service details
    const service = await this.serviceService.getServiceById(id);
    if (!service) {
      return res.status(404).json(
        createApiResponse(false, 'Service not found')
      );
    }

    # Check if user has sufficient balance
    const servicePrice = parseFloat(service.price);
    const userBalance = parseFloat(req.user!.walletBalance);

    if (userBalance < servicePrice) {
      return res.status(400).json(
        createApiResponse(false, 'Insufficient wallet balance')
      );
    }

    # Process booking (this would involve creating a transaction and updating balances)
    await this.serviceService.incrementBookings(id);

    res.json(
      createApiResponse(true, 'Service booked successfully', {
        serviceId: id,
        price: servicePrice,
        status: 'booked'
      })
    );
  });
}
