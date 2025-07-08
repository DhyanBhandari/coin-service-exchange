import { Request, Response, NextFunction } from 'express';
import { verifyToken, createApiResponse, AppError } from '@/utils/helpers';
import { db } from '@/config/database';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest, User } from '@/types';

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
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(401).json(
        createApiResponse(false, 'Invalid token')
      );
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json(
        createApiResponse(false, 'Account is suspended')
      );
      return;
    }

    req.user = user as User;
    next();
  } catch (error) {
    res.status(401).json(
      createApiResponse(false, 'Invalid token')
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
      const decoded = verifyToken(token);
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (user && user.status === 'active') {
        req.user = user as User;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};