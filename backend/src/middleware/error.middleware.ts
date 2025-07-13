import { Request, Response, NextFunction } from 'express';
import { AppError, createApiResponse } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Async handler to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handling middleware for Express.
 */
export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Create a mutable copy of the error object
    let err = { ...error } as any;
    err.message = error.message;

    // Log the error for debugging purposes
    logger.error(err);

    // Initialize default error response values
    let statusCode = 500;
    let message = 'Something went wrong!';

    // Handle specific error types
    if (err.name === 'CastError') {
        message = `Invalid ${err.path}: ${err.value}.`;
        statusCode = 400;
    } else if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((el: any) => el.message);
        message = `Invalid input data. ${errors.join('. ')}`;
        statusCode = 400;
    } else if (err.code === 11000) {
        const value = err.keyValue ? Object.values(err.keyValue)[0] : 'duplicate value';
        message = `Duplicate field value: ${value}. Please use another value!`;
        statusCode = 400;
    }

    // Joi validation error
    if (err.isJoi) {
        message = err.details.map((el: any) => el.message).join('. ');
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please log in again!';
        statusCode = 401;
    } else if (err.name === 'TokenExpiredError') {
        message = 'Your token has expired! Please log in again.';
        statusCode = 401;
    }

    // PostgreSQL/Drizzle errors
    if (typeof err.code === 'string' && err.code.startsWith('23')) {
        message = `Database error: ${err.message}.`;
        statusCode = 400;
    }

    // Handle custom AppError instances
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }

    // For any other unexpected errors in production, send a generic message
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Something went very wrong!';
    }

    // Send the structured error response
    res.status(statusCode).json(createApiResponse(false, message));
};

/**
 * Middleware to handle 404 Not Found errors.
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(error);
};
