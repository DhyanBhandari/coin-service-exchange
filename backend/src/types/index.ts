import { Request } from 'express';
import { User } from '../models/schema';

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  pagination?: PaginationInfo;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaymentOrderData {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  paymentTransactionId: string;
  keyId: string;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ServiceFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  organizationId?: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  userId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalOrganizations: number;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  pendingServices: number;
  totalBookings: number;
}

export interface FinancialStats {
  totalCoinsInCirculation: number;
  totalRevenue: number;
  pendingConversions: number;
  thisMonthRevenue: number;
}

export interface DashboardStats {
  users: UserStats;
  services: ServiceStats;
  financial: FinancialStats;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadData {
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  location?: string;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}