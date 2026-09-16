import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import { PricingService } from '../services/pricing.service';
import { QuotationService } from '../services/quotation.service';
import { ApprovalService } from '../services/approval.service';
import { SalesOrderService } from '../services/sales-order.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { DashboardService } from '../services/dashboard.service';
import { ReportService } from '../services/report.service';
import { CustomFieldService } from '../services/custom-field.service';
import { PdfService } from '../services/pdf.service';
import { AuditService } from '../services/audit.service';

const router = Router();
router.use(authenticateToken, requireTenant);

// -----------------------------------------------------------------------------
// 1. Dashboard
// -----------------------------------------------------------------------------
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const data = await DashboardService.getClientMetrics(req.tenantId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 1.5 Global Search
// -----------------------------------------------------------------------------
router.get('/global-search', async (req: AuthRequest, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { customers: [], products: [], quotations: [], salesOrders: [], invoices: [], tenants: [] } });
    }

    if (req.user?.isMainAdmin && !req.tenantId) {
      const [tenants, users] = await Promise.all([
        prisma.tenant.findMany({
          where: { OR: [{ name: { contains: q } }, { code: { contains: q } }, { email: { contains: q } }] },
          take: 5
        }),
        prisma.user.findMany({
          where: { OR: [{ name: { contains: q } }, { email: { contains: q } }, { username: { contains: q } }] },
          take: 5
        })
      ]);
      return res.json({ success: true, data: { tenants, users, customers: [], products: [], quotations: [], salesOrders: [], invoices: [] } });
    }

    const tenantId = req.tenantId!;

    const [customers, products, quotations, salesOrders, invoices] = await Promise.all([
      prisma.customer.findMany({
        where: { tenantId, OR: [{ customerName: { contains: q } }, { customerCode: { contains: q } }, { email: { contains: q } }, { gstin: { contains: q } }] },
        take: 5
      }),
      prisma.product.findMany({
        where: { tenantId, OR: [{ name: { contains: q } }, { productCode: { contains: q } }, { sku: { contains: q } }] },
        take: 5
      }),
      prisma.quotation.findMany({
        where: { tenantId, quotationNumber: { contains: q } },
        take: 5
      }),
      prisma.salesOrder.findMany({
        where: { tenantId, orderNumber: { contains: q } },
        take: 5
      }),
      prisma.invoice.findMany({
        where: { tenantId, invoiceNumber: { contains: q } },
        take: 5
      })
    ]);

    res.json({ success: true, data: { customers, products, quotations, salesOrders, invoices } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. Customers
// -----------------------------------------------------------------------------
router.get('/customers', async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.tenantId! },
      include: { customerGroup: true, salesperson: true, priceList: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: customers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/customers', async (req: AuthRequest, res) => {
  try {
    const { customerCode, customerName, customerType, contactPerson, mobile, email, gstin, pan, address, city, state, country, territory, salespersonId, customerGroupId, priceListId, paymentTerms, creditLimit, notes } = req.body;
    
    const customer = await prisma.customer.create({
      data: {
        tenantId: req.tenantId!,
        companyId: req.user?.companyId || null,
        branchId: req.user?.branchId || null,
        customerCode,
        customerName,
        customerType: customerType || 'BUSINESS',
        contactPerson,
        mobile,
        email,
        gstin,
        pan,
        address,
        city,
        state: state || 'Gujarat',
        country: country || 'India',
        territory,
        salespersonId: salespersonId || null,
        customerGroupId: customerGroupId || null,
        priceListId: priceListId || null,
        paymentTerms: paymentTerms || 'Net 30',
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        notes
      }
    });

    await AuditService.log({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      module: 'CUSTOMER',
      action: 'CREATE',
      recordId: customer.id,
      newValue: { customerCode, customerName }
    });

    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Customer Groups & Price Lists
// -----------------------------------------------------------------------------
router.get('/customer-groups', async (req: AuthRequest, res) => {
  const groups = await prisma.customerGroup.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: groups });
});

router.post('/customer-groups', async (req: AuthRequest, res) => {
  const { code, name, discountPercent } = req.body;
  const group = await prisma.customerGroup.create({
    data: { tenantId: req.tenantId!, code, name, discountPercent: Number(discountPercent || 0) }
  });
  res.json({ success: true, data: group });
});

router.get('/price-lists', async (req: AuthRequest, res) => {
  const lists = await prisma.priceList.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: lists });
});

