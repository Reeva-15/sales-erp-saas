import { prisma } from '../utils/prisma';
import { PricingService } from './pricing.service';
import { ApprovalService } from './approval.service';
import { AuditService } from './audit.service';

export interface CreateQuotationInput {
  tenantId: string;
  companyId?: string | null;
  branchId?: string | null;
  customerId: string;
  contactPerson?: string;
  salespersonId?: string;
  priceListId?: string;
  validDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  createdById: string;
  items: Array<{
    productId: string;
    quantity: number;
    description?: string;
    discountPercent?: number;
  }>;
}

export class QuotationService {
  private static async generateQuotationNumber(tenantId: string): Promise<string> {
    const count = await prisma.quotation.count({ where: { tenantId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `QT-${sequence}`;
  }

  static async create(input: CreateQuotationInput) {
    const { tenantId, companyId, branchId, customerId, items, createdById } = input;

    if (!items || items.length === 0) {
      throw new Error('Quotation must contain at least one line item.');
    }

    let salespersonId = input.salespersonId;
    if (!salespersonId && createdById) {
      const sp = await prisma.salesperson.findFirst({
        where: { tenantId, userId: createdById }
      });
      if (sp) salespersonId = sp.id;
    }

    const quotationNumber = await this.generateQuotationNumber(tenantId);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (input.validDays || 30));

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const processedItems: any[] = [];

    // Calculate line items authoritatively on backend using Pricing Engine
    for (const item of items) {
      const priceResult = await PricingService.calculateItemPrice({
        tenantId,
        customerId,
        productId: item.productId,
        quantity: item.quantity,
        priceListId: input.priceListId
      });

      // Get product tax info
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { tax: true }
      });

      const rate = priceResult.appliedRate;
      const userDiscountPercent = (item.discountPercent !== undefined && item.discountPercent !== null && Number(item.discountPercent) > 0)
        ? Number(item.discountPercent)
        : priceResult.discountPercent;
      const itemSubtotal = rate * item.quantity;
      const itemDiscountAmount = (itemSubtotal * userDiscountPercent) / 100;
      const taxableAmount = itemSubtotal - itemDiscountAmount;

      const taxPercent = product?.tax?.ratePercent || 0;
      const taxAmount = (taxableAmount * taxPercent) / 100;
      const lineTotal = taxableAmount + taxAmount;

      subtotal += itemSubtotal;
      discountTotal += itemDiscountAmount;
      taxTotal += taxAmount;

      processedItems.push({
        productId: item.productId,
        description: item.description || priceResult.productName,
        quantity: item.quantity,
        unitId: product?.unitId || null,
        rate,
        discountPercent: userDiscountPercent,
        discountAmount: itemDiscountAmount,
        taxPercent,
        taxAmount,
        lineTotal
      });
    }

    const rawGrandTotal = subtotal - discountTotal + taxTotal;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

    const avgDiscountPercent = subtotal > 0 ? (discountTotal / subtotal) * 100 : 0;

    // Evaluate approval requirement
    const approvalEval = await ApprovalService.evaluateQuotation({
      tenantId,
      quotationId: '',
      discountPercent: avgDiscountPercent,
      grandTotal
    });

    const initialStatus = approvalEval.autoApproved ? 'APPROVED' : 'DRAFT';

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        companyId: companyId || null,
        branchId: branchId || null,
        quotationNumber,
        quotationDate: new Date(),
        validUntil,
        customerId,
        contactPerson: input.contactPerson || null,
        salespersonId: salespersonId || null,
        priceListId: input.priceListId || null,
        paymentTerms: input.paymentTerms || 'Net 30',
        deliveryTerms: input.deliveryTerms || null,
        notes: input.notes || null,
        subtotal,
        discountTotal,
        taxTotal,
        roundOff,
        grandTotal,
        status: initialStatus,
        createdById,
        items: {
          create: processedItems
        }
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        salesperson: true,
        createdBy: true
      }
    });

    await AuditService.log({
      tenantId,
      userId: createdById,
      module: 'QUOTATION',
      action: 'CREATE',
      recordId: quotation.id,
      newValue: { quotationNumber, grandTotal, status: initialStatus }
    });

    return { quotation, approvalEval };
  }

  static async submitForApproval(quotationId: string, tenantId: string, userId: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId }
    });

    if (!quotation) throw new Error('Quotation not found.');
    if (quotation.status !== 'DRAFT') throw new Error('Only DRAFT quotations can be submitted for approval.');

    const avgDiscountPercent = quotation.subtotal > 0 ? (quotation.discountTotal / quotation.subtotal) * 100 : 0;
    const approvalEval = await ApprovalService.evaluateQuotation({
      tenantId,
      quotationId,
      discountPercent: avgDiscountPercent,
      grandTotal: quotation.grandTotal
    });

    const newStatus = approvalEval.autoApproved ? 'APPROVED' : 'PENDING_APPROVAL';

    const updated = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: newStatus }
    });

    await prisma.approvalHistory.create({
      data: {
        tenantId,
        documentType: 'QUOTATION',
        documentId: quotationId,
        approverUserId: userId,
        action: 'SUBMITTED',
        comment: approvalEval.message,
        previousStatus: 'DRAFT',
        newStatus
      }
    });

    return { quotation: updated, approvalEval };
  }

  static async getById(quotationId: string, tenantId: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: {
        customer: true,
        salesperson: true,
        createdBy: true,
        items: { include: { product: true } }
      }
    });
    if (!quotation) throw new Error('Quotation not found or access denied.');
    return quotation;
  }

  static async list(tenantId: string, queryParams: any = {}) {
    const { page = 1, limit = 20, search, status } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search } },
        { customer: { customerName: { contains: search } } }
      ];
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: { select: { customerName: true, customerCode: true } },
          salesperson: { select: { name: true, code: true } },
          createdBy: { select: { name: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.quotation.count({ where })
    ]);

    return { quotations, total, page: Number(page), limit: Number(limit) };
  }
}
