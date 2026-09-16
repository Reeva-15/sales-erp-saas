import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { Building2, Shield, Users, Plus } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const OrganizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'branch' | 'user' | 'role'>('user');
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, uRes, rRes] = await Promise.all([
        ApiService.get('/org/companies'),
        ApiService.get('/org/branches'),
        ApiService.get('/org/users'),
        ApiService.get('/org/roles')
      ]);
      setCompanies(cRes);
      setBranches(bRes);
      setUsers(uRes);
      setRoles(rRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron-800">Organization & Security Control</h1>
        <p className="text-xs text-gray-500">Configure company entities, branches, custom roles, permissions, and users.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-warm-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('user')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'user' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="h-4 w-4" /> Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('role')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'role' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Shield className="h-4 w-4" /> Roles & Permissions ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'company' ? 'border-marron-800 text-marron-800' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="h-4 w-4" /> Companies ({companies.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'user' && (
        <div className="glass-card rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
              <tr>
                <th className="p-3">User Name</th>
                <th className="p-3">Username & Email</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-warm-50/50">
                  <td className="p-3 font-bold text-marron-800">{u.name}</td>
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">{u.username}</p>
                    <p className="text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-3 font-bold text-gray-700">{u.role?.name || 'Client Admin'}</td>
                  <td className="p-3"><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'role' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r: any) => (
            <div key={r.id} className="glass-card p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-marron-800 text-sm">{r.name}</h3>
                <span className="text-[10px] font-mono font-semibold bg-warm-100 px-2 py-0.5 rounded">{r.code}</span>
              </div>
              <p className="text-xs text-gray-500">{r.description || 'Configurable Role Permission Scope'}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'company' && (
        <div className="glass-card rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-100/60 uppercase font-semibold text-gray-600">
              <tr>
                <th className="p-3">Company Code & Name</th>
                <th className="p-3">State</th>
                <th className="p-3">GSTIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {companies.map((c: any) => (
                <tr key={c.id} className="hover:bg-warm-50/50">
                  <td className="p-3 font-bold text-marron-800">{c.name} ({c.code})</td>
                  <td className="p-3 font-semibold">{c.state || 'Gujarat'}</td>
                  <td className="p-3 font-mono font-semibold">{c.gstin || 'URP'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
