import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { ApiResponse, PaginationInfo } from '../types';
import { User } from '../models/schema';
import { SECURITY, PAGINATION_DEFAULTS } from './constants';

/**
 * Custom Error class for operational errors.
 */
export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Creates a standardized API response object.
 */
export const createApiResponse = <T>(
    success: boolean,
    message: string,
    data?: T,
    error?: string,
    pagination?: PaginationInfo
): ApiResponse<T> => {
    const response: ApiResponse<T> = {
        success,
        message,
        timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
        response.data = data;
    }

    if (error) {
        response.error = error;
    }

    if (pagination) {
        response.pagination = pagination;
    }

    return response;
};

/**
 * Creates a custom error with status code.
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
    return new AppError(message, statusCode);
};

/**
 * Hash password using bcrypt.
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
};

/**
 * Compare password with hash.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token.
 */
export const generateToken = (payload: object | Buffer): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, process.env.JWT_SECRET as jwt.Secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    } as jwt.SignOptions);
};

/**
 * Verify JWT token.
 */
export const verifyToken = (token: string): any => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Remove sensitive data from user object.
 */
export const sanitizeUser = (user: any): Partial<User> => {
    const { password, ...sanitized } = user;
    return sanitized;
};

/**
 * Get client IP address from request.
 */
export const getClientIp = (req: Request): string => {
    return (req.headers['x-forwarded-for'] as string) ||
           (req.headers['x-real-ip'] as string) ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
};

/**
 * Get user agent from request.
 */
export const getUserAgent = (req: Request): string => {
    return req.headers['user-agent'] || 'unknown';
};

/**
 * Validate pagination parameters.
 */
export const validatePaginationParams = (page?: string, limit?: string) => {
    const pageNum = page ? parseInt(page) : PAGINATION_DEFAULTS.PAGE;
    const limitNum = limit ? parseInt(limit) : PAGINATION_DEFAULTS.LIMIT;

    return {
        page: Math.max(1, pageNum),
        limit: Math.min(PAGINATION_DEFAULTS.MAX_LIMIT, Math.max(1, limitNum))
    };
};

/**
 * Calculate pagination info.
 */
export const calculatePagination = (page: number, limit: number, total: number): PaginationInfo => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

/**
 * Generate random order ID.
 */
export const generateOrderId = (): string => {
    return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate random API key.
 */
export const generateApiKey = (): string => {
    return `erthaex_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

/**
 * Check if environment is development.
 */
export const isDevelopment = (): boolean => {
    return process.env.NODE_ENV === 'development';
};

/**
 * Check if environment is production.
 */
export const isProduction = (): boolean => {
    return process.env.NODE_ENV === 'production';
};

/**
 * Sleep for given milliseconds.
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Format currency amount.
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

/**
 * Validate email format.
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate UUID format.
 */
export const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

/**
 * Parse JSON safely.
 */
export const safeJsonParse = (jsonString: string, defaultValue: any = null): any => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return defaultValue;
    }
};

/**
 * Capitalize first letter of string.
 */
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate random string.
 */
export const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate password reset token.
 */
export const generatePasswordResetToken = (): string => {
    return generateRandomString(32);
};