router.post('/price-lists', async (req: AuthRequest, res) => {
  const { code, name, currency } = req.body;
  const list = await prisma.priceList.create({
    data: { tenantId: req.tenantId!, code, name, currency: currency || 'INR' }
  });
  res.json({ success: true, data: list });
});

import bcrypt from 'bcryptjs';

// -----------------------------------------------------------------------------
// 4. Products & Units & Taxes
// -----------------------------------------------------------------------------
router.get('/products', async (req: AuthRequest, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.tenantId! },
      include: { productGroup: true, unit: true, tax: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', async (req: AuthRequest, res) => {
  try {
    const { productCode, sku, name, category, description, unitId, sellingPrice, costPrice, taxId, hsnSac, minimumStock } = req.body;
    
    const product = await prisma.product.create({
      data: {
        tenantId: req.tenantId!,
        companyId: req.user?.companyId || null,
        productCode,
        sku: sku || productCode,
        name,
        category,
        description,
        unitId: unitId || null,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice || 0),
        taxId: taxId || null,
        hsnSac: hsnSac || '8414',
        minimumStock: Number(minimumStock || 0)
      }
    });

    await AuditService.log({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      module: 'PRODUCT',
      action: 'CREATE',
      recordId: product.id,
      newValue: { productCode, name, sellingPrice }
    });

    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/products/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { productCode, sku, name, category, description, unitId, sellingPrice, costPrice, taxId, hsnSac, minimumStock } = req.body;

    const product = await prisma.product.updateMany({
      where: { id, tenantId: req.tenantId! },
      data: {
        productCode,
        sku: sku || productCode,
        name,
        category,
        description,
        unitId: unitId || null,
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice || 0),
        taxId: taxId || null,
        hsnSac: hsnSac || '8414',
        minimumStock: Number(minimumStock || 0)
      }
    });

    await AuditService.log({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      module: 'PRODUCT',
      action: 'UPDATE',
      recordId: id,
      newValue: { productCode, name, sellingPrice }
    });

    res.json({ success: true, data: product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/units', async (req: AuthRequest, res) => {
  const units = await prisma.unit.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: units });
});

router.get('/taxes', async (req: AuthRequest, res) => {
  const taxes = await prisma.tax.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: taxes });
});

// -----------------------------------------------------------------------------
// 5. Salespersons
// -----------------------------------------------------------------------------
router.get('/salespersons', async (req: AuthRequest, res) => {
  const salespersons = await prisma.salesperson.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: salespersons });
});

