import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth as adminAuth } from '../config/firebase-admin';
import { users } from '../models/schema';
import { getDb } from '../config/database';
import { eq } from 'drizzle-orm';
import { createApiResponse } from '../utils/helpers';

// Extend Request interface to include user data
interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // Changed from userId to id, and string instead of number
    email: string;
    role: string;
    firebaseUid?: string;
    walletBalance?: string;
    name?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  };
  firebaseUser?: any;
}

// Validate Firebase ID token middleware
export const validateFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createApiResponse(false, 'No token provided')
      );
    }

    const token = authHeader.substring(7);

    // Verify Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Attach Firebase user info to request
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error: any) {
    console.error('Firebase token validation error:', error);
    
    let message = 'Invalid token';
    if (error.code === 'auth/id-token-expired') {
      message = 'Token expired';
    } else if (error.code === 'auth/id-token-revoked') {
      message = 'Token revoked';
    }
    
    return res.status(401).json(
      createApiResponse(false, message)
    );
  }
};

// General authentication middleware (works with both Firebase and JWT)
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createApiResponse(false, 'No token provided')
      );
    }

    const token = authHeader.substring(7);
    const db = getDb();

    try {
      // Try Firebase token first
      const decodedFirebaseToken = await adminAuth.verifyIdToken(token);
      
      // Find user by Firebase UID
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, decodedFirebaseToken.uid))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(401).json(
          createApiResponse(false, 'User not found')
        );
      }

      const user = userResult[0];
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json(
          createApiResponse(false, 'Account suspended')
        );
      }

      // Set user info in request - using proper field names
    req.user = {
  id: user.id,
  email: user.email,
  role: user.role,
  firebaseUid: user.firebaseUid || undefined,
  walletBalance: user.walletBalance || undefined,
  name: user.name || undefined,
  isActive: user.isActive ?? undefined,
  emailVerified: user.emailVerified ?? undefined
};

      
      req.firebaseUser = decodedFirebaseToken;
      
    } catch (firebaseError) {
      // If Firebase token validation fails, try JWT
      try {
        const decodedJWT = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Find user by ID from JWT
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, decodedJWT.userId))
          .limit(1);

        if (userResult.length === 0) {
          return res.status(401).json(
            createApiResponse(false, 'User not found')
          );
        }

        const user = userResult[0];
        
        // Check if user is active
        if (!user.isActive) {
          return res.status(403).json(
            createApiResponse(false, 'Account suspended')
          );
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firebaseUid: user.firebaseUid || undefined,
          walletBalance: user.walletBalance || undefined,
          name: user.name || undefined,
          isActive: user.isActive ?? undefined,
          emailVerified: user.emailVerified ?? undefined
        };
        
      } catch (jwtError) {
        console.error('JWT validation error:', jwtError);
        return res.status(401).json(
          createApiResponse(false, 'Invalid token')
        );
      }
    }
    
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(500).json(
      createApiResponse(false, 'Authentication failed')
    );
  }
};

// Optional authentication middleware
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const db = getDb();
    
    try {
      // Try Firebase token first
      const decodedFirebaseToken = await adminAuth.verifyIdToken(token);
      
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, decodedFirebaseToken.uid))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        if (user.isActive) {
          req.user = {
  id: user.id,
  email: user.email,
  role: user.role,
  firebaseUid: user.firebaseUid || undefined,
  walletBalance: user.walletBalance || undefined,
  name: user.name || undefined,
  isActive: user.isActive ?? undefined,
  emailVerified: user.emailVerified ?? undefined
};

          req.firebaseUser = decodedFirebaseToken;
        }
      }
    } catch (firebaseError) {
      // Try JWT fallback
      try {
        const decodedJWT = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, decodedJWT.userId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];
          if (user.isActive) {
           req.user = {
  id: user.id,
  email: user.email,
  role: user.role,
  firebaseUid: user.firebaseUid || undefined,
  walletBalance: user.walletBalance || undefined,
  name: user.name || undefined,
  isActive: user.isActive ?? undefined,
  emailVerified: user.emailVerified ?? undefined
};

          }
        }
      } catch (jwtError) {
        // Ignore JWT errors in optional auth
      }
    }
    
    next();
  } catch (error: any) {
    // Ignore errors in optional auth
    next();
  }
};

// API Key validation middleware
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json(
        createApiResponse(false, 'API key required')
      );
    }

    // Check against environment variable
    const validApiKey = process.env.API_KEY;
    
    if (apiKey !== validApiKey) {
      return res.status(401).json(
        createApiResponse(false, 'Invalid API key')
      );
    }
    
    next();
  } catch (error: any) {
    console.error('API key validation error:', error);
    return res.status(500).json(
      createApiResponse(false, 'API key validation failed')
    );
  }
};

// Export the AuthRequest type for use in other files
export type AuthRequest = AuthenticatedRequest;