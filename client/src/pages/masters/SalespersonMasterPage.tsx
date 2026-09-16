import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Check, X } from 'lucide-react';

const ALL_PERMISSION_CATEGORIES = [
  { code: 'DASHBOARD', label: 'Dashboard' },
  { code: 'CUSTOMER', label: 'Customers' },
  { code: 'ENQUIRY', label: 'Enquiries' },
  { code: 'QUOTATION', label: 'Quotations' },
  { code: 'SALES_ORDER', label: 'Sales Orders' },
  { code: 'INVOICE', label: 'Invoices' },
  { code: 'PAYMENT', label: 'Payments' }
];

export const SalespersonMasterPage: React.FC = () => {
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<any>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Sales Manager',
    email: '',
    mobile: '',
    commissionPercent: '2.5',
    status: 'ACTIVE',
    password: '',
    permissions: ALL_PERMISSION_CATEGORIES.map((c) => c.code)
  });

  const loadData = () => {
    setLoading(true);
    ApiService.get('/app/salespersons')
      .then(setSalespersons)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingSalesperson(null);
    setForm({
      code: '',
      name: '',
      category: 'Sales Manager',
      email: '',
      mobile: '',
      commissionPercent: '2.5',
      status: 'ACTIVE',
      password: '',
      permissions: ALL_PERMISSION_CATEGORIES.map((c) => c.code)
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (sp: any) => {
    setEditingSalesperson(sp);
    const existingPerms = sp.permissions
      ? sp.permissions.split(',').map((s: string) => s.trim())
      : ALL_PERMISSION_CATEGORIES.map((c) => c.code);

    setForm({
      code: sp.code || '',
      name: sp.name || '',
      category: sp.category || 'Sales Manager',
      email: sp.email || '',
      mobile: sp.mobile || '',
      commissionPercent: String(sp.commissionPercent ?? 2.5),
      status: sp.status || 'ACTIVE',
      password: '',
      permissions: existingPerms
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSalesperson) {
        await ApiService.put(`/app/salespersons/${editingSalesperson.id}`, form);
      } else {
        await ApiService.post('/app/salespersons', form);
      }
      resetForm();
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Salesperson Code & Name',
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
      header: 'Category / Role',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-marron-100 text-marron-800 border border-marron-200">
          {row.category || 'Sales Manager'}
        </span>
      )
    },
    {
      header: 'Category Permissions',
      cell: (row) => {
        const perms = row.permissions
          ? row.permissions.split(',').map((s: string) => s.trim())
          : ALL_PERMISSION_CATEGORIES.map((c) => c.code);
        return (
          <div className="flex flex-wrap gap-1 max-w-[280px]">
            {ALL_PERMISSION_CATEGORIES.map((cat) => {
              const has = perms.includes(cat.code);
              return (
                <span
                  key={cat.code}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border transition ${
                    has
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold'
                      : 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-50'
                  }`}
                >
                  {cat.label}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'Contact Details',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-gray-800">{row.email || '—'}</p>
          <p className="text-gray-500">{row.mobile || '—'}</p>
        </div>
      )
    },
    {
      header: 'Commission %',
      accessorKey: 'commissionPercent',
      cell: (row) => <span className="font-bold text-emerald-700 text-xs">{row.commissionPercent || 0}%</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status || 'ACTIVE'} />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron-800">Sales Managers Master</h1>
          <p className="text-xs text-gray-500">Manage sales managers, sidebar permissions, and commission structures.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Sales Manager</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={salespersons}
        loading={loading}
        searchPlaceholder="Search sales managers by name or code..."
        actions={(row) => (
          <button
            onClick={() => handleEdit(row)}
            className="px-2.5 py-1 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition"
          >
            Edit
          </button>
        )}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-warm-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-marron-800 mb-4">
              {editingSalesperson ? 'Edit Sales Manager Details' : 'Add Sales Manager'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SP-002"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Salesperson Name"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Sales Role / Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-bold text-marron-800"
                >
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Senior Sales Executive">Senior Sales Executive</option>
                  <option value="Regional Sales Manager">Regional Sales Manager</option>
                  <option value="Field Sales Agent">Field Sales Agent</option>
                  <option value="Account Manager">Account Manager</option>
                </select>
              </div>

              {/* Category Permissions Section */}
              <div className="border-t pt-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-marron-800 text-xs">
                    Category Permissions (Sidebar Access)
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, permissions: ALL_PERMISSION_CATEGORIES.map((c) => c.code) })}
                      className="text-[10px] text-marron-700 font-semibold underline hover:text-marron-900"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, permissions: [] })}
                      className="text-[10px] text-gray-500 font-semibold underline hover:text-gray-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-warm-50/80 p-3 rounded-xl border border-warm-200/80">
                  {ALL_PERMISSION_CATEGORIES.map((cat) => {
                    const isChecked = form.permissions.includes(cat.code);
                    return (
                      <label
                        key={cat.code}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition text-xs font-semibold ${
                          isChecked
                            ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200'
                            : 'bg-white text-gray-400 border-gray-200 opacity-70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, permissions: [...form.permissions, cat.code] });
                            } else {
                              setForm({ ...form, permissions: form.permissions.filter((c) => c !== cat.code) });
                            }
                          }}
                          className="rounded text-marron-800 focus:ring-marron-500 h-3.5 w-3.5 accent-marron-800"
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="salesperson@company.com"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Mobile</label>
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.commissionPercent}
                    onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                    placeholder="2.5"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-bold text-marron-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Salesperson Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-semibold text-gray-800"
                  >
                    <option value="ACTIVE">ACTIVE (Active Agent)</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Account Login Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingSalesperson ? 'Leave blank to keep current password' : 'Default: Password@123'}
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-mono text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Use Code <span className="font-mono font-bold text-marron-800">{form.code || 'SP-XXX'}</span> or Email to log into the application.</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-marron-800 text-white font-semibold rounded-lg shadow">
                  {editingSalesperson ? 'Update Sales Manager' : 'Save Sales Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
