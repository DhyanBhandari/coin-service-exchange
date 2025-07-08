import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse, PaginationParams } from '@/types';

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

export const generateId = (): string => uuidv4();

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const createApiResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
): ApiResponse<T> => {
  return {
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
  };
};

export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
};

export const validatePaginationParams = (
  page?: string,
  limit?: string
): PaginationParams => {
  const parsedPage = parseInt(page || '1', 10);
  const parsedLimit = parseInt(limit || '10', 10);

  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit))
  };
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const generateOrderId = (): string => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€'
  };
  return `${symbols[currency] || currency}${amount}`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const generateRandomString = (length: number = 32): string => {
  return Math.random().toString(36).substring(2, length + 2);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};