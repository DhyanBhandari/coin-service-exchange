import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { AdminService } from '@/services/admin.service';
import { ServiceService } from '@/services/service.service';
import { UserService } from '@/services/user.service';
import { AuditService } from '@/services/audit.service';
import { createApiResponse, validatePaginationParams, getClientIp, getUserAgent } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

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

  getDashboard = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.adminService.getDashboardStats();

    res.json(
      createApiResponse(true, 'Dashboard stats retrieved successfully', stats)
    );
  });

  getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const activity = await this.adminService.getRecentActivity(limit);

    res.json(
      createApiResponse(true, 'Recent activity retrieved successfully', activity)
    );
  });

  getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const health = await this.adminService.getSystemHealth();

    res.json(
      createApiResponse(true, 'System health retrieved successfully', health)
    );
  });

  approveService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const service = await this.serviceService.approveService(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Service approved successfully', service)
    );
  });

  suspendUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const user = await this.userService.suspendUser(id, req.user!.id, reason, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'User suspended successfully', user)
    );
  });

  reactivateUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const user = await this.userService.reactivateUser(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'User reactivated successfully', user)
    );
  });

  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const filters = {
      userId: req.query.userId as string,
      action: req.query.action as string,
      resource: req.query.resource as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const result = await this.auditService.getAuditLogs(filters, pagination);

    res.json(
      createApiResponse(true, 'Audit logs retrieved successfully', result.data, undefined, result.pagination)
    );
  });
}
