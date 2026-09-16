import { prisma } from '../utils/prisma';

export interface CreateAuditLogParams {
  tenantId?: string | null;
  companyId?: string | null;
  userId?: string | null;
  module: string;
  action: string;
  recordId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId || null,
          companyId: params.companyId || null,
          userId: params.userId || null,
          module: params.module,
          action: params.action,
          recordId: params.recordId || null,
          oldValueJson: params.oldValue ? JSON.stringify(params.oldValue) : null,
          newValueJson: params.newValue ? JSON.stringify(params.newValue) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null
        }
      });
    } catch (err) {
      console.error('[Audit Log Error]', err);
    }
  }

  static async getLogs(tenantId?: string, queryParams: any = {}) {
    const { page = 1, limit = 20, module, action, userId } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total, page: Number(page), limit: Number(limit) };
  }
}
