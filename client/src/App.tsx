import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/auth/LoginPage';
import { MainAdminDashboard } from './pages/main-admin/MainAdminDashboard';
import { ClientsPage } from './pages/main-admin/ClientsPage';
import { SubscriptionsPage } from './pages/main-admin/SubscriptionsPage';
import { ClientDashboard } from './pages/client-admin/ClientDashboard';
import { CustomerMasterPage } from './pages/masters/CustomerMasterPage';
import { SalespersonMasterPage } from './pages/masters/SalespersonMasterPage';
import { ProductMasterPage } from './pages/masters/ProductMasterPage';
import { DynamicPricingPage } from './pages/masters/DynamicPricingPage';
import { EnquiryPage } from './pages/sales/EnquiryPage';
import { QuotationPage } from './pages/sales/QuotationPage';
import { ApprovalPage } from './pages/sales/ApprovalPage';
import { SalesOrderPage } from './pages/sales/SalesOrderPage';
import { InvoicePage } from './pages/sales/InvoicePage';
import { PaymentPage } from './pages/sales/PaymentPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { OrganizationPage } from './pages/organization/OrganizationPage';
import { CustomFieldsPage } from './pages/settings/CustomFieldsPage';
import { AuditLogsPage } from './pages/settings/AuditLogsPage';
import { PrivacySecurityPage } from './pages/settings/PrivacySecurityPage';

// Layout Container Wrapper
const LayoutWrapper: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem('marronex_user') || '{}');

  if (!localStorage.getItem('marronex_token')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} />
      <Header user={user} collapsed={collapsed} />
      <main className={`transition-all duration-300 pt-20 pb-12 px-6 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes */}
        <Route element={<LayoutWrapper />}>
          <Route path="/admin/dashboard" element={<MainAdminDashboard />} />
          <Route path="/admin/clients" element={<ClientsPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />

          <Route path="/app/dashboard" element={<ClientDashboard />} />
          <Route path="/app/customers" element={<CustomerMasterPage />} />
          <Route path="/app/salespersons" element={<SalespersonMasterPage />} />
          <Route path="/app/products" element={<ProductMasterPage />} />
          <Route path="/app/pricing" element={<DynamicPricingPage />} />
          <Route path="/app/enquiries" element={<EnquiryPage />} />
          <Route path="/app/quotations" element={<QuotationPage />} />
          <Route path="/app/approvals" element={<ApprovalPage />} />
          <Route path="/app/sales-orders" element={<SalesOrderPage />} />
          <Route path="/app/invoices" element={<InvoicePage />} />
          <Route path="/app/payments" element={<PaymentPage />} />
          <Route path="/app/reports" element={<ReportsPage />} />
          <Route path="/app/organization" element={<OrganizationPage />} />
          <Route path="/app/custom-fields" element={<CustomFieldsPage />} />
          <Route path="/app/audit-logs" element={<AuditLogsPage />} />
          <Route path="/app/privacy-security" element={<PrivacySecurityPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
