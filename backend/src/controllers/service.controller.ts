import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ServiceService } from '../services/service.service';
import { createApiResponse, getClientIp, getUserAgent, validatePaginationParams } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  createService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

  getServices = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const pagination = validatePaginationParams(req.query.page as string, req.query.limit as string);
    
    // Create filters object with proper type handling
    const filters: any = {};
    
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.organizationId) filters.organizationId = req.query.organizationId as string;

    const result = await this.serviceService.getServices(filters, pagination);

    res.json(
      createApiResponse(true, 'Services retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getServiceById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Service ID is required')
      );
      return;
    }

    const service = await this.serviceService.getServiceById(id);
    if (!service) {
      res.status(404).json(
        createApiResponse(false, 'Service not found')
      );
      return;
    }

    res.json(
      createApiResponse(true, 'Service retrieved successfully', service)
    );
  });

  updateService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Service ID is required')
      );
      return;
    }

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

  deleteService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Service ID is required')
      );
      return;
    }

    await this.serviceService.deleteService(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Service deleted successfully')
    );
  });

  addReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { rating, review } = req.body;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Service ID is required')
      );
      return;
    }

    const newReview = await this.serviceService.addReview(id, req.user!.id, rating, review);

    res.status(201).json(
      createApiResponse(true, 'Review added successfully', newReview)
    );
  });

  bookService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Service ID is required')
      );
      return;
    }

    // Get service details
    const service = await this.serviceService.getServiceById(id);
    if (!service) {
      res.status(404).json(
        createApiResponse(false, 'Service not found')
      );
      return;
    }

    // Check if user has sufficient balance
    const servicePrice = parseFloat(service.price);
    const userBalance = parseFloat(req.user!.walletBalance);

    if (userBalance < servicePrice) {
      res.status(400).json(
        createApiResponse(false, 'Insufficient wallet balance')
      );
      return;
    }

    // Process booking (this would involve creating a transaction and updating balances)
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