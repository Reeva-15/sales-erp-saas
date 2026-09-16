import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Package, Tag, Layers } from 'lucide-react';

export const ProductMasterPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [form, setForm] = useState({
    productCode: '',
    sku: '',
    name: '',
    category: 'General',
    description: '',
    unitId: '',
    taxId: '',
    sellingPrice: '',
    costPrice: '0',
    hsnSac: '8414',
    minimumStock: '0'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, uRes] = await Promise.all([
        ApiService.get('/app/products'),
        ApiService.get('/app/taxes'),
        ApiService.get('/app/units')
      ]);
      setProducts(pRes);
      setTaxes(tRes);
      setUnits(uRes);
      if (uRes.length > 0) setForm((f) => ({ ...f, unitId: uRes[0].id }));
      if (tRes.length > 0) setForm((f) => ({ ...f, taxId: tRes[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setForm({
      productCode: '',
      sku: '',
      name: '',
      category: 'General',
      description: '',
      unitId: units[0]?.id || '',
      taxId: taxes[0]?.id || '',
      sellingPrice: '',
      costPrice: '0',
      hsnSac: '8414',
      minimumStock: '0'
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (prod: any) => {
    setEditingProduct(prod);
    setForm({
      productCode: prod.productCode || '',
      sku: prod.sku || '',
      name: prod.name || '',
      category: prod.category || 'General',
      description: prod.description || '',
      unitId: prod.unitId || units[0]?.id || '',
      taxId: prod.taxId || taxes[0]?.id || '',
      sellingPrice: String(prod.sellingPrice || ''),
      costPrice: String(prod.costPrice || 0),
      hsnSac: prod.hsnSac || '8414',
      minimumStock: String(prod.minimumStock || 0)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await ApiService.put(`/app/products/${editingProduct.id}`, form);
      } else {
        await ApiService.post('/app/products', form);
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
      header: 'Product Name & Code',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.name}</p>
          <p className="text-xs text-gray-500">Code: <span className="font-mono bg-warm-100 px-1 rounded">{row.productCode}</span> | SKU: {row.sku}</p>
        </div>
      )
    },
    {
      header: 'Category & HSN',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-medium text-gray-800">{row.category || 'General'}</p>
          <p className="text-gray-500">HSN/SAC: {row.hsnSac || '—'}</p>
        </div>
      )
    },
    {
      header: 'Selling Price',
      accessorKey: 'sellingPrice',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-extrabold text-gray-900">₹ {Number(row.sellingPrice).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Cost: ₹ {Number(row.costPrice).toLocaleString('en-IN')}</p>
        </div>
      )
    },
    {
      header: 'Tax Rate',
      cell: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          {row.tax?.name || '18% GST'}
        </span>
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
          <h1 className="text-2xl font-bold text-marron-800">Products & Catalog</h1>
          <p className="text-xs text-gray-500">Configure products, selling prices, GST tax rates, and HSN codes.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Search products by name, code or SKU..."
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-4">
              {editingProduct ? 'Edit Product & Catalog Details' : 'Add Product Record'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Product Code *</label>
                  <input
                    type="text"
                    required
                    value={form.productCode}
                    onChange={(e) => setForm({ ...form, productCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. MTR-5HP"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Industrial Motor 5HP"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Selling Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    placeholder="10000"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="6500"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">GST Tax Rate *</label>
                  <select
                    value={form.taxId}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                  >
                    {taxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.ratePercent}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">HSN/SAC Code</label>
                  <input
                    type="text"
                    value={form.hsnSac}
                    onChange={(e) => setForm({ ...form, hsnSac: e.target.value })}
                    placeholder="8414"
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
