import { Response, NextFunction } from 'express';
import { verifyToken, createApiResponse } from '../utils/helpers';
import { getDb } from '../config/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types';
import { USER_STATUS } from '../utils/constants';
import { logger } from '../utils/logger';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json(
        createApiResponse(false, 'Access token is required')
      );
      return;
    }

    const decoded = verifyToken(token);
    const db = getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(401).json(
        createApiResponse(false, 'Invalid token - user not found')
      );
      return;
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      res.status(403).json(
        createApiResponse(false, `Account is ${user.status}`)
      );
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json(
      createApiResponse(false, 'Invalid or expired token')
    );
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token);
        const db = getDb();

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (user && user.status === USER_STATUS.ACTIVE) {
          req.user = user;
        }
      } catch (error) {
        logger.warn('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const validateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      logger.warn('No API key provided. Skipping API key validation for development.');
      next();
      return;
    }

    // TODO: Implement actual API key validation logic here
    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(401).json(
      createApiResponse(false, 'Invalid API key')
    );
  }
};
