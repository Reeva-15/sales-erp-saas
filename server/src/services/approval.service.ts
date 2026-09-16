import { prisma } from '../utils/prisma';
import { AuditService } from './audit.service';

export interface EvaluateApprovalParams {
  tenantId: string;
  quotationId: string;
  discountPercent: number;
  grandTotal: number;
}

export class ApprovalService {
  /**
   * Evaluates whether a Quotation requires approval or can be Auto-Approved.
   */
  static async evaluateQuotation(params: EvaluateApprovalParams) {
    const { tenantId, quotationId, discountPercent, grandTotal } = params;

    // Fetch tenant approval rules
    const rules = await prisma.approvalRule.findMany({
      where: { tenantId, active: true },
      orderBy: { minDiscountPercent: 'asc' }
    });

    if (rules.length === 0) {
      // Default rule logic if no custom rules are configured
      if (discountPercent <= 2) {
        return { requiresApproval: false, requiredRole: null, autoApproved: true, message: 'Auto approved (Discount <= 2%)' };
      } else if (discountPercent <= 5) {
        return { requiresApproval: true, requiredRole: 'SALES_MANAGER', autoApproved: false, message: 'Requires Sales Manager Approval (Discount 2-5%)' };
      } else if (discountPercent <= 10) {
        return { requiresApproval: true, requiredRole: 'CLIENT_ADMIN', autoApproved: false, message: 'Requires Client Admin Approval (Discount 5-10%)' };
      } else {
        return { requiresApproval: true, requiredRole: 'CLIENT_ADMIN', autoApproved: false, message: 'Requires Special Approval (Discount > 10%)' };
      }
    }

    // Match configurable rules
    const matchedRule = rules.find(
      (r) =>
        discountPercent >= r.minDiscountPercent &&
        discountPercent <= r.maxDiscountPercent &&
        grandTotal >= r.minAmount &&
        (!r.maxAmount || grandTotal <= r.maxAmount)
    );

    if (matchedRule) {
      if (matchedRule.autoApprove) {
        return { requiresApproval: false, requiredRole: null, autoApproved: true, message: `Auto approved via rule: ${matchedRule.name}` };
      }
      return {
        requiresApproval: true,
        requiredRole: matchedRule.approverRoleCode || 'SALES_MANAGER',
        autoApproved: false,
        message: `Approval required by ${matchedRule.approverRoleCode || 'Sales Manager'} (${matchedRule.name})`
      };
    }

    return { requiresApproval: false, requiredRole: null, autoApproved: true, message: 'Auto approved (No restriction match)' };
  }

  /**
   * Processes approval or rejection action by authorized user.
   */
  static async processAction(params: {
    tenantId: string;
    documentType: 'QUOTATION' | 'SALES_ORDER';
    documentId: string;
    userId: string;
    action: 'APPROVED' | 'REJECTED' | 'SENT_BACK';
    comment?: string;
  }) {
    const { tenantId, documentType, documentId, userId, action, comment } = params;

    let previousStatus = '';
    let newStatus = '';

    if (documentType === 'QUOTATION') {
      const quotation = await prisma.quotation.findFirst({
        where: { id: documentId, tenantId }
      });
      if (!quotation) throw new Error('Quotation not found.');

      previousStatus = quotation.status;
      newStatus = action === 'APPROVED' ? 'APPROVED' : action === 'REJECTED' ? 'REJECTED' : 'DRAFT';

      await prisma.quotation.update({
        where: { id: documentId },
        data: { status: newStatus }
      });
    }

    // Log Approval History
    await prisma.approvalHistory.create({
      data: {
        tenantId,
        documentType,
        documentId,
        approverUserId: userId,
        action,
        comment: comment || null,
        previousStatus,
        newStatus
      }
    });

    // Log Audit
    await AuditService.log({
      tenantId,
      userId,
      module: documentType,
      action: `APPROVAL_${action}`,
      recordId: documentId,
      oldValue: { status: previousStatus },
      newValue: { status: newStatus, comment }
    });

    return { documentId, previousStatus, newStatus, action };
  }
}
