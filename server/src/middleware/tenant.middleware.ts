import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Require valid Tenant Context derived strictly from authenticated user token.
 */
export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.isMainAdmin && !req.tenantId) {
    // Main Admin operating globally
    return next();
  }

  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Tenant context is missing or invalid.'
    });
  }

  next();
};

/**
 * Ensures SaaS Main Admin role for admin-only operations.
 */
export const requireMainAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isMainAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: SaaS Main Admin privilege required.'
    });
  }
  next();
};
