import { prisma } from '../utils/prisma';
import { AuditService } from './audit.service';

export interface RecordPaymentInput {
  tenantId: string;
  companyId?: string | null;
  branchId?: string | null;
  customerId: string;
  invoiceId: string;
  amount: number;
  paymentMode: 'CASH' | 'BANK' | 'UPI' | 'CHEQUE' | 'OTHER';
  referenceNumber?: string;
  bankAccount?: string;
  notes?: string;
  createdById: string;
}

export class PaymentService {
  private static async generatePaymentNumber(tenantId: string): Promise<string> {
    const count = await prisma.payment.count({ where: { tenantId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `PAY-${sequence}`;
  }

  static async recordPayment(input: RecordPaymentInput) {
    const { tenantId, companyId, branchId, customerId, invoiceId, amount, paymentMode, referenceNumber, bankAccount, notes, createdById } = input;

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than 0.');
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId }
    });

    if (!invoice) throw new Error('Invoice not found.');
    if (invoice.balanceAmount <= 0) {
      throw new Error('Invoice is already fully PAID.');
    }

    const paymentNumber = await this.generatePaymentNumber(tenantId);

    // Database transaction to ensure payment + invoice allocation + balance update consistency
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          companyId: companyId || invoice.companyId,
          branchId: branchId || invoice.branchId,
          paymentNumber,
          paymentDate: new Date(),
          customerId,
          amount,
          paymentMode,
          referenceNumber: referenceNumber || null,
          bankAccount: bankAccount || null,
          notes: notes || null,
          status: 'POSTED',
          createdById
        }
      });

      // Create allocation
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount
        }
      });

      // Calculate new invoice balance
      const newPaidAmount = invoice.paidAmount + amount;
      const newBalanceAmount = Math.max(0, invoice.grandTotal - newPaidAmount);
      const newStatus = newBalanceAmount === 0 ? 'PAID' : 'PENDING';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus
        }
      });

      return { payment, invoice: updatedInvoice };
    });

    await AuditService.log({
      tenantId,
      userId: createdById,
      module: 'PAYMENT',
      action: 'RECORD_PAYMENT',
      recordId: result.payment.id,
      newValue: { paymentNumber, invoiceId, amount, remainingBalance: result.invoice.balanceAmount }
    });

    return result;
  }

  static async list(tenantId: string, queryParams: any = {}) {
    const { page = 1, limit = 20, search } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { customer: { customerName: { contains: search } } }
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          customer: { select: { customerName: true, customerCode: true } },
          allocations: {
            include: {
              invoice: {
                select: {
                  invoiceNumber: true,
                  grandTotal: true,
                  paidAmount: true,
                  balanceAmount: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.payment.count({ where })
    ]);

    return { payments, total, page: Number(page), limit: Number(limit) };
  }
}
