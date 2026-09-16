import { prisma } from '../utils/prisma';

export class DashboardService {
  /**
   * Main Admin Dashboard KPIs
   */
  static async getMainAdminMetrics() {
    const [
      totalClients,
      activeClients,
      trialClients,
      expiredClients,
      suspendedClients,
      totalUsers,
      activeUsers
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'TRIAL' } }),
      prisma.tenant.count({ where: { status: 'EXPIRED' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { isMainAdmin: false } }),
      prisma.user.count({ where: { isMainAdmin: false, status: 'ACTIVE' } })
    ]);

    const totalSalesAggregate = await prisma.invoice.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { grandTotal: true, paidAmount: true }
    });

    return {
      totalClients,
      activeClients,
      trialClients,
      expiredClients,
      suspendedClients,
      totalUsers,
      activeUsers,
      totalSaaSVolume: totalSalesAggregate._sum.grandTotal || 0,
      totalSaaSPaid: totalSalesAggregate._sum.paidAmount || 0
    };
  }

  /**
   * Client Dashboard KPIs & Sales Funnel Data
   */
  static async getClientMetrics(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todaySalesAgg,
      monthlySalesAgg,
      pendingQuotationsCount,
      salesOrdersCount,
      totalInvoicesCount,
      financialAgg,
      enquiriesCount,
      quotationsCount,
      invoicesCount,
      paymentsCount
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId, invoiceDate: { gte: today }, status: { not: 'CANCELLED' } },
        _sum: { grandTotal: true }
      }),
      prisma.invoice.aggregate({
        where: { tenantId, invoiceDate: { gte: firstDayOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { grandTotal: true }
      }),
      prisma.quotation.count({ where: { tenantId, status: 'PENDING_APPROVAL' } }),
      prisma.salesOrder.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.aggregate({
        where: { tenantId, status: { not: 'CANCELLED' } },
        _sum: { grandTotal: true, paidAmount: true, balanceAmount: true }
      }),
      prisma.enquiry.count({ where: { tenantId } }),
      prisma.quotation.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId } }),
      prisma.payment.count({ where: { tenantId } })
    ]);

    // Recent activities
    const recentQuotations = await prisma.quotation.findMany({
      where: { tenantId },
      include: { customer: { select: { customerName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentInvoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: { customer: { select: { customerName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Funnel stats
    const funnel = [
      { stage: 'Enquiries', count: enquiriesCount },
      { stage: 'Quotations', count: quotationsCount },
      { stage: 'Sales Orders', count: salesOrdersCount },
      { stage: 'Invoices', count: invoicesCount },
      { stage: 'Payments', count: paymentsCount }
    ];

    return {
      kpis: {
        todaySales: todaySalesAgg._sum.grandTotal || 0,
        monthlySales: monthlySalesAgg._sum.grandTotal || 0,
        pendingQuotations: pendingQuotationsCount,
        salesOrders: salesOrdersCount,
        totalInvoices: totalInvoicesCount,
        totalRevenue: financialAgg._sum.grandTotal || 0,
        paidAmount: financialAgg._sum.paidAmount || 0,
        outstandingAmount: financialAgg._sum.balanceAmount || 0
      },
      funnel,
      recentQuotations,
      recentInvoices
    };
  }
}
