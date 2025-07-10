// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError, createApiResponse } from '@/utils/helpers'; // Corrected import for AppError
import { logger } from '@/utils/logger'; // Assuming logger is correctly imported

/**
 * Global error handling middleware for Express.
 * This middleware catches errors passed via next(error) and formats them
 * into a standardized API response, handling various error types.
 *
 * @param error The error object.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const errorHandler = (
    error: Error, // Explicitly type the error parameter as Error
    req: Request,
    res: Response,
    next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
    // Create a mutable copy of the error object
    let err = { ...error } as any; // Use 'any' for initial flexibility in error object properties
    err.message = error.message; // Ensure message is copied

    // Log the error for debugging purposes
    logger.error(err);

    // Initialize default error response values
    let statusCode = 500;
    let message = 'Something went wrong!';

    // Handle specific error types
    // Mongoose/Database errors (assuming Mongoose is used for some parts or similar ORM errors)
    if (err.name === 'CastError') {
        // Example: Invalid ObjectId for a Mongoose query
        message = `Invalid ${err.path}: ${err.value}.`;
        statusCode = 400;
    } else if (err.name === 'ValidationError') {
        // Example: Mongoose validation error (e.g., required field missing)
        // Assuming 'errors' property exists on the validation error
        const errors = Object.values(err.errors).map((el: any) => el.message);
        message = `Invalid input data. ${errors.join('. ')}`;
        statusCode = 400;
    } else if (err.code === 11000) {
        // Example: Duplicate key error (MongoDB/Mongoose specific error code)
        // Extract the duplicated field value if available
        const value = err.keyValue ? Object.values(err.keyValue)[0] : 'duplicate value';
        message = `Duplicate field value: ${value}. Please use another value!`;
        statusCode = 400;
    }

    // Joi validation error (assuming 'isJoi' and 'details' properties)
    if (err.isJoi) {
        message = err.details.map((el: any) => el.message).join('. ');
        statusCode = 400;
    }

    // JWT errors (JsonWebTokenError, TokenExpiredError)
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please log in again!';
        statusCode = 401;
    } else if (err.name === 'TokenExpiredError') {
        message = 'Your token has expired! Please log in again.';
        statusCode = 401;
    }

    // PostgreSQL/Drizzle errors
    // Drizzle errors often wrap underlying PostgreSQL errors.
    // PostgreSQL error codes are strings (e.g., '23505' for unique violation).
    if (typeof err.code === 'string' && err.code.startsWith('23')) {
        // Generic PostgreSQL data integrity error (e.g., unique constraint violation, foreign key violation)
        message = `Database error: ${err.message}.`; // Use the original error message for more detail
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
 * Creates an AppError for the requested URL not found and passes it to the error handler.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(error); // Pass this custom error to the global error handler
};
