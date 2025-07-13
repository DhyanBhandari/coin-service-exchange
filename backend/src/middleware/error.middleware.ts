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
    // Log the error for debugging purposes
    logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        name: error.name
    });

    // Initialize default error response values
    let statusCode = 500;
    let message = 'Something went wrong!';

    // Handle specific error types
    if ((error as any).name === 'CastError') {
        message = `Invalid ${(error as any).path}: ${(error as any).value}.`;
        statusCode = 400;
    } else if ((error as any).name === 'ValidationError') {
        const errors = Object.values((error as any).errors).map((el: any) => el.message);
        message = `Invalid input data. ${errors.join('. ')}`;
        statusCode = 400;
    } else if ((error as any).code === 11000) {
        const value = (error as any).keyValue ? Object.values((error as any).keyValue)[0] : 'duplicate value';
        message = `Duplicate field value: ${value}. Please use another value!`;
        statusCode = 400;
    }

    // Joi validation error
    if ((error as any).isJoi) {
        message = (error as any).details.map((el: any) => el.message).join('. ');
        statusCode = 400;
    }

    // JWT errors
    if ((error as any).name === 'JsonWebTokenError') {
        message = 'Invalid token. Please log in again!';
        statusCode = 401;
    } else if ((error as any).name === 'TokenExpiredError') {
        message = 'Your token has expired! Please log in again.';
        statusCode = 401;
    }

    // PostgreSQL/Drizzle errors
    if (typeof (error as any).code === 'string' && (error as any).code.startsWith('23')) {
        message = `Database error: ${error.message}.`;
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
    try {
        res.status(statusCode).json(createApiResponse(false, message));
    } catch (responseError) {
        logger.error('Error sending response:', responseError);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Middleware to handle 404 Not Found errors.
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(error);
};
