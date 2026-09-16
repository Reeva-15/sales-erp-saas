import { prisma } from '../utils/prisma';
import { AuditService } from './audit.service';

export class SalesOrderService {
  private static async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await prisma.salesOrder.count({ where: { tenantId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `SO-${sequence}`;
  }

  static async convertFromQuotation(quotationId: string, tenantId: string, createdById: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: { items: true, customer: true }
    });

    if (!quotation) throw new Error('Quotation not found.');
    if (quotation.status !== 'APPROVED') {
      throw new Error(`Only APPROVED quotations can be converted to Sales Orders. Current status: ${quotation.status}`);
    }

    const orderNumber = await this.generateOrderNumber(tenantId);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const orderItems = quotation.items.map((item) => ({
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitId: item.unitId,
      rate: item.rate,
      discountPercent: item.discountPercent,
      discountAmount: item.discountAmount,
      taxPercent: item.taxPercent,
      taxAmount: item.taxAmount,
      lineTotal: item.lineTotal
    }));

    const salesOrder = await prisma.salesOrder.create({
      data: {
        tenantId,
        companyId: quotation.companyId,
        branchId: quotation.branchId,
        orderNumber,
        orderDate: new Date(),
        quotationId: quotation.id,
        customerId: quotation.customerId,
        salespersonId: quotation.salespersonId,
        deliveryDate,
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
        notes: quotation.notes,
        subtotal: quotation.subtotal,
        discountTotal: quotation.discountTotal,
        taxTotal: quotation.taxTotal,
        roundOff: quotation.roundOff,
        grandTotal: quotation.grandTotal,
        status: 'CONFIRMED',
        createdById,
        items: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    // Update Quotation status to ACCEPTED
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: 'ACCEPTED' }
    });

    await AuditService.log({
      tenantId,
      userId: createdById,
      module: 'SALES_ORDER',
      action: 'CONVERT_FROM_QUOTATION',
      recordId: salesOrder.id,
      newValue: { orderNumber, quotationId, grandTotal: salesOrder.grandTotal }
    });

    return salesOrder;
  }

  static async getById(orderId: string, tenantId: string) {
    const salesOrder = await prisma.salesOrder.findFirst({
      where: { id: orderId, tenantId },
      include: {
        customer: true,
        salesperson: true,
        quotation: true,
        items: { include: { product: true } }
      }
    });
    if (!salesOrder) throw new Error('Sales Order not found.');
    return salesOrder;
  }

  static async list(tenantId: string, queryParams: any = {}) {
    const { page = 1, limit = 20, search, status } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { customerName: { contains: search } } }
      ];
    }

    const [salesOrders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { customerName: true, customerCode: true } },
          salesperson: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.salesOrder.count({ where })
    ]);

    return { salesOrders, total, page: Number(page), limit: Number(limit) };
  }
}
