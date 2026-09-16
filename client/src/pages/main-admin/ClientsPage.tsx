import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Building2, Plus, CheckSquare, Edit3 } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showFeatureModal, setShowFeatureModal] = useState<any>(null);

  // New Client Form State with Explicit Status Option
  const [newClient, setNewClient] = useState({
    name: '',
    code: '',
    email: '',
    contactPerson: '',
    mobile: '',
    state: 'Gujarat',
    status: 'ACTIVE',
    adminName: '',
    adminUsername: '',
    adminPassword: 'Password@123'
  });

  // Edit Client Form State
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    email: '',
    contactPerson: '',
    mobile: '',
    state: 'Gujarat',
    gstin: '',
    status: 'ACTIVE'
  });

  const ALL_FEATURES = ['CRM', 'ENQUIRY', 'PRICING', 'QUOTATION', 'APPROVAL', 'SALES_ORDER', 'INVOICE', 'PAYMENT', 'REPORTS', 'CUSTOM_FIELDS', 'WORKFLOW'];
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/admin/clients');
      setClients(res.tenants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/admin/clients', {
        ...newClient,
        enabledFeatureCodes: ALL_FEATURES
      });
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setEditForm({
      name: client.name || '',
      code: client.code || '',
      email: client.email || '',
      contactPerson: client.contactPerson || '',
      mobile: client.mobile || '',
      state: client.state || 'Gujarat',
      gstin: client.gstin || '',
      status: client.status || 'ACTIVE'
    });
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      await ApiService.put(`/admin/clients/${editingClient.id}`, editForm);
      setEditingClient(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveFeatures = async () => {
    if (!showFeatureModal) return;
    try {
      await ApiService.put(`/admin/clients/${showFeatureModal.id}/features`, {
        featureCodes: selectedFeatures
      });
      setShowFeatureModal(null);
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
          <p className="text-xs text-gray-500">Code: <span className="font-mono bg-warm-100 px-1 rounded">{row.code}</span> | Contact: {row.contactPerson || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Email / Mobile',
      accessorKey: 'email',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-gray-800">{row.email}</p>
          <p className="text-gray-500">{row.mobile || '—'}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Features Active',
      cell: (row) => {
        const activeCount = (row.tenantFeatures || []).filter((f: any) => f.isEnabled).length;
        return (
          <button
            onClick={() => {
              setShowFeatureModal(row);
              setSelectedFeatures((row.tenantFeatures || []).filter((f: any) => f.isEnabled).map((f: any) => f.featureCode));
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{activeCount} / {ALL_FEATURES.length} Modules</span>
          </button>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron-800">Client Tenant Management</h1>
          <p className="text-xs text-gray-500">Onboard customer tenants, configure module features, edit client info, and manage tenant statuses.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard New Client Tenant</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        searchPlaceholder="Search clients by name, code or email..."
        actions={(row) => (
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2.5 py-1 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition flex items-center gap-1"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Client</span>
          </button>
        )}
      />

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-4">Onboard New Client Tenant</h3>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="e.g. Acme Industries"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Client Code *</label>
                  <input
                    type="text"
                    required
                    value={newClient.code}
                    onChange={(e) => setNewClient({ ...newClient, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ACME"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="admin@acme.com"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })}
                    placeholder="John Doe"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-marron-800">Tenant Status *</label>
                  <select
                    value={newClient.status}
                    onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border border-marron-300 rounded-lg font-bold text-marron-900"
                  >
                    <option value="ACTIVE">ACTIVE (Active Subscription)</option>
                    <option value="TRIAL">TRIAL (Free Trial Period)</option>
                    <option value="SUSPENDED">SUSPENDED (Suspended)</option>
                    <option value="INACTIVE">INACTIVE (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <p className="font-bold text-marron-800 mb-2">Initial Client Admin Credentials</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-gray-700">Admin Name</label>
                    <input
                      type="text"
                      required
                      value={newClient.adminName}
                      onChange={(e) => setNewClient({ ...newClient, adminName: e.target.value })}
                      placeholder="Admin Name"
                      className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">Username</label>
                    <input
                      type="text"
                      required
                      value={newClient.adminUsername}
                      onChange={(e) => setNewClient({ ...newClient, adminUsername: e.target.value })}
                      placeholder="Username"
                      className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700">Password</label>
                    <input
                      type="password"
                      required
                      value={newClient.adminPassword}
                      onChange={(e) => setNewClient({ ...newClient, adminPassword: e.target.value })}
                      className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-marron-800 text-white font-semibold rounded-lg shadow">
                  Create Client Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-4">Update Client Tenant Information</h3>
            <form onSubmit={handleUpdateClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Client Code *</label>
                  <input
                    type="text"
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    value={editForm.contactPerson}
                    onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700">Mobile</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-marron-800">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border border-marron-300 rounded-lg font-bold text-marron-900"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-marron-800 text-white font-semibold rounded-lg shadow">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Configuration Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-2">Configure Features for {showFeatureModal.name}</h3>
            <p className="text-xs text-gray-500 mb-4">Toggle reusable SaaS modules for this tenant environment.</p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {ALL_FEATURES.map((fCode) => {
                const isChecked = selectedFeatures.includes(fCode);
                return (
                  <label
                    key={fCode}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      isChecked ? 'bg-marron-50 border-marron-300 text-marron-900' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, fCode]);
                        } else {
                          setSelectedFeatures(selectedFeatures.filter((x) => x !== fCode));
                        }
                      }}
                      className="rounded text-marron-800 focus:ring-marron-800"
                    />
                    <span>{fCode}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFeatureModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFeatures}
                className="px-4 py-2 bg-marron-800 text-white font-semibold text-xs rounded-lg shadow"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
