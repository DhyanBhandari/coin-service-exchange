import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiResponse } from '@/utils/helpers';

// Extended Request interface for file uploads
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage: string = error.details
        .map(detail => detail.message)
        .join(', ');

      res.status(400).json(
        createApiResponse(false, { error: errorMessage }, 'Validation error')
      );
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      res.status(400).json(
        createApiResponse(false, { error: errorMessage }, 'Query validation error')
      );
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      res.status(400).json(
        createApiResponse(false, { error: errorMessage }, 'Parameter validation error')
      );
      return;
    }

    req.params = value;
    next();
  };
};

export const validateFile = (options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}) => {
  return (req: RequestWithFile, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (options.required && !file) {
      res.status(400).json(
        createApiResponse(false, 'File is required')
      );
      return;
    }

    if (file) {
      if (options.maxSize && file.size > options.maxSize) {
        res.status(400).json(
          createApiResponse(false, `File size must be less than ${options.maxSize} bytes`)
        );
        return;
      }

      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        res.status(400).json(
          createApiResponse(false, `File type must be one of: ${options.allowedTypes.join(', ')}`)
        );
        return;
      }
    }

    next();
  };
};