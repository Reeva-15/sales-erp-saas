import { prisma } from '../utils/prisma';
import { AuditService } from './audit.service';

export class InvoiceService {
  private static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await prisma.invoice.count({ where: { tenantId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `INV-${sequence}`;
  }

  static async convertFromSalesOrder(salesOrderId: string, tenantId: string, createdById: string) {
    const salesOrder = await prisma.salesOrder.findFirst({
      where: { id: salesOrderId, tenantId },
      include: { items: true, customer: true }
    });

    if (!salesOrder) throw new Error('Sales Order not found.');
    if (salesOrder.status === 'CANCELLED') {
      throw new Error('Cannot generate invoice for a CANCELLED Sales Order.');
    }

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Fetch Branch or Company GST State for Intra-state vs Inter-state determination
    let tenantState = 'Gujarat';
    if (salesOrder.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: salesOrder.branchId } });
      if (branch?.state) tenantState = branch.state;
    } else if (salesOrder.companyId) {
      const company = await prisma.company.findUnique({ where: { id: salesOrder.companyId } });
      if (company?.state) tenantState = company.state;
    }

    const customerState = salesOrder.customer.state || tenantState;
    const isIntraState = tenantState.toLowerCase().trim() === customerState.toLowerCase().trim();

    let subtotal = 0;
    let discountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let taxTotal = 0;

    const invoiceItems: any[] = [];

    for (const item of salesOrder.items) {
      const itemSubtotal = item.rate * item.quantity;
      const itemDiscountAmount = (itemSubtotal * item.discountPercent) / 100;
      const taxableAmount = itemSubtotal - itemDiscountAmount;

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (isIntraState) {
        cgstAmount = (taxableAmount * (item.taxPercent / 2)) / 100;
        sgstAmount = (taxableAmount * (item.taxPercent / 2)) / 100;
      } else {
        igstAmount = (taxableAmount * item.taxPercent) / 100;
      }

      const itemTaxAmount = cgstAmount + sgstAmount + igstAmount;
      const lineTotal = taxableAmount + itemTaxAmount;

      subtotal += itemSubtotal;
      discountTotal += itemDiscountAmount;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;
      taxTotal += itemTaxAmount;

      invoiceItems.push({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitId: item.unitId,
        rate: item.rate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        cgstAmount,
        sgstAmount,
        igstAmount,
        lineTotal
      });
    }

    const rawGrandTotal = subtotal - discountTotal + taxTotal;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        companyId: salesOrder.companyId,
        branchId: salesOrder.branchId,
        invoiceNumber,
        invoiceDate: new Date(),
        salesOrderId: salesOrder.id,
        customerId: salesOrder.customerId,
        customerGstin: salesOrder.customer.gstin,
        billingAddress: salesOrder.customer.address,
        shippingAddress: salesOrder.customer.address,
        paymentTerms: salesOrder.paymentTerms,
        notes: salesOrder.notes,
        subtotal,
        discountTotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        taxTotal,
        roundOff,
        grandTotal,
        paidAmount: 0,
        balanceAmount: grandTotal,
        status: 'POSTED',
        createdById,
        items: {
          create: invoiceItems
        }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    // Update Sales Order status to COMPLETED
    await prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: 'COMPLETED' }
    });

    await AuditService.log({
      tenantId,
      userId: createdById,
      module: 'INVOICE',
      action: 'CONVERT_FROM_SALES_ORDER',
      recordId: invoice.id,
      newValue: { invoiceNumber, salesOrderId, grandTotal }
    });

    return invoice;
  }

  static async getById(invoiceId: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        customer: true,
        salesOrder: true,
        items: { include: { product: true } },
        allocations: { include: { payment: true } }
      }
    });
    if (!invoice) throw new Error('Invoice not found.');
    return invoice;
  }

  static async list(tenantId: string, queryParams: any = {}) {
    const { page = 1, limit = 20, search, status } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { customerName: { contains: search } } }
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { customerName: true, customerCode: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.invoice.count({ where })
    ]);

    return { invoices, total, page: Number(page), limit: Number(limit) };
  }
}
