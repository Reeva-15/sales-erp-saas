import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, HelpCircle, FileText, ArrowRight, Trash2 } from 'lucide-react';

export const EnquiryPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    contactPerson: '',
    contactDetails: '',
    salespersonId: '',
    source: 'Website',
    expectedValue: '',
    notes: ''
  });

  const [items, setItems] = useState<Array<{ productId: string; quantity: number; expectedPrice: string; description: string }>>([
    { productId: '', quantity: 1, expectedPrice: '', description: '' }
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eRes, cRes, pRes, spRes] = await Promise.all([
        ApiService.get('/app/enquiries'),
        ApiService.get('/app/customers'),
        ApiService.get('/app/products'),
        ApiService.get('/app/salespersons')
      ]);
      setEnquiries(eRes || []);
      setCustomers(cRes || []);
      setProducts(pRes || []);
      setSalespersons(spRes || []);

      if (cRes.length > 0) setForm((f) => ({ ...f, customerId: cRes[0].id }));
      if (pRes.length > 0) setItems([{ productId: pRes[0].id, quantity: 1, expectedPrice: String(pRes[0].sellingPrice), description: pRes[0].name }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1, expectedPrice: String(products[0].sellingPrice), description: products[0].name }]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, index) => index !== idx));
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/app/enquiries', {
        ...form,
        expectedValue: Number(form.expectedValue || 0),
        items
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Enquiry # & Date',
      accessorKey: 'enquiryNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.enquiryNumber}</p>
          <p className="text-xs text-gray-500">{new Date(row.enquiryDate).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      header: 'Customer & Contact',
      cell: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.customer?.customerName}</p>
          <p className="text-xs text-gray-500">{row.contactPerson || row.customer?.contactPerson || '—'}</p>
        </div>
      )
    },
    {
      header: 'Source & Salesperson',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-semibold px-2 py-0.5 rounded bg-warm-100 text-gray-800 mr-2">{row.source || 'Direct'}</span>
          <span className="text-gray-600">{row.salesperson?.name || 'Unassigned'}</span>
        </div>
      )
    },
    {
      header: 'Expected Value',
      accessorKey: 'expectedValue',
      sortable: true,
      cell: (row) => <p className="font-extrabold text-emerald-800">₹ {Number(row.expectedValue || 0).toLocaleString('en-IN')}</p>
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
          <h1 className="text-2xl font-bold text-marron-800">Enquiry Management</h1>
          <p className="text-xs text-gray-500">Capture initial customer requirements, leads, and estimated values before generating a quotation.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Customer Enquiry</span>
        </button>
      </div>

      <DataTable columns={columns} data={enquiries} loading={loading} searchPlaceholder="Search enquiry number or customer..." />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-warm-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-marron-800 mb-4">Capture Customer Enquiry</h3>
            <form onSubmit={handleCreateEnquiry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Select Customer *</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-medium"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerName} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Lead Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  >
                    <option value="Website">Website Inquiry</option>
                    <option value="Referral">Referral</option>
                    <option value="Trade Show">Trade Show / Expo</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Direct">Direct Visit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Contact name"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Assigned Salesperson</label>
                  <select
                    value={form.salespersonId}
                    onChange={(e) => setForm({ ...form, salespersonId: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {salespersons.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Expected Value (₹)</label>
                  <input
                    type="number"
                    value={form.expectedValue}
                    onChange={(e) => setForm({ ...form, expectedValue: e.target.value })}
                    placeholder="50000"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Requirement Items */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-marron-800">Enquiry Requirement Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-marron-800 hover:text-marron-600 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Requirement Item
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-warm-50 rounded-xl border border-warm-200">
                    <div className="flex-1">
                      <label className="font-medium text-gray-600">Product</label>
                      <select
                        value={it.productId}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].productId = e.target.value;
                          const p = products.find((x) => x.id === e.target.value);
                          if (p) {
                            updated[idx].description = p.name;
                            updated[idx].expectedPrice = String(p.sellingPrice);
                          }
                          setItems(updated);
                        }}
                        className="w-full mt-0.5 p-1.5 bg-white border rounded-md"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="font-medium text-gray-600">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity === 0 ? '' : it.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...items];
                          updated[idx].quantity = val === '' ? 0 : Number(val);
                          setItems(updated);
                        }}
                        className="w-full mt-0.5 p-1.5 bg-white border rounded-md font-bold"
                      />
                    </div>

                    <div className="w-28">
                      <label className="font-medium text-gray-600">Target Price (₹)</label>
                      <input
                        type="number"
                        value={it.expectedPrice}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].expectedPrice = e.target.value;
                          setItems(updated);
                        }}
                        className="w-full mt-0.5 p-1.5 bg-white border rounded-md font-semibold"
                      />
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 self-end mb-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="font-semibold text-gray-700">Notes / Customer Requirements</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Enter specific technical or commercial customer requirements..."
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-marron-800 text-white font-semibold rounded-lg shadow">
                  Save Customer Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
