// backend/src/controllers/admin.controller.ts

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error.middleware';
import { AdminService } from '@/services/admin.service';
import { createApiResponse } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  logger.info("Fetching admin dashboard stats");
  const stats = await AdminService.getDashboardStats();
  res.status(200).json(createApiResponse(true, stats, "Dashboard stats retrieved successfully"));
});

export const getManagementData = asyncHandler(async (req: Request, res: Response) => {
  logger.info("Fetching admin management data");
  const data = await AdminService.getManagementData();
  res.status(200).json(createApiResponse(true, data, "Management data retrieved successfully"));
});

export const getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
  logger.info("Fetching system health");
  const health = await AdminService.getSystemHealth();
  res.status(200).json(createApiResponse(true, health, "System health retrieved successfully"));
});

export const approveService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.info(`Approving service with ID: ${id}`);
  const service = await AdminService.approveService(id);
  res.status(200).json(createApiResponse(true, service, "Service approved successfully"));
});

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.info(`Suspending user with ID: ${id}`);
  const user = await AdminService.suspendUser(id);
  res.status(200).json(createApiResponse(true, user, "User suspended successfully"));
});

export const unsuspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.info(`Unsuspending user with ID: ${id}`);
  const user = await AdminService.suspendUser(id);
  res.status(200).json(createApiResponse(true, user, "User unsuspended successfully"));
});

export const createServiceCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  logger.info(`Creating service category: ${name}`);
  const category = await AdminService.createServiceCategory(name, description);
  res.status(201).json(createApiResponse(true, category, "Service category created successfully"));
});