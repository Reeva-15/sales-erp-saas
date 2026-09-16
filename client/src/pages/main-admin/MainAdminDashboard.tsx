import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Building2, Users, Sparkles, AlertTriangle, TrendingUp, ShieldCheck, Activity, BarChart2 } from 'lucide-react';

export const MainAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes, aRes] = await Promise.all([
        ApiService.get('/admin/dashboard'),
        ApiService.get('/admin/clients'),
        ApiService.get('/app/audit-logs')
      ]);
      setMetrics(mRes);
      setClients(cRes.tenants || []);
      setAuditLogs(aRes.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-marron-800 border-r-transparent" />
        <p className="mt-2 text-xs">Loading SaaS Main Admin Dashboard...</p>
      </div>
    );
  }

  // Calculate status counts for graph
  const statusCounts = {
    active: clients.filter((c) => c.status === 'ACTIVE').length,
    trial: clients.filter((c) => c.status === 'TRIAL').length,
    suspended: clients.filter((c) => c.status === 'SUSPENDED').length,
    expired: clients.filter((c) => c.status === 'EXPIRED' || c.status === 'INACTIVE').length
  };

  const totalTenantsCount = clients.length || 1;
  const activePercent = Math.round((statusCounts.active / totalTenantsCount) * 100);
  const trialPercent = Math.round((statusCounts.trial / totalTenantsCount) * 100);
  const suspendedPercent = Math.round((statusCounts.suspended / totalTenantsCount) * 100);
  const expiredPercent = Math.round((statusCounts.expired / totalTenantsCount) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-marron-900 to-marron-800 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SaaS Executive Dashboard</h1>
          <p className="text-xs text-marron-200 mt-1">Platform metrics, tenant status analytics, system activity and usage reports.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur text-xs font-semibold text-marron-100">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>System Healthy</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-marron-50 text-marron-800 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Clients</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics?.totalClients || 0}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Tenants</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics?.activeClients || 0}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trial Tenants</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics?.trialClients || 0}</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{metrics?.totalUsers || 0}</h3>
          </div>
        </div>
      </div>

      {/* GRAPHS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Tenant Status Distribution */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-marron-800 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-marron-700" />
              Tenant Status Breakdown
            </h3>
            <span className="text-xs text-gray-500 font-semibold">{clients.length} Total</span>
          </div>

          {/* Visual Progress Bars */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Active Subscriptions</span>
                <span>{statusCounts.active} ({activePercent}%)</span>
              </div>
              <div className="w-full bg-warm-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${activePercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Trial Period</span>
                <span>{statusCounts.trial} ({trialPercent}%)</span>
              </div>
              <div className="w-full bg-warm-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${trialPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">Suspended / Expired</span>
                <span>{statusCounts.suspended + statusCounts.expired} ({suspendedPercent + expiredPercent}%)</span>
              </div>
              <div className="w-full bg-warm-100 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${suspendedPercent + expiredPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold">Active: {statusCounts.active}</div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 font-bold">Trial: {statusCounts.trial}</div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800 font-bold">Suspended: {statusCounts.suspended}</div>
            <div className="p-2 rounded-xl bg-gray-50 text-gray-800 font-bold">Expired: {statusCounts.expired}</div>
          </div>
        </div>

        {/* Graph 2: Revenue & Volume Metric Card */}
        <div className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-marron-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              SaaS Growth & Volume
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Platform Analytics</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-marron-50 to-warm-100 border border-marron-200">
              <p className="text-xs font-bold text-marron-700 uppercase">Total Transaction Volume</p>
              <h4 className="text-2xl font-extrabold text-marron-900 mt-2">
                ₹ {Number(metrics?.totalSaaSVolume || 0).toLocaleString('en-IN')}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">Total invoiced across all tenants</p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-warm-100 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-700 uppercase">Total Collected Volume</p>
              <h4 className="text-2xl font-extrabold text-emerald-900 mt-2">
                ₹ {Number(metrics?.totalSaaSPaid || 0).toLocaleString('en-IN')}
              </h4>
              <p className="text-[11px] text-gray-500 mt-1">Processed customer payments</p>
            </div>
          </div>

          <div className="p-3 bg-warm-50 rounded-2xl border border-warm-200 text-xs flex items-center justify-between">
            <span className="text-gray-600 font-medium">Platform Infrastructure Health:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> 100% Multi-Tenant Isolated
            </span>
          </div>
        </div>
      </div>

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Client Registrations Table */}
        <div className="glass-card p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-marron-800">Recent Client Registrations</h3>
            <span className="text-xs text-gray-500 font-semibold">{clients.length} Clients Registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
                <tr>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Email / Contact</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {clients.slice(0, 5).map((c: any) => (
                  <tr key={c.id} className="hover:bg-warm-50/50">
                    <td className="p-3 font-bold text-marron-800">
                      {c.name}
                      <p className="text-[10px] text-gray-500 font-mono font-normal">Code: {c.code}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-800">{c.email}</p>
                      <p className="text-[10px] text-gray-500">{c.contactPerson || '—'}</p>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Platform Audit & Activity Logs */}
        <div className="glass-card p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-marron-800">Recent Platform System Activity</h3>
            <span className="text-xs text-gray-500 font-semibold">Audit Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Module & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {auditLogs.slice(0, 5).map((a: any) => (
                  <tr key={a.id} className="hover:bg-warm-50/50">
                    <td className="p-3 font-mono text-gray-500 text-[10px]">
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">
                      {a.user?.name || 'System'}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-marron-800">{a.module}</span> → <span className="font-mono text-gray-700 bg-warm-100 px-1 rounded">{a.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
