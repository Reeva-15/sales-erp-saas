import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../utils/prisma';

export const requirePermission = (module: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      // SaaS Main Admin or Client Admin (system role) bypasses standard role restrictions
      if (req.user.isMainAdmin || req.user.roleCode === 'CLIENT_ADMIN') {
        return next();
      }

      if (!req.user.roleId) {
        return res.status(403).json({ success: false, error: 'Access Denied: No role assigned.' });
      }

      // Find permission
      const perm = await prisma.permission.findFirst({
        where: { module, action }
      });

      if (!perm) {
        // If permission record not found in system table, allow fallback or deny based on strictness
        return next();
      }

      const rolePerm = await prisma.rolePermission.findFirst({
        where: {
          roleId: req.user.roleId,
          permissionId: perm.id
        }
      });

      if (!rolePerm) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: Insufficient permission to ${action.toLowerCase()} ${module.toLowerCase()}.`
        });
      }

      // Attach scope for query building in services
      (req as any).permissionScope = rolePerm.scope;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to authorize permission.' });
    }
  };
};
