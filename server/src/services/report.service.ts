import { prisma } from '../utils/prisma';

export class ReportService {
  /**
   * Sales Summary Report
   */
  static async getSalesSummary(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId, status: { not: 'CANCELLED' } };
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true }
    });

    const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

    return {
      totalInvoices: invoices.length,
      totalSales,
      totalCollected,
      totalOutstanding,
      invoices
    };
  }

  /**
   * Customer-wise Sales Report
   */
  static async getCustomerWiseSales(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        invoices: {
          where: { status: { not: 'CANCELLED' } }
        }
      }
    });

    return customers.map((c) => {
      const totalInvoices = c.invoices.length;
      const totalRevenue = c.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalOutstanding = c.invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
      return {
        customerId: c.id,
        customerCode: c.customerCode,
        customerName: c.customerName,
        totalInvoices,
        totalRevenue,
        totalOutstanding
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Product-wise Sales Report
   */
  static async getProductWiseSales(tenantId: string) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        invoiceItems: {
          include: { invoice: true }
        }
      }
    });

    return products.map((p) => {
      const validItems = p.invoiceItems.filter((item) => item.invoice.status !== 'CANCELLED');
      const totalQuantitySold = validItems.reduce((sum, i) => sum + i.quantity, 0);
      const totalRevenue = validItems.reduce((sum, i) => sum + i.lineTotal, 0);
      return {
        productId: p.id,
        productCode: p.productCode,
        productName: p.name,
        totalQuantitySold,
        totalRevenue
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Outstanding Aging Report (0-30, 31-60, 61-90, 90+ Days)
   */
  static async getAgingReport(tenantId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        balanceAmount: { gt: 0 },
        status: { not: 'CANCELLED' }
      },
      include: { customer: true }
    });

    const now = new Date();

    const aging = {
      bin0to30: 0,
      bin31to60: 0,
      bin61to90: 0,
      bin90Plus: 0,
      totalOutstanding: 0,
      records: [] as any[]
    };

    for (const inv of invoices) {
      const diffTime = Math.abs(now.getTime() - new Date(inv.invoiceDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let bin = '0-30 Days';
      if (diffDays <= 30) {
        aging.bin0to30 += inv.balanceAmount;
      } else if (diffDays <= 60) {
        aging.bin31to60 += inv.balanceAmount;
        bin = '31-60 Days';
      } else if (diffDays <= 90) {
        aging.bin61to90 += inv.balanceAmount;
        bin = '61-90 Days';
      } else {
        aging.bin90Plus += inv.balanceAmount;
        bin = '90+ Days';
      }

      aging.totalOutstanding += inv.balanceAmount;
      aging.records.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.customerName,
        invoiceDate: inv.invoiceDate,
        daysOverdue: diffDays,
        grandTotal: inv.grandTotal,
        balanceAmount: inv.balanceAmount,
        agingBin: bin
      });
    }

    return aging;
  }
}
