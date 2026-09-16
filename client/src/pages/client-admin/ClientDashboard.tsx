import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DollarSign, FileText, ShoppingCart, Receipt, CreditCard, ArrowUpRight, TrendingUp, AlertCircle } from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('marronex_user') || '{}');

  useEffect(() => {
    ApiService.get('/app/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-marron-800 border-r-transparent" />
        <p className="mt-2 text-xs">Loading sales dashboard...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const funnel = data?.funnel || [];
  const recentQuotations = data?.recentQuotations || [];
  const recentInvoices = data?.recentInvoices || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-marron-900 to-marron-800 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold">Good morning, {user.name || 'Sales User'} 👋</h1>
          <p className="text-xs text-marron-200 mt-1">Here is what is happening with your sales pipeline today.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 px-4 py-2 rounded-xl backdrop-blur border border-white/10 text-xs font-semibold">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>Live Sales Feed</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Today Sales</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">₹ {Number(kpis.todaySales || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-0.5" /> Updated today
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Monthly Sales</span>
            <TrendingUp className="h-4 w-4 text-marron-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">₹ {Number(kpis.monthlySales || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Current Billing Cycle</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Pending Quotes</span>
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-amber-700">{kpis.pendingQuotations || 0}</h3>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Awaiting Approval</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-gray-500 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Outstanding</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-rose-700">₹ {Number(kpis.outstandingAmount || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-rose-600 font-medium mt-1">Customer Receivables</p>
        </div>
      </div>

      {/* Funnel & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold text-base text-marron-800">Sales Pipeline Funnel</h3>
          <div className="space-y-3">
            {funnel.map((f: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700">{f.stage}</span>
                  <span className="text-marron-800 font-bold">{f.count} Documents</span>
                </div>
                <div className="w-full h-3 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-marron-800 to-marron-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(15, (f.count || 1) * 20))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue & Collections */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-base text-marron-800">Revenue & Collections</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-800">Total Paid Amount</p>
              <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">₹ {Number(kpis.paidAmount || 0).toLocaleString('en-IN')}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
              <p className="text-xs font-semibold text-rose-800">Total Outstanding Balance</p>
              <h4 className="text-2xl font-extrabold text-rose-900 mt-1">₹ {Number(kpis.outstandingAmount || 0).toLocaleString('en-IN')}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="glass-card p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-marron-800">Recent Quotations</h3>
          <div className="divide-y divide-warm-100">
            {recentQuotations.map((q: any) => (
              <div key={q.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-800">{q.quotationNumber}</p>
                  <p className="text-gray-500">{q.customer?.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-marron-800">₹ {Number(q.grandTotal).toLocaleString('en-IN')}</p>
                  <StatusBadge status={q.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="glass-card p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-marron-800">Recent Invoices</h3>
          <div className="divide-y divide-warm-100">
            {recentInvoices.map((inv: any) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-800">{inv.invoiceNumber}</p>
                  <p className="text-gray-500">{inv.customer?.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-marron-800">₹ {Number(inv.grandTotal).toLocaleString('en-IN')}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
