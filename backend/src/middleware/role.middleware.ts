import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { createApiResponse } from '@/utils/helpers';
import { USER_ROLES } from '@/utils/constants';

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(
        createApiResponse(false, 'Authentication required')
      );
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json(
        createApiResponse(false, 'Insufficient permissions')
      );
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([USER_ROLES.ADMIN]);
export const requireOrg = requireRole([USER_ROLES.ORG]);
export const requireUser = requireRole([USER_ROLES.USER]);
export const requireOrgOrAdmin = requireRole([USER_ROLES.ORG, USER_ROLES.ADMIN]);
export const requireUserOrAdmin = requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]);
export const requireAnyRole = requireRole([USER_ROLES.USER, USER_ROLES.ORG, USER_ROLES.ADMIN]);

export const checkOwnership = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  
  if (!req.user) {
    res.status(401).json(
      createApiResponse(false, 'Authentication required')
    );
    return;
  }

  // Admin can access any resource
  if (req.user.role === USER_ROLES.ADMIN) {
    next();
    return;
  }

  // Check if user is accessing their own resource
  if (req.user.id === id) {
    next();
    return;
  }

  res.status(403).json(
    createApiResponse(false, 'Access denied - you can only access your own resources')
  );
};
