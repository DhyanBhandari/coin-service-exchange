import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AdminService } from '../services/admin.service';
import { ServiceService } from '../services/service.service';
import { UserService } from '../services/user.service';
import { AuditService } from '../services/audit.service';
import { createApiResponse, validatePaginationParams, getClientIp, getUserAgent } from '../utils/helpers';
import { asyncHandler } from '../middleware/error.middleware';

export class AdminController {
  private adminService: AdminService;
  private serviceService: ServiceService;
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.adminService = new AdminService();
    this.serviceService = new ServiceService();
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  getDashboard = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const stats = await this.adminService.getDashboardStats();

    res.json(
      createApiResponse(true, 'Dashboard stats retrieved successfully', stats)
    );
  });

  getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 10;
    const activity = await this.adminService.getRecentActivity(limit);

    res.json(
      createApiResponse(true, 'Recent activity retrieved successfully', activity)
    );
  });

  getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const health = await this.adminService.getSystemHealth();

    res.json(
      createApiResponse(true, 'System health retrieved successfully', health)
    );
  });

  approveService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'Service ID is required')
      );
      return;
    }

    const service = await this.serviceService.approveService(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Service approved successfully', service)
    );
  });

  suspendUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'User ID is required')
      );
      return;
    }

    const user = await this.userService.suspendUser(id, req.user!.id, reason, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'User suspended successfully', user)
    );
  });

  reactivateUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!id) {
      res.status(400).json(
        createApiResponse(false, 'User ID is required')
      );
      return;
    }

    const user = await this.userService.reactivateUser(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'User reactivated successfully', user)
    );
  });

  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const pagination = validatePaginationParams(req.query.page as string, req.query.limit as string);
    
    // Create filters object with proper type handling
    const filters: any = {};
    
    if (req.query.userId) filters.userId = req.query.userId as string;
    if (req.query.action) filters.action = req.query.action as string;
    if (req.query.resource) filters.resource = req.query.resource as string;
    if (req.query.startDate) filters.startDate = req.query.startDate as string;
    if (req.query.endDate) filters.endDate = req.query.endDate as string;

    const result = await this.auditService.getAuditLogs(filters, pagination);

    res.json(
      createApiResponse(true, 'Audit logs retrieved successfully', result.data, undefined, result.pagination)
    );
  });
}