router.post('/salespersons', async (req: AuthRequest, res) => {
  try {
    const { code, name, category, email, mobile, commissionPercent, status, password, permissions } = req.body;
    const tenantId = req.tenantId!;
    const loginPassword = password || 'Password@123';
    const passwordHash = await bcrypt.hash(loginPassword, 10);
    const username = code.toUpperCase();
    const permissionsStr = Array.isArray(permissions) 
      ? permissions.join(',') 
      : (permissions || 'DASHBOARD,CUSTOMER,ENQUIRY,QUOTATION,SALES_ORDER,INVOICE,PAYMENT');

    // Ensure User account exists for login
    let user = await prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (!user) {
      const role = await prisma.role.findFirst({
        where: {
          OR: [
            { tenantId, code: 'SALES_MANAGER' },
            { code: 'SALES_EXECUTIVE' }
          ]
        }
      });

      user = await prisma.user.create({
        data: {
          tenantId,
          companyId: req.user?.companyId || null,
          branchId: req.user?.branchId || null,
          name,
          email: email || `${code.toLowerCase()}@tenant.com`,
          username,
          passwordHash,
          roleId: role?.id || null,
          status: status || 'ACTIVE'
        }
      });
    }

    const sp = await prisma.salesperson.create({
      data: {
        tenantId,
        companyId: req.user?.companyId || null,
        branchId: req.user?.branchId || null,
        userId: user.id,
        code: username,
        name,
        category: category || 'Sales Manager',
        email: email || null,
        mobile: mobile || null,
        commissionPercent: Number(commissionPercent || 0),
        status: status || 'ACTIVE',
        permissions: permissionsStr
      }
    });

    res.json({ success: true, data: { ...sp, loginUsername: username, defaultPassword: loginPassword } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/salespersons/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { code, name, category, email, mobile, commissionPercent, status, password, permissions } = req.body;
    const tenantId = req.tenantId!;
    const username = code.toUpperCase();
    const permissionsStr = Array.isArray(permissions) 
      ? permissions.join(',') 
      : (permissions !== undefined ? permissions : undefined);

    const existingSp = await prisma.salesperson.findFirst({ where: { id, tenantId } });
    if (!existingSp) throw new Error('Salesperson not found.');

    let userId = existingSp.userId;

    if (userId) {
      const updateData: any = { name, email: email || undefined, status: status || 'ACTIVE' };
      if (password && password.length >= 6) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      await prisma.user.update({ where: { id: userId }, data: updateData });
    } else {
      const loginPassword = password || 'Password@123';
      const passwordHash = await bcrypt.hash(loginPassword, 10);
      const newUser = await prisma.user.create({
        data: {
          tenantId,
          name,
          email: email || `${code.toLowerCase()}@tenant.com`,
          username,
          passwordHash,
          status: status || 'ACTIVE'
        }
      });
      userId = newUser.id;
    }

    const updateSpData: any = {
      userId,
      code: username,
      name,
      category: category || 'Sales Manager',
      email: email || null,
      mobile: mobile || null,
      commissionPercent: Number(commissionPercent || 0),
      status: status || 'ACTIVE'
    };

    if (permissionsStr !== undefined) {
      updateSpData.permissions = permissionsStr;
    }

    const sp = await prisma.salesperson.update({
      where: { id },
      data: updateSpData
    });

    await AuditService.log({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      module: 'SALESPERSON',
      action: 'UPDATE',
      recordId: id,
      newValue: { code, name, email }
    });

    res.json({ success: true, data: sp });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5.5 Privacy & Security Password Management
// -----------------------------------------------------------------------------
router.get('/privacy-security/accounts', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.tenantId!;

    const [users, salespersons, customers] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true, username: true, role: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesperson.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true, code: true, mobile: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.findMany({
        where: { tenantId },
        select: { id: true, customerName: true, email: true, customerCode: true, mobile: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({ success: true, data: { users, salespersons, customers } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/privacy-security/reset-password', async (req: AuthRequest, res) => {
  try {
    const { accountType, accountId, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const tenantId = req.tenantId!;

    if (accountType === 'USER') {
      await prisma.user.updateMany({
        where: { id: accountId, tenantId },
        data: { passwordHash }
      });
    } else if (accountType === 'SALESPERSON') {
      const sp = await prisma.salesperson.findFirst({ where: { id: accountId, tenantId } });
      if (sp) {
        if (sp.userId) {
          await prisma.user.update({ where: { id: sp.userId }, data: { passwordHash } });
        } else {
          const newUser = await prisma.user.create({
            data: {
              tenantId,
              name: sp.name,
              email: sp.email || `${sp.code.toLowerCase()}@tenant.com`,
              username: sp.code.toUpperCase(),
              passwordHash,
              status: 'ACTIVE'
            }
          });
          await prisma.salesperson.update({ where: { id: sp.id }, data: { userId: newUser.id } });
        }
      }
    } else if (accountType === 'CUSTOMER') {
      const cust = await prisma.customer.findFirst({ where: { id: accountId, tenantId } });
      if (cust?.email) {
        await prisma.user.updateMany({
          where: { email: cust.email, tenantId },
          data: { passwordHash }
        });
      }
    }

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      module: 'SECURITY',
      action: 'RESET_PASSWORD',
      recordId: accountId,
      newValue: { accountType, resetAt: new Date() }
    });

    res.json({ success: true, data: { message: `Password reset successfully.` } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. Dynamic Pricing Rules
// -----------------------------------------------------------------------------
router.get('/pricing-rules', async (req: AuthRequest, res) => {
  const rules = await prisma.pricingRule.findMany({
    where: { tenantId: req.tenantId! },
    include: { product: true, customer: true, customerGroup: true },
    orderBy: { priority: 'asc' }
  });
  res.json({ success: true, data: rules });
});

router.post('/pricing-rules', async (req: AuthRequest, res) => {
  try {
    const { priority, ruleType, customerId, customerGroupId, priceListId, productId, minQty, maxQty, rate, discountPercent } = req.body;
    const rule = await prisma.pricingRule.create({
      data: {
        tenantId: req.tenantId!,
        priority: Number(priority || 1),
        ruleType,
        customerId: customerId || null,
        customerGroupId: customerGroupId || null,
        priceListId: priceListId || null,
        productId,
        minQty: Number(minQty || 1),
        maxQty: maxQty ? Number(maxQty) : null,
        rate: Number(rate),
        discountPercent: Number(discountPercent || 0)
      }
    });
    res.json({ success: true, data: rule });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/pricing/calculate', async (req: AuthRequest, res) => {
  try {
    const { customerId, productId, quantity, priceListId } = req.body;
    const result = await PricingService.calculateItemPrice({
      tenantId: req.tenantId!,
      customerId,
      productId,
      quantity: Number(quantity || 1),
      priceListId
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. Enquiry Management
// -----------------------------------------------------------------------------
router.get('/enquiries', async (req: AuthRequest, res) => {
  const enquiries = await prisma.enquiry.findMany({
    where: { tenantId: req.tenantId! },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: enquiries });
});

router.post('/enquiries', async (req: AuthRequest, res) => {
  try {
    const { customerId, contactPerson, contactDetails, salespersonId, source, expectedValue, items, notes } = req.body;
    const count = await prisma.enquiry.count({ where: { tenantId: req.tenantId! } });
    const enquiryNumber = `ENQ-${String(count + 1).padStart(5, '0')}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        tenantId: req.tenantId!,
        companyId: req.user?.companyId || null,
        branchId: req.user?.branchId || null,
        enquiryNumber,
        customerId,
        contactPerson,
        contactDetails,
        salespersonId: salespersonId || null,
        source: source || 'Direct',
        expectedValue: Number(expectedValue || 0),
        notes,
        status: 'OPEN',
        items: {
          create: (items || []).map((it: any) => ({
            productId: it.productId,
            quantity: Number(it.quantity),
            expectedPrice: it.expectedPrice ? Number(it.expectedPrice) : null,
            description: it.description
          }))
        }
      },
      include: { customer: true, items: { include: { product: true } } }
    });

    res.json({ success: true, data: enquiry });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 8. Quotations
// -----------------------------------------------------------------------------
router.get('/quotations', async (req: AuthRequest, res) => {
  try {
    const result = await QuotationService.list(req.tenantId!, req.query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/quotations/:id', async (req: AuthRequest, res) => {
  try {
    const quotation = await QuotationService.getById(req.params.id, req.tenantId!);
    res.json({ success: true, data: quotation });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

router.post('/quotations', async (req: AuthRequest, res) => {
  try {
    const result = await QuotationService.create({
      ...req.body,
      tenantId: req.tenantId!,
      companyId: req.user?.companyId,
      branchId: req.user?.branchId,
      createdById: req.user!.id
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/quotations/:id/submit', async (req: AuthRequest, res) => {
  try {
    const result = await QuotationService.submitForApproval(req.params.id, req.tenantId!, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/quotations/:id/pdf', async (req: AuthRequest, res) => {
  try {
    const quotation = await QuotationService.getById(req.params.id, req.tenantId!);
    const pdfBuffer = await PdfService.generateQuotationPdf(quotation);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${quotation.quotationNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 9. Approvals Engine
// -----------------------------------------------------------------------------
router.get('/approvals/pending', async (req: AuthRequest, res) => {
  const pendingQuotations = await prisma.quotation.findMany({
    where: { tenantId: req.tenantId!, status: 'PENDING_APPROVAL' },
    include: { customer: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: pendingQuotations });
});

router.post('/approvals/action', async (req: AuthRequest, res) => {
  try {
    const { documentType, documentId, action, comment } = req.body;
    const result = await ApprovalService.processAction({
      tenantId: req.tenantId!,
      documentType: documentType || 'QUOTATION',
      documentId,
      userId: req.user!.id,
      action,
      comment
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 10. Sales Orders
// -----------------------------------------------------------------------------
router.get('/sales-orders', async (req: AuthRequest, res) => {
  try {
    const result = await SalesOrderService.list(req.tenantId!, req.query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sales-orders/:id', async (req: AuthRequest, res) => {
  try {
    const salesOrder = await SalesOrderService.getById(req.params.id, req.tenantId!);
    res.json({ success: true, data: salesOrder });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

router.post('/sales-orders/convert-quotation/:quotationId', async (req: AuthRequest, res) => {
  try {
    const salesOrder = await SalesOrderService.convertFromQuotation(req.params.quotationId, req.tenantId!, req.user!.id);
    res.json({ success: true, data: salesOrder });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 11. Invoices
// -----------------------------------------------------------------------------
router.get('/invoices', async (req: AuthRequest, res) => {
  try {
    const result = await InvoiceService.list(req.tenantId!, req.query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/invoices/:id', async (req: AuthRequest, res) => {
  try {
    const invoice = await InvoiceService.getById(req.params.id, req.tenantId!);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

router.post('/invoices/convert-sales-order/:orderId', async (req: AuthRequest, res) => {
  try {
    const invoice = await InvoiceService.convertFromSalesOrder(req.params.orderId, req.tenantId!, req.user!.id);
    res.json({ success: true, data: invoice });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/invoices/:id/pdf', async (req: AuthRequest, res) => {
  try {
    const invoice = await InvoiceService.getById(req.params.id, req.tenantId!);
    const pdfBuffer = await PdfService.generateInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 12. Payments
// -----------------------------------------------------------------------------
router.get('/payments', async (req: AuthRequest, res) => {
  try {
    const result = await PaymentService.list(req.tenantId!, req.query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/payments', async (req: AuthRequest, res) => {
  try {
    const result = await PaymentService.recordPayment({
      ...req.body,
      tenantId: req.tenantId!,
      companyId: req.user?.companyId,
      branchId: req.user?.branchId,
      createdById: req.user!.id
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 13. Reports
// -----------------------------------------------------------------------------
router.get('/reports/sales-summary', async (req: AuthRequest, res) => {
  const result = await ReportService.getSalesSummary(req.tenantId!, req.query.startDate as string, req.query.endDate as string);
  res.json({ success: true, data: result });
});

router.get('/reports/customer-wise', async (req: AuthRequest, res) => {
  const result = await ReportService.getCustomerWiseSales(req.tenantId!);
  res.json({ success: true, data: result });
});

router.get('/reports/product-wise', async (req: AuthRequest, res) => {
  const result = await ReportService.getProductWiseSales(req.tenantId!);
  res.json({ success: true, data: result });
});

router.get('/reports/aging', async (req: AuthRequest, res) => {
  const result = await ReportService.getAgingReport(req.tenantId!);
  res.json({ success: true, data: result });
});

// -----------------------------------------------------------------------------
// 14. Custom Fields
// -----------------------------------------------------------------------------
router.get('/custom-fields/:module', async (req: AuthRequest, res) => {
  const fields = await CustomFieldService.getFieldsForModule(req.tenantId!, req.params.module.toUpperCase());
  res.json({ success: true, data: fields });
});

router.post('/custom-fields', async (req: AuthRequest, res) => {
  try {
    const field = await CustomFieldService.createField({
      ...req.body,
      tenantId: req.tenantId!
    });
    res.json({ success: true, data: field });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 15. Audit Logs
// -----------------------------------------------------------------------------
router.get('/audit-logs', async (req: AuthRequest, res) => {
  const result = await AuditService.getLogs(req.tenantId!, req.query);
  res.json({ success: true, data: result });
});

export default router;
