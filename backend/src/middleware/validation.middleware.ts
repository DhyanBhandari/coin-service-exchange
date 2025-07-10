import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiResponse } from '@/utils/helpers';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(
        createApiResponse(false, 'Validation error', null, errorMessage)
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
        createApiResponse(false, 'Query validation error', null, errorMessage)
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
        createApiResponse(false, 'Parameter validation error', null, errorMessage)
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
  return (req: Request, res: Response, next: NextFunction): void => {
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
