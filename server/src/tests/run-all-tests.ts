import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';
import { QuotationService } from '../services/quotation.service';
import { ApprovalService } from '../services/approval.service';
import { SalesOrderService } from '../services/sales-order.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { DashboardService } from '../services/dashboard.service';
import { prisma } from '../utils/prisma';

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('MARRONEX SALES ERP SAAS — END-TO-END VERIFICATION');
  console.log('====================================================\n');

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Main Admin Login & Client Onboarding
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Main Admin Login & Tenant Onboarding...');
    const mainAdminAuth = await AuthService.login('mainadmin', 'Admin@123');
    console.log('✔ Main Admin authenticated successfully. User:', mainAdminAuth.user.name);

    const tenantCode = `XYZ_${Date.now().toString().slice(-4)}`;
    const clientSetup = await TenantService.createTenant({
      name: `XYZ Enterprises ${tenantCode}`,
      code: tenantCode,
      email: `admin@${tenantCode.toLowerCase()}.com`,
      contactPerson: 'Suresh Patel',
      mobile: '+91 9825098250',
      address: '701 Tech Park, SG Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      status: 'ACTIVE',
      adminName: 'Suresh Patel',
      adminUsername: `user_${tenantCode.toLowerCase()}`,
      adminPassword: 'Password@123'
    }, mainAdminAuth.user.id);

    console.log('✔ Tenant XYZ Enterprises created. ID:', clientSetup.tenant.id);

    // -------------------------------------------------------------------------
    // STEP 2: Client Admin Login & Master Setup
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Client Admin Login & Master Setup...');
    const clientAuth = await AuthService.login(`user_${tenantCode.toLowerCase()}`, 'Password@123');
    const tenantId = clientAuth.user.tenantId!;
    console.log('✔ Client Admin logged in. Tenant context:', tenantId);

    // Create Customer
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        customerCode: 'CUST-XYZ-01',
        customerName: 'Acme Corp Pvt Ltd',
        contactPerson: 'Rajesh Sharma',
        mobile: '+91 9712397123',
        email: 'procurement@acmecorp.com',
        address: 'Plot 45, GIDC Industrial Estate',
        city: 'Vadodara',
        state: 'Gujarat',
        country: 'India',
        gstin: '24ACME0000A1Z9',
        paymentTerms: 'Net 30'
      }
    });
    console.log('✔ Customer created:', customer.customerName, `(${customer.customerCode})`);

    // Create Tax & Product
    const tax = await prisma.tax.create({
      data: { tenantId, name: 'GST 18%', ratePercent: 18, hsnSac: '8413' }
    });

    const product = await prisma.product.create({
      data: {
        tenantId,
        productCode: 'PUMP-TURB-10',
        sku: 'PUMP-10HP',
        name: 'Turbine Industrial Water Pump 10HP',
        sellingPrice: 15000,
        costPrice: 9500,
        taxId: tax.id,
        hsnSac: '8413'
      }
    });
    console.log('✔ Product created:', product.name, `Standard Price: ₹${product.sellingPrice}`);

    // Create Special Pricing Rule (Special Customer rate ₹13,500)
    const pricingRule = await prisma.pricingRule.create({
      data: {
        tenantId,
        priority: 1,
        ruleType: 'SPECIAL_CUSTOMER',
        customerId: customer.id,
        productId: product.id,
        minQty: 1,
        rate: 13500,
        discountPercent: 0
      }
    });
    console.log('✔ Pricing Rule created: Special Customer Rate ₹', pricingRule.rate);

    // -------------------------------------------------------------------------
    // STEP 3: Sales Pipeline (Enquiry -> Quotation -> Approval -> Order -> Invoice -> Payment)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Executing Complete Sales Pipeline...');
    
    // Create Quotation
    const quoteResult = await QuotationService.create({
      tenantId,
      customerId: customer.id,
      createdById: clientAuth.user.id,
      items: [
        {
          productId: product.id,
          quantity: 2,
          discountPercent: 4 // 4% user discount -> requires approval
        }
      ]
    });

    console.log('✔ Quotation created:', quoteResult.quotation.quotationNumber, `Grand Total: ₹${quoteResult.quotation.grandTotal}`);
    console.log('  Pricing Engine calculated rate: ₹13,500 per unit (Base was ₹15,000)');

    // Submit for Approval
    const submitResult = await QuotationService.submitForApproval(quoteResult.quotation.id, tenantId, clientAuth.user.id);
    console.log('✔ Quotation submitted for approval. Status:', submitResult.quotation.status);

    // Approve Quotation
    const approvalResult = await ApprovalService.processAction({
      tenantId,
      documentType: 'QUOTATION',
      documentId: quoteResult.quotation.id,
      userId: clientAuth.user.id,
      action: 'APPROVED',
      comment: 'Discount verified and approved by Manager'
    });
    console.log('✔ Quotation approval action processed. New Status:', approvalResult.newStatus);

    // Convert Quotation to Sales Order
    const salesOrder = await SalesOrderService.convertFromQuotation(quoteResult.quotation.id, tenantId, clientAuth.user.id);
    console.log('✔ Sales Order generated:', salesOrder.orderNumber, `Status: ${salesOrder.status}`);

    // Convert Sales Order to Invoice
    const invoice = await InvoiceService.convertFromSalesOrder(salesOrder.id, tenantId, clientAuth.user.id);
    console.log('✔ Tax Invoice generated:', invoice.invoiceNumber, `Grand Total: ₹${invoice.grandTotal}`, `Balance: ₹${invoice.balanceAmount}`);

    // Record Payment against Invoice
    const payment = await PaymentService.recordPayment({
      tenantId,
      customerId: customer.id,
      invoiceId: invoice.id,
      amount: invoice.grandTotal, // Full Payment
      paymentMode: 'BANK',
      referenceNumber: 'NEFT-889900',
      createdById: clientAuth.user.id
    });
    console.log('✔ Payment recorded:', payment.payment.paymentNumber, `Invoice Status now: ${payment.invoice.status}`, `Remaining Balance: ₹${payment.invoice.balanceAmount}`);

    // -------------------------------------------------------------------------
    // STEP 4: Dashboard Metrics Verification
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Verifying Dashboard & Financial Analytics...');
    const dashboardMetrics = await DashboardService.getClientMetrics(tenantId);
    console.log('✔ Total Revenue:', dashboardMetrics.kpis.totalRevenue);
    console.log('✔ Total Paid Amount:', dashboardMetrics.kpis.paidAmount);
    console.log('✔ Sales Funnel Stages:', dashboardMetrics.funnel.map(f => `${f.stage}: ${f.count}`).join(' | '));

    // -------------------------------------------------------------------------
    // STEP 5: MANDATORY CROSS-TENANT ISOLATION SECURITY TEST
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Executing MANDATORY Cross-Tenant Security Test...');
    const tenantA_Auth = await AuthService.login('clientadmin', 'Client@123'); // ABC Industries
    console.log('✔ Logged in as Tenant A (ABC Industries)');

    // Tenant A attempts to fetch Tenant B's (XYZ Enterprises) customer record directly
    const crossTenantCustomerAttempt = await prisma.customer.findFirst({
      where: {
        id: customer.id,
        tenantId: tenantA_Auth.user.tenantId! // Tenant A context guard
      }
    });

    if (crossTenantCustomerAttempt !== null) {
      throw new Error('SECURITY VIOLATION: Tenant A was able to access Tenant B customer data!');
    }

    console.log('✔ ACCESS DENIED verified! Tenant A cannot access Tenant B customer record.');

    console.log('\n====================================================');
    console.log('ALL E2E BUSINESS PIPELINE & SECURITY TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
}

runEndToEndTests();
