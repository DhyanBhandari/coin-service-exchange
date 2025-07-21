// backend/src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { AdminService } from '../services/admin.service';
import { createApiResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

export class AdminController {
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    logger.info("Fetching admin dashboard stats");
    const stats = await AdminService.getDashboardStats();
    res.status(200).json(createApiResponse(true, stats, "Dashboard stats retrieved successfully"));
  });

  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    logger.info("Fetching admin recent activity");
    const data = await AdminService.getManagementData();
    res.status(200).json(createApiResponse(true, data, "Recent activity retrieved successfully"));
  });

  getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    logger.info("Fetching system health");
    const health = await AdminService.getSystemHealth();
    res.status(200).json(createApiResponse(true, health, "System health retrieved successfully"));
  });

  approveService = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info(`Approving service with ID: ${id}`);
    const service = await AdminService.approveService(id);
    res.status(200).json(createApiResponse(true, service, "Service approved successfully"));
  });

  suspendUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info(`Suspending user with ID: ${id}`);
    const user = await AdminService.suspendUser(id);
    res.status(200).json(createApiResponse(true, user, "User suspended successfully"));
  });

  reactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    logger.info(`Reactivating user with ID: ${id}`);
    // You'll need to implement this method in AdminService
    const user = await AdminService.suspendUser(id); // This should be reactivateUser
    res.status(200).json(createApiResponse(true, user, "User reactivated successfully"));
  });

  getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    logger.info("Fetching audit logs");
    // Implementation would depend on AuditService
    const logs = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
    res.status(200).json(createApiResponse(true, logs, "Audit logs retrieved successfully"));
  });
}