import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { BarChart3, Users, Package, Clock, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'customer' | 'product' | 'aging'>('sales');
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [customerWise, setCustomerWise] = useState<any[]>([]);
  const [productWise, setProductWise] = useState<any[]>([]);
  const [agingReport, setAgingReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      ApiService.get('/app/reports/sales-summary'),
      ApiService.get('/app/reports/customer-wise'),
      ApiService.get('/app/reports/product-wise'),
      ApiService.get('/app/reports/aging')
    ])
      .then(([sRes, cRes, pRes, aRes]) => {
        setSalesSummary(sRes);
        setCustomerWise(cRes);
        setProductWise(pRes);
        setAgingReport(aRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-marron-800 border-r-transparent" />
        <p className="mt-2 text-xs">Loading analytics reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron-800">Sales & Aging Analytics Reports</h1>
          <p className="text-xs text-gray-500">Comprehensive business intelligence, revenue breakdown, and aging analysis.</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 border-b border-warm-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'sales' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Sales Summary
        </button>

        <button
          onClick={() => setActiveTab('customer')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'customer' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="h-4 w-4" /> Customer-wise Revenue
        </button>

        <button
          onClick={() => setActiveTab('product')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'product' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="h-4 w-4" /> Product Sales
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'aging' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Clock className="h-4 w-4" /> Outstanding Aging Bins
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Sales Generated</p>
              <h3 className="text-2xl font-extrabold text-marron-900 mt-1">₹ {Number(salesSummary?.totalSales || 0).toLocaleString('en-IN')}</h3>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Collected</p>
              <h3 className="text-2xl font-extrabold text-emerald-800 mt-1">₹ {Number(salesSummary?.totalCollected || 0).toLocaleString('en-IN')}</h3>
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Outstanding Balance</p>
              <h3 className="text-2xl font-extrabold text-rose-700 mt-1">₹ {Number(salesSummary?.totalOutstanding || 0).toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customer' && (
        <div className="glass-card rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Total Invoices</th>
                <th className="p-3">Total Revenue</th>
                <th className="p-3">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {customerWise.map((c: any) => (
                <tr key={c.customerId} className="hover:bg-warm-50/50">
                  <td className="p-3 font-bold text-gray-800">{c.customerName} ({c.customerCode})</td>
                  <td className="p-3 font-semibold">{c.totalInvoices}</td>
                  <td className="p-3 font-bold text-marron-800">₹ {Number(c.totalRevenue).toLocaleString('en-IN')}</td>
                  <td className="p-3 font-bold text-rose-600">₹ {Number(c.totalOutstanding).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'product' && (
        <div className="glass-card rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Units Sold</th>
                <th className="p-3">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {productWise.map((p: any) => (
                <tr key={p.productId} className="hover:bg-warm-50/50">
                  <td className="p-3 font-bold text-gray-800">{p.productName} ({p.productCode})</td>
                  <td className="p-3 font-semibold">{p.totalQuantitySold}</td>
                  <td className="p-3 font-bold text-marron-800">₹ {Number(p.totalRevenue).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border-l-4 border-l-emerald-500">
              <p className="text-xs font-semibold text-gray-500">0 - 30 Days</p>
              <h4 className="text-xl font-bold text-gray-900 mt-1">₹ {Number(agingReport?.bin0to30 || 0).toLocaleString('en-IN')}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border-l-4 border-l-amber-500">
              <p className="text-xs font-semibold text-gray-500">31 - 60 Days</p>
              <h4 className="text-xl font-bold text-gray-900 mt-1">₹ {Number(agingReport?.bin31to60 || 0).toLocaleString('en-IN')}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border-l-4 border-l-orange-500">
              <p className="text-xs font-semibold text-gray-500">61 - 90 Days</p>
              <h4 className="text-xl font-bold text-gray-900 mt-1">₹ {Number(agingReport?.bin61to90 || 0).toLocaleString('en-IN')}</h4>
            </div>

            <div className="glass-card p-4 rounded-2xl border-l-4 border-l-rose-500">
              <p className="text-xs font-semibold text-gray-500">90+ Days</p>
              <h4 className="text-xl font-bold text-rose-700 mt-1">₹ {Number(agingReport?.bin90Plus || 0).toLocaleString('en-IN')}</h4>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Days Overdue</th>
                  <th className="p-3">Aging Bin</th>
                  <th className="p-3">Balance Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {(agingReport?.records || []).map((r: any) => (
                  <tr key={r.invoiceId} className="hover:bg-warm-50/50">
                    <td className="p-3 font-bold text-marron-800">{r.invoiceNumber}</td>
                    <td className="p-3 font-semibold">{r.customerName}</td>
                    <td className="p-3 font-medium text-gray-700">{r.daysOverdue} days</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-semibold text-xs bg-warm-100 text-gray-800">
                        {r.agingBin}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-rose-600">₹ {Number(r.balanceAmount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
