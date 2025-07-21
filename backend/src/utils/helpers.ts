// Replace bcrypt with bcryptjs in your helpers.ts file

import bcrypt from 'bcryptjs'; // Changed from 'bcrypt' to 'bcryptjs'
import jwt, { Secret } from 'jsonwebtoken';

// Environment utilities
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};


// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: string = '7d'
): string => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, secretKey, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, secret);
};
// User data sanitization

export const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// API response helper
// Fixed createApiResponse function with proper overloads

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  pagination?: any;
}

// Overloaded function signatures to handle different parameter orders
export function createApiResponse(success: boolean, data: any, message?: string): ApiResponse;
export function createApiResponse(success: boolean, data: any, message: string, pagination?: any): ApiResponse;
export function createApiResponse(success: boolean, message: string): ApiResponse;
export function createApiResponse(success: boolean, dataOrMessage: any, messageOrPagination?: any, pagination?: any): ApiResponse {
  // Handle different parameter combinations
  let data: any = null;
  let message: string = '';
  let paginationInfo: any = undefined;

  if (typeof dataOrMessage === 'string') {
    // createApiResponse(success, message)
    message = dataOrMessage;
    data = null;
  } else {
    // createApiResponse(success, data, message?, pagination?)
    data = dataOrMessage;

    if (typeof messageOrPagination === 'string') {
      message = messageOrPagination;
      paginationInfo = pagination;
    } else {
      // If messageOrPagination is not a string, it might be pagination
      message = '';
      paginationInfo = messageOrPagination;
    }
  }

  const response: ApiResponse = {
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  };

  if (paginationInfo) {
    response.pagination = paginationInfo;
  }

  return response;
}

// Pagination helpers
export const validatePaginationParams = (page?: string, limit?: string) => {
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  
  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
    offset: (Math.max(1, pageNum) - 1) * Math.min(100, Math.max(1, limitNum))
  };
};

// Generate random string
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (basic)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate unique ID
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generate order ID for payments
export const generateOrderId = (): string => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Create error with status code
export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

// Generate password reset token
export const generatePasswordResetToken = (): string => {
  return generateRandomString(64);
};

// Calculate pagination metadata
export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Truncate text
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate slug from string
export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Convert to title case
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Parse JSON safely
export const safeJsonParse = (str: string, defaultValue: any = null): any => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Validate file type
export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(extension);
};

// Convert bytes to human readable format
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Rate limiting helper
export const createRateLimitKey = (identifier: string, action: string): string => {
  return `rate_limit:${action}:${identifier}`;
};

// Error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async wrapper for error handling
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Client IP helper
export const getClientIp = (req: any): string => {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) || 'unknown';
};

// User agent helper
export const getUserAgent = (req: any): string => {
  return req.get('User-Agent') || 'unknown';
};

// Default export for common utilities
export default {
  isDevelopment,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  sanitizeUser,
  createApiResponse,
  validatePaginationParams,
  generateRandomString,
  isValidEmail,
  isValidPhone,
  formatCurrency,
  formatDate,
  calculatePercentage,
  sleep,
  generateUniqueId,
  generateOrderId,
  createError,
  generatePasswordResetToken,
  calculatePagination,
  truncateText,
  deepClone,
  isEmpty,
  capitalize,
  generateSlug,
  toTitleCase,
  safeJsonParse,
  getFileExtension,
  isValidFileType,
  formatBytes,
  createRateLimitKey,
  getClientIp,
  getUserAgent,
  AppError,
  asyncHandler
};