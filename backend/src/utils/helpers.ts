// src/utils/helpers.ts
// Assuming '@/types' exists and defines ApiResponse and PaginationInfo
import { ApiResponse, PaginationInfo } from '@/types';

/**
 * Custom Error class for operational errors.
 * This class extends the built-in Error class and adds statusCode, status, and isOperational properties.
 * It helps differentiate between operational errors (e.g., invalid input) and programming errors (e.g., bugs).
 */
export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    /**
     * Creates an instance of AppError.
     * @param message The error message.
     * @param statusCode The HTTP status code associated with the error.
     */
    constructor(message: string, statusCode: number) {
        super(message); // Call the parent Error constructor
        this.statusCode = statusCode;
        // Determine status based on status code (e.g., 4xx for 'fail', 5xx for 'error')
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Mark as an operational error

        // Capture the stack trace, excluding the constructor call itself
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Creates a standardized API response object.
 * @param success Indicates if the API call was successful.
 * @param message A descriptive message for the response.
 * @param data The actual data payload (optional).
 * @param pagination Pagination information (optional).
 * @param statusCode The HTTP status code to be returned (defaults to 200).
 * @returns A structured API response object.
 */
export const createApiResponse = <T>(
    success: boolean,
    message: string,
    data: T | null = null,
    pagination: PaginationInfo | null = null,
    statusCode: number = 200
): ApiResponse<T> => {
    const response: ApiResponse<T> = {
        success,
        message,
        timestamp: new Date().toISOString(),
    };
    if (data !== null && data !== undefined) {
        response.data = data;
    }
    if (pagination !== null && pagination !== undefined) {
        response.pagination = pagination;
    }
    return response;
};

/**
 * Checks if the current environment is development.
 * @returns True if NODE_ENV is 'development', false otherwise.
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
