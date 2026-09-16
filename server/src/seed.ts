import { prisma } from './utils/prisma';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[MARRONEX SEED] Starting Database Initialization...');

  // 1. Core System Features
  const features = [
    { code: 'CRM', name: 'Customer Relationship Management', category: 'CRM' },
    { code: 'ENQUIRY', name: 'Enquiry Management', category: 'SALES' },
    { code: 'PRICING', name: 'Dynamic Pricing Engine', category: 'SALES' },
    { code: 'QUOTATION', name: 'Quotation & Estimation', category: 'SALES' },
    { code: 'APPROVAL', name: 'Quotation Approval Engine', category: 'SALES' },
    { code: 'SALES_ORDER', name: 'Sales Order Processing', category: 'SALES' },
    { code: 'INVOICE', name: 'Tax Invoicing', category: 'FINANCE' },
    { code: 'PAYMENT', name: 'Payment Collection & Allocations', category: 'FINANCE' },
    { code: 'REPORTS', name: 'Sales & Aging Analytics Reports', category: 'ANALYTICS' },
    { code: 'CUSTOM_FIELDS', name: 'Dynamic Custom Fields Engine', category: 'SYSTEM' },
    { code: 'WORKFLOW', name: 'Workflow Engine', category: 'SYSTEM' }
  ];

  for (const f of features) {
    await prisma.feature.upsert({
      where: { code: f.code },
      create: f,
      update: f
    });
  }

  // 2. Default System Permissions
  const modules = ['CUSTOMER', 'PRODUCT', 'ENQUIRY', 'QUOTATION', 'SALES_ORDER', 'INVOICE', 'PAYMENT', 'REPORT', 'USER', 'ROLE'];
  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL', 'EXPORT', 'PRINT'];

  for (const mod of modules) {
    for (const act of actions) {
      await prisma.permission.upsert({
        where: { module_action: { module: mod, action: act } },
        create: { module: mod, action: act, name: `${act} ${mod}` },
        update: {}
      });
    }
  }

  // 3. Create SaaS Main Admin User
  const mainAdminPassword = await bcrypt.hash('Admin@123', 10);
  const mainAdmin = await prisma.user.upsert({
    where: { email: 'admin@marronex.com' },
    create: {
      name: 'SaaS Main Administrator',
      email: 'admin@marronex.com',
      username: 'mainadmin',
      passwordHash: mainAdminPassword,
      isMainAdmin: true,
      status: 'ACTIVE'
    },
    update: {
      passwordHash: mainAdminPassword
    }
  });

  console.log('[MARRONEX SEED] SaaS Main Admin Created:', mainAdmin.email);

  // 4. Create Demo Seed Tenant: ABC Industries
  const existingTenant = await prisma.tenant.findUnique({ where: { code: 'ABC' } });
  if (!existingTenant) {
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    const tenant = await prisma.tenant.create({
      data: {
        code: 'ABC',
        name: 'ABC Industries Pvt Ltd',
        contactPerson: 'Rahul Shah',
        email: 'info@abcindustries.com',
        mobile: '+91 9876543210',
        address: '101 Industrial Estate, GIDC',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        gstin: '24AAAAA0000A1Z5',
        status: 'TRIAL',
        trialStartDate,
        trialEndDate
      }
    });

    // Enable features for tenant
    for (const f of features) {
      await prisma.tenantFeature.create({
        data: { tenantId: tenant.id, featureCode: f.code, isEnabled: true }
      });
    }

    // Tenant Roles
    const clientAdminRole = await prisma.role.create({
      data: { tenantId: tenant.id, code: 'CLIENT_ADMIN', name: 'Client Admin', isSystemRole: true }
    });
    const managerRole = await prisma.role.create({
      data: { tenantId: tenant.id, code: 'SALES_MANAGER', name: 'Sales Manager', isSystemRole: false }
    });
    const execRole = await prisma.role.create({
      data: { tenantId: tenant.id, code: 'SALES_EXECUTIVE', name: 'Sales Executive', isSystemRole: false }
    });

    // Company & Branch
    const company = await prisma.company.create({
      data: { tenantId: tenant.id, code: 'HO', name: 'ABC HQ', state: 'Gujarat', gstin: '24AAAAA0000A1Z5' }
    });
    const branch = await prisma.branch.create({
      data: { tenantId: tenant.id, companyId: company.id, code: 'MAIN', name: 'Ahmedabad Plant', state: 'Gujarat' }
    });

    // Users
    const clientAdminPassword = await bcrypt.hash('Client@123', 10);
    const clientAdminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        branchId: branch.id,
        name: 'Rahul Shah (Client Admin)',
        email: 'rahul@abcindustries.com',
        username: 'clientadmin',
        passwordHash: clientAdminPassword,
        roleId: clientAdminRole.id,
        status: 'ACTIVE'
      }
    });

    const managerUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        branchId: branch.id,
        name: 'Vikram Mehta (Sales Manager)',
        email: 'vikram@abcindustries.com',
        username: 'salesmanager',
        passwordHash: clientAdminPassword,
        roleId: managerRole.id,
        status: 'ACTIVE'
      }
    });

    // Salesperson
    const salesperson = await prisma.salesperson.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        branchId: branch.id,
        userId: managerUser.id,
        code: 'SP-001',
        name: 'Vikram Mehta',
        email: 'vikram@abcindustries.com',
        commissionPercent: 2.5
      }
    });

    // Masters: Units, Taxes, Customer Groups, Products, Customers
    const unitPcs = await prisma.unit.create({
      data: { tenantId: tenant.id, code: 'PCS', name: 'Pieces' }
    });

    const tax18 = await prisma.tax.create({
      data: { tenantId: tenant.id, name: 'GST 18%', ratePercent: 18, hsnSac: '8414', taxType: 'GST' }
    });

    const vipGroup = await prisma.customerGroup.create({
      data: { tenantId: tenant.id, code: 'VIP', name: 'VIP Distributors', discountPercent: 8 }
    });

    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        branchId: branch.id,
        customerCode: 'CUST-101',
        customerName: 'XYZ Ltd',
        contactPerson: 'Amit Patel',
        mobile: '+91 9900011122',
        email: 'purchasing@xyzltd.com',
        gstin: '24BBBBB1111B1Z2',
        address: '402 Commerce Tower, Ring Road',
        city: 'Surat',
        state: 'Gujarat',
        country: 'India',
        salespersonId: salesperson.id,
        customerGroupId: vipGroup.id,
        paymentTerms: 'Net 30'
      }
    });

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        productCode: 'IND-MTR-5HP',
        sku: 'MTR-5HP-3P',
        name: 'Industrial Motor 5HP 3-Phase',
        category: 'Motors',
        description: 'Heavy duty 5HP 3-Phase Induction Motor',
        unitId: unitPcs.id,
        sellingPrice: 10000,
        costPrice: 6500,
        taxId: tax18.id,
        hsnSac: '8414',
        minimumStock: 10
      }
    });

    // Pricing Rule
    await prisma.pricingRule.create({
      data: {
        tenantId: tenant.id,
        priority: 2,
        ruleType: 'CUSTOMER_GROUP',
        customerGroupId: vipGroup.id,
        productId: product.id,
        minQty: 1,
        rate: 9500,
        discountPercent: 5
      }
    });

    console.log('[MARRONEX SEED] ABC Industries Tenant Seed Completed Successfully.');
  }

  console.log('[MARRONEX SEED] Done!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
