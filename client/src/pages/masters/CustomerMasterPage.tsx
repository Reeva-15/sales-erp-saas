import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Users, Building2, MapPin } from 'lucide-react';

export const CustomerMasterPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    customerCode: '',
    customerName: '',
    customerType: 'BUSINESS',
    contactPerson: '',
    mobile: '',
    email: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: 'Gujarat',
    country: 'India',
    paymentTerms: 'Net 30',
    creditLimit: '0'
  });

  const loadData = () => {
    setLoading(true);
    ApiService.get('/app/customers')
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      customerCode: '',
      customerName: '',
      customerType: 'BUSINESS',
      contactPerson: '',
      mobile: '',
      email: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: 'Gujarat',
      country: 'India',
      paymentTerms: 'Net 30',
      creditLimit: '0'
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/app/customers', form);
      resetForm();
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Customer Code & Name',
      accessorKey: 'customerName',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.customerName}</p>
          <p className="text-xs text-gray-500">Code: <span className="font-mono bg-warm-100 px-1 rounded">{row.customerCode}</span> | Type: {row.customerType}</p>
        </div>
      )
    },
    {
      header: 'Contact Details',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-gray-800">{row.contactPerson || '—'}</p>
          <p className="text-gray-500">{row.email} | {row.mobile}</p>
        </div>
      )
    },
    {
      header: 'Tax & GSTIN',
      cell: (row) => (
        <div className="text-xs font-mono">
          <p className="font-semibold text-gray-700">{row.gstin || 'URP'}</p>
          <p className="text-gray-500">{row.city}, {row.state}</p>
        </div>
      )
    },
    {
      header: 'Terms & Limit',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-gray-800">{row.paymentTerms}</p>
          <p className="text-gray-500">Credit: ₹{Number(row.creditLimit).toLocaleString('en-IN')}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron-800">Customer Master</h1>
          <p className="text-xs text-gray-500">Manage business party records, payment terms, and GST details.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <DataTable columns={columns} data={customers} loading={loading} searchPlaceholder="Search customer by name, code or GSTIN..." />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-4">Add Customer Record</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Customer Code *</label>
                  <input
                    type="text"
                    required
                    value={form.customerCode}
                    onChange={(e) => setForm({ ...form, customerCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. CUST-101"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. XYZ Ltd"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Contact person"
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
                  <label className="font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@customer.com"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">GSTIN</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                    placeholder="24AAAAA0000A1Z5"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">State *</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
