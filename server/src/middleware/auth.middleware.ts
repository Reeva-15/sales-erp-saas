import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string | null;
    companyId: string | null;
    branchId: string | null;
    departmentId: string | null;
    roleId: string | null;
    roleCode?: string;
    isMainAdmin: boolean;
    name: string;
    email: string;
  };
  tenantId?: string;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;

    // Fetch live user to ensure active status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        tenant: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'User session invalid or account inactive.' });
    }

    if (user.tenantId && user.tenant && user.tenant.status !== 'ACTIVE' && user.tenant.status !== 'TRIAL') {
      return res.status(403).json({ success: false, error: 'Tenant account suspended or inactive.' });
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      branchId: user.branchId,
      departmentId: user.departmentId,
      roleId: user.roleId,
      roleCode: user.role?.code,
      isMainAdmin: user.isMainAdmin,
      name: user.name,
      email: user.email
    };

    // Strictly derive tenant context from backend user record
    if (user.tenantId) {
      req.tenantId = user.tenantId;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};
