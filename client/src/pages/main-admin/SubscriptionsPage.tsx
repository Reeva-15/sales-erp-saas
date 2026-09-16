import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Sparkles, Calendar, Edit3, ShieldCheck } from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  // Subscription Form State
  const [form, setForm] = useState({
    status: 'ACTIVE',
    trialDays: 30,
    planName: 'Enterprise Growth Plan',
    price: 4999,
    maxUsers: 25
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/admin/clients');
      const list = res.tenants || [];
      setTenants(list);
      if (list.length > 0 && !selectedTenantId) {
        setSelectedTenantId(list[0].id);
        setForm((f) => ({ ...f, status: list[0].status || 'ACTIVE' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setForm((f) => ({ ...f, status: tenant.status || 'ACTIVE' }));
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    try {
      await ApiService.put(`/admin/clients/${selectedTenantId}/subscription`, {
        status: form.status,
        trialDays: Number(form.trialDays)
      });
      alert('Client Subscription updated successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Client / Tenant Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.name}</p>
          <p className="text-xs text-gray-500">Code: <span className="font-mono bg-warm-100 px-1 rounded">{row.code}</span></p>
        </div>
      )
    },
    {
      header: 'Subscription Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Trial / Plan End Date',
      cell: (row) => {
        if (!row.trialEndDate) return <span className="text-gray-400">N/A</span>;
        const endDate = new Date(row.trialEndDate);
        const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="text-xs">
            <p className="font-semibold text-gray-800">{endDate.toLocaleDateString()}</p>
            <p className={`font-bold ${daysLeft > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Registered Date',
      cell: (row) => <span className="text-xs text-gray-600">{new Date(row.createdAt).toLocaleDateString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron-800">Client Subscription Management</h1>
        <p className="text-xs text-gray-500">Manage client SaaS subscription plans, trial validity, status, and pricing.</p>
      </div>

      {/* CLIENT SUBSCRIPTION FORM CARD (Task 2 Requirement) */}
      <div className="glass-card p-6 rounded-3xl border border-warm-200 shadow-lg bg-gradient-to-br from-white to-warm-50/50">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-warm-200">
          <Sparkles className="h-5 w-5 text-marron-700" />
          <h2 className="text-lg font-bold text-marron-900">Manage Client Subscription Form</h2>
        </div>

        <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Select Client Tenant *</label>
              <select
                value={selectedTenantId}
                onChange={(e) => handleSelectTenantChange(e.target.value)}
                className="w-full p-2.5 bg-white border border-warm-300 rounded-xl font-bold text-marron-900"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) - Current: {t.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Subscription Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-2.5 bg-white border border-warm-300 rounded-xl font-bold text-marron-900"
              >
                <option value="ACTIVE">ACTIVE (Paid Subscription)</option>
                <option value="TRIAL">TRIAL (Free Trial Period)</option>
                <option value="SUSPENDED">SUSPENDED (Suspended)</option>
                <option value="EXPIRED">EXPIRED (Expired Plan)</option>
                <option value="INACTIVE">INACTIVE (Inactive)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Extend Trial / Validity (Days) *</label>
              <input
                type="number"
                min="1"
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-warm-300 rounded-xl font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Plan Name</label>
              <input
                type="text"
                value={form.planName}
                onChange={(e) => setForm({ ...form, planName: e.target.value })}
                className="w-full p-2.5 bg-white border rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Monthly Rate (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Max User Seat Limit</label>
              <input
                type="number"
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-marron-800 hover:bg-marron-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Update Client Subscription</span>
            </button>
          </div>
        </form>
      </div>

      {/* Subscriptions Directory Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-marron-800">All Client Subscriptions</h2>
        <DataTable
          columns={columns}
          data={tenants}
          loading={loading}
          searchPlaceholder="Search client subscriptions..."
          actions={(row) => (
            <button
              onClick={() => {
                handleSelectTenantChange(row.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition flex items-center gap-1"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Manage Plan</span>
            </button>
          )}
        />
      </div>
    </div>
  );
};
