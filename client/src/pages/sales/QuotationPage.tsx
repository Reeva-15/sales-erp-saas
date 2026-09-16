import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PdfModal } from '../../components/common/PdfModal';
import { Plus, FileText, Send, Eye, ShoppingCart, Trash2 } from 'lucide-react';

export const QuotationPage: React.FC = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activePdf, setActivePdf] = useState<{ title: string; url: string } | null>(null);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; discountPercent: number }>>([
    { productId: '', quantity: 1, discountPercent: 0 }
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, cRes, pRes] = await Promise.all([
        ApiService.get('/app/quotations'),
        ApiService.get('/app/customers'),
        ApiService.get('/app/products')
      ]);
      setQuotations(qRes.quotations || []);
      setCustomers(cRes);
      setProducts(pRes);
      if (cRes.length > 0) setSelectedCustomer(cRes[0].id);
      if (pRes.length > 0) setItems([{ productId: pRes[0].id, quantity: 1, discountPercent: 0 }]);
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
      setItems([...items, { productId: products[0].id, quantity: 1, discountPercent: 0 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/app/quotations', {
        customerId: selectedCustomer,
        items
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      const res = await ApiService.post(`/app/quotations/${id}/submit`, {});
      alert(`Quotation status: ${res.quotation.status}. ${res.approvalEval.message}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConvertToOrder = async (id: string) => {
    try {
      const res = await ApiService.post(`/app/sales-orders/convert-quotation/${id}`, {});
      alert(`Quotation successfully converted to Sales Order: ${res.orderNumber}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Quotation # & Date',
      accessorKey: 'quotationNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.quotationNumber}</p>
          <p className="text-xs text-gray-500">{new Date(row.quotationDate).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      header: 'Customer',
      accessorKey: 'customer.customerName',
      cell: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.customer?.customerName}</p>
          <p className="text-xs text-gray-500">{row.customer?.customerCode}</p>
        </div>
      )
    },
    {
      header: 'Created By / Sales Manager',
      cell: (row) => {
        const name = row.salesperson?.name || row.createdBy?.name || 'Client Admin';
        const code = row.salesperson?.code || row.createdBy?.username;
        return (
          <div className="text-xs">
            <p className="font-bold text-marron-800">{name}</p>
            {code && <span className="font-mono text-[10px] bg-marron-50 text-marron-800 px-1.5 py-0.5 rounded font-semibold border border-marron-200/60">{code}</span>}
          </div>
        );
      }
    },
    {
      header: 'Grand Total',
      accessorKey: 'grandTotal',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-extrabold text-marron-900">₹ {Number(row.grandTotal).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500">Tax: ₹ {Number(row.taxTotal).toLocaleString('en-IN')}</p>
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
          <h1 className="text-2xl font-bold text-marron-800">Quotation Management</h1>
          <p className="text-xs text-gray-500">Generate commercial estimates with dynamic pricing rules and approval workflows.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Quotation</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={quotations}
        loading={loading}
        searchPlaceholder="Search quotation number or customer..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setActivePdf({ title: `Quotation ${row.quotationNumber}`, url: `/api/app/quotations/${row.id}/pdf` })}
              className="p-1.5 text-gray-600 hover:text-marron-800 bg-gray-100 hover:bg-marron-50 rounded-lg transition"
              title="View PDF"
            >
              <Eye className="h-4 w-4" />
            </button>

            {row.status === 'DRAFT' && (
              <button
                onClick={() => handleSubmitForApproval(row.id)}
                className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                <span>Submit</span>
              </button>
            )}

            {row.status === 'APPROVED' && (
              <button
                onClick={() => handleConvertToOrder(row.id)}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1"
              >
                <ShoppingCart className="h-3 w-3" />
                <span>Convert to Order</span>
              </button>
            )}
          </div>
        )}
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-warm-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-marron-800 mb-4">Create Commercial Quotation</h3>
            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700">Select Customer *</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-marron-800">Quotation Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-marron-800 hover:text-marron-600 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Line Item
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
                          setItems(updated);
                        }}
                        className="w-full mt-0.5 p-1.5 bg-white border rounded-md"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Base ₹{p.sellingPrice})
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
                        className="w-full mt-0.5 p-1.5 bg-white border rounded-md font-bold text-gray-900"
                      />
                    </div>

                    <div className="w-24">
                      <label className="font-medium text-gray-600">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={it.discountPercent === 0 ? '' : it.discountPercent}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = [...items];
                          updated[idx].discountPercent = val === '' ? 0 : Number(val);
                          setItems(updated);
                        }}
                        className="w-full mt-0.5 p-1.5 bg-white border rounded-md font-bold text-marron-800"
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

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-marron-800 text-white font-semibold rounded-lg shadow">
                  Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {activePdf && (
        <PdfModal isOpen={true} onClose={() => setActivePdf(null)} title={activePdf.title} pdfUrl={activePdf.url} />
      )}
    </div>
  );
};
