import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { AuditService } from './audit.service';

export interface CreateClientInput {
  name: string;
  code: string;
  contactPerson?: string;
  email: string;
  mobile?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  gstin?: string;
  logo?: string;
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  trialDays?: number;
  status?: string;
  enabledFeatureCodes?: string[];
}

export class TenantService {
  static async createTenant(input: CreateClientInput, mainAdminUserId?: string) {
    const existing = await prisma.tenant.findUnique({ where: { code: input.code } });
    if (existing) {
      throw new Error(`Tenant code '${input.code}' already exists.`);
    }

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + (input.trialDays || 14));

    const tenant = await prisma.tenant.create({
      data: {
        code: input.code,
        name: input.name,
        contactPerson: input.contactPerson || null,
        email: input.email,
        mobile: input.mobile || null,
        address: input.address || null,
        country: input.country || 'India',
        state: input.state || null,
        city: input.city || null,
        gstin: input.gstin || null,
        logo: input.logo || null,
        status: input.status || 'ACTIVE',
        trialStartDate,
        trialEndDate
      }
    });

    // Create default features list
    const defaultFeatures = [
      'CRM', 'ENQUIRY', 'PRICING', 'QUOTATION', 'APPROVAL', 'SALES_ORDER', 'INVOICE', 'PAYMENT', 'REPORTS', 'CUSTOM_FIELDS', 'WORKFLOW'
    ];
    const featuresToEnable = input.enabledFeatureCodes && input.enabledFeatureCodes.length > 0 ? input.enabledFeatureCodes : defaultFeatures;

    for (const fCode of featuresToEnable) {
      await prisma.tenantFeature.upsert({
        where: { tenantId_featureCode: { tenantId: tenant.id, featureCode: fCode } },
        create: { tenantId: tenant.id, featureCode: fCode, isEnabled: true },
        update: { isEnabled: true }
      });
    }

    // Create default Client Admin Role for tenant
    const adminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        code: 'CLIENT_ADMIN',
        name: 'Client Administrator',
        description: 'Full administrative control over tenant ERP',
        isSystemRole: true
      }
    });

    // Create default Sales Manager & Executive roles
    await prisma.role.createMany({
      data: [
        { tenantId: tenant.id, code: 'SALES_MANAGER', name: 'Sales Manager', isSystemRole: false },
        { tenantId: tenant.id, code: 'SALES_EXECUTIVE', name: 'Sales Executive', isSystemRole: false }
      ]
    });

    // Create default company for tenant
    const company = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        code: 'HO',
        name: `${input.name} Head Office`,
        state: input.state || 'Gujarat',
        country: input.country || 'India',
        gstin: input.gstin
      }
    });

    // Create default branch
    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        code: 'MAIN',
        name: 'Main Branch',
        state: input.state || 'Gujarat'
      }
    });

    // Create default Client Admin User
    const passwordHash = await bcrypt.hash(input.adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        branchId: branch.id,
        name: input.adminName,
        email: input.email,
        mobile: input.mobile,
        username: input.adminUsername,
        passwordHash,
        roleId: adminRole.id,
        status: 'ACTIVE'
      }
    });

    // Create default units & taxes
    await prisma.unit.createMany({
      data: [
        { tenantId: tenant.id, code: 'PCS', name: 'Pieces' },
        { tenantId: tenant.id, code: 'KG', name: 'Kilograms' },
        { tenantId: tenant.id, code: 'SET', name: 'Set' }
      ]
    });

    await prisma.tax.create({
      data: {
        tenantId: tenant.id,
        name: 'GST 18%',
        ratePercent: 18,
        hsnSac: '8414',
        taxType: 'GST'
      }
    });

    await AuditService.log({
      userId: mainAdminUserId,
      module: 'TENANT',
      action: 'CREATE_CLIENT',
      recordId: tenant.id,
      newValue: { name: tenant.name, code: tenant.code, adminUser: adminUser.email }
    });

    return { tenant, adminUser };
  }

  static async listTenants(queryParams: any = {}) {
    const { search, status, page = 1, limit = 20 } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          users: { select: { id: true } },
          tenantFeatures: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.tenant.count({ where })
    ]);

    return { tenants, total, page: Number(page), limit: Number(limit) };
  }

  static async updateTenantFeatures(tenantId: string, featureCodes: string[]) {
    // Disable all existing
    await prisma.tenantFeature.updateMany({
      where: { tenantId },
      data: { isEnabled: false }
    });

    // Upsert active ones
    for (const fCode of featureCodes) {
      await prisma.tenantFeature.upsert({
        where: { tenantId_featureCode: { tenantId, featureCode: fCode } },
        create: { tenantId, featureCode: fCode, isEnabled: true },
        update: { isEnabled: true }
      });
    }

    return { success: true, enabledFeatures: featureCodes };
  }

  static async updateStatus(tenantId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL') {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status }
    });
    return updated;
  }

  static async updateTenant(tenantId: string, data: { name?: string; code?: string; contactPerson?: string; email?: string; mobile?: string; address?: string; city?: string; state?: string; gstin?: string; status?: string }) {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.email && { email: data.email }),
        ...(data.mobile !== undefined && { mobile: data.mobile }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.gstin !== undefined && { gstin: data.gstin }),
        ...(data.status && { status: data.status })
      }
    });
    return updated;
  }

  static async updateSubscription(tenantId: string, data: { status?: string; trialEndDate?: Date; planId?: string; trialDays?: number }) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.planId) updateData.planId = data.planId;
    if (data.trialDays) {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + Number(data.trialDays));
      updateData.trialEndDate = newEndDate;
    } else if (data.trialEndDate) {
      updateData.trialEndDate = new Date(data.trialEndDate);
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData
    });
    return updated;
  }
}
