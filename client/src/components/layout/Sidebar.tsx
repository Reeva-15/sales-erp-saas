import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import {
  LayoutDashboard,
  Users,
  Package,
  HelpCircle,
  FileText,
  CheckCircle2,
  ShoppingCart,
  Receipt,
  CreditCard,
  BarChart3,
  Building2,
  Shield,
  Sliders,
  LogOut,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  user: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isMainAdmin = user?.isMainAdmin;
  const enabledFeatures: string[] = user?.enabledFeatures || [];

  // Helper to check feature flags for tenant users
  const hasFeature = (code: string) => {
    if (isMainAdmin) return true;
    return enabledFeatures.length === 0 || enabledFeatures.includes(code);
  };

  const roleCode = (user?.roleCode || '').toUpperCase();
  const roleName = (user?.roleName || '').toLowerCase();

  const isSalesManagerProfile =
    !isMainAdmin &&
    roleCode !== 'ADMIN' &&
    roleCode !== 'CLIENT_ADMIN' &&
    (
      roleCode === 'SALES_MANAGER' ||
      roleCode === 'SALES_EXECUTIVE' ||
      roleCode === 'SALESPERSON' ||
      roleName.includes('sales manager') ||
      roleName.includes('sales executive') ||
      roleName.includes('salesperson')
    );

  const navSections = isMainAdmin
    ? [
        {
          title: 'SaaS Platform Admin',
          items: [
            { label: 'SaaS Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
            { label: 'Client Tenants', path: '/admin/clients', icon: Building2 },
            { label: 'Subscriptions', path: '/admin/subscriptions', icon: Sparkles }
          ]
        }
      ]
    : isSalesManagerProfile
    ? [
        {
          title: 'Sales Execution',
          items: [
            hasFeature('DASHBOARD') && { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
            hasFeature('CUSTOMER') && { label: 'Customers', path: '/app/customers', icon: Users },
            hasFeature('ENQUIRY') && { label: 'Enquiries', path: '/app/enquiries', icon: HelpCircle },
            hasFeature('QUOTATION') && { label: 'Quotations', path: '/app/quotations', icon: FileText },
            hasFeature('SALES_ORDER') && { label: 'Sales Orders', path: '/app/sales-orders', icon: ShoppingCart },
            hasFeature('INVOICE') && { label: 'Invoices', path: '/app/invoices', icon: Receipt },
            hasFeature('PAYMENT') && { label: 'Payments', path: '/app/payments', icon: CreditCard }
          ].filter(Boolean) as any[]
        }
      ]
    : [
        {
          title: 'Overview',
          items: [
            { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard }
          ]
        },
        {
          title: 'Sales Execution',
          items: [
            { label: 'Customers', path: '/app/customers', icon: Users },
            hasFeature('ENQUIRY') && { label: 'Enquiries', path: '/app/enquiries', icon: HelpCircle },
            hasFeature('QUOTATION') && { label: 'Quotations', path: '/app/quotations', icon: FileText },
            hasFeature('APPROVAL') && { label: 'Approvals Queue', path: '/app/approvals', icon: CheckCircle2 },
            hasFeature('SALES_ORDER') && { label: 'Sales Orders', path: '/app/sales-orders', icon: ShoppingCart },
            hasFeature('INVOICE') && { label: 'Tax Invoices', path: '/app/invoices', icon: Receipt },
            hasFeature('PAYMENT') && { label: 'Payments', path: '/app/payments', icon: CreditCard }
          ].filter(Boolean) as any[]
        },
        {
          title: 'Masters & Setup',
          items: [
            { label: 'Products Master', path: '/app/products', icon: Package },
            { label: 'Sales Managers', path: '/app/salespersons', icon: Users },
            hasFeature('PRICING') && { label: 'Dynamic Pricing', path: '/app/pricing', icon: Sliders },
            { label: 'Organization & Roles', path: '/app/organization', icon: Shield }
          ].filter(Boolean) as any[]
        },
        {
          title: 'Analytics & Config',
          items: [
            hasFeature('REPORTS') && { label: 'Sales & Aging Reports', path: '/app/reports', icon: BarChart3 },
            hasFeature('CUSTOM_FIELDS') && { label: 'Custom Fields', path: '/app/custom-fields', icon: Sliders },
            { label: 'Audit Activity Logs', path: '/app/audit-logs', icon: FileText }
          ].filter(Boolean) as any[]
        },
        {
          title: 'Privacy & Security',
          items: [
            { label: 'Password Management', path: '/app/privacy-security', icon: Lock }
          ]
        }
      ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 bg-[#2B1218] text-white flex flex-col transition-all duration-300 shadow-2xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Brand */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-marron-700/50">
        <Logo collapsed={collapsed} light />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-marron-300 hover:text-white hover:bg-marron-800 transition"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Tenant / Company Info Badge */}
      {!collapsed && user?.tenantName && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-marron-800/80 border border-marron-700/60 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.tenantName}</p>
            <p className="text-[10px] text-marron-200 truncate">{user.roleName || user.category || 'Client Environment'}</p>
          </div>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h4 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-marron-300">
                {section.title}
              </h4>
            )}
            <div className="space-y-1">
              {section.items.map((item: any) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                      isActive
                        ? 'bg-marron-700 text-white font-semibold shadow-inner'
                        : 'text-marron-200 hover:text-white hover:bg-marron-800/60'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-marron-700/50 bg-marron-900/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-marron-700 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-marron-300 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-lg text-marron-300 hover:text-rose-300 hover:bg-marron-800 transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
