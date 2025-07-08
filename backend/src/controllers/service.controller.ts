import { Response } from 'express';
import { ServiceService } from '@/services/service.service';
import { createApiResponse, AppError, calculatePagination } from '@/utils/helpers';
import { AuthRequest } from '@/types';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  createService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.user!.id;
      const serviceData = req.body;

      const service = await this.serviceService.createService(organizationId, serviceData);

      res.status(201).json(
        createApiResponse(true, 'Service created successfully', service)
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

  getServiceById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const service = await this.serviceService.getServiceById(serviceId);

      if (!service) {
        res.status(404).json(
          createApiResponse(false, 'Service not found')
        );
        return;
      }

      res.status(200).json(
        createApiResponse(true, 'Service retrieved successfully', service)
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  getMyServices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;

      const { services, total } = await this.serviceService.getServicesByOrganization(
        organizationId,
        Number(page),
        Number(limit)
      );

      const pagination = calculatePagination(Number(page), Number(limit), total);

      res.status(200).json(
        createApiResponse(true, 'Services retrieved successfully', {
          services,
          pagination
        })
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  getPublicServices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, category, search } = req.query;

      const { services, total } = await this.serviceService.getPublicServices(
        Number(page),
        Number(limit),
        category as string,
        search as string
      );

      const pagination = calculatePagination(Number(page), Number(limit), total);

      res.status(200).json(
        createApiResponse(true, 'Public services retrieved successfully', {
          services,
          pagination
        })
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };

  updateService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const organizationId = req.user!.id;
      const updateData = req.body;

      const service = await this.serviceService.updateService(
        serviceId,
        organizationId,
        updateData
      );

      res.status(200).json(
        createApiResponse(true, 'Service updated successfully', service)
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

  deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const organizationId = req.user!.id;

      await this.serviceService.deleteService(serviceId, organizationId);

      res.status(200).json(
        createApiResponse(true, 'Service deleted successfully')
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

  bookService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { serviceId } = req.body;

      const transaction = await this.serviceService.bookService(userId, serviceId);

      res.status(200).json(
        createApiResponse(true, 'Service booked successfully', transaction)
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

  getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const categories = await this.serviceService.getServiceCategories();

      res.status(200).json(
        createApiResponse(true, 'Categories retrieved successfully', categories)
      );
    } catch (error) {
      res.status(500).json(
        createApiResponse(false, 'Internal server error')
      );
    }
  };
}