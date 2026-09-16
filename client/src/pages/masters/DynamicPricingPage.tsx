import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Plus, Sliders, Calculator, CheckCircle2, Tag, Edit, Trash2, Power } from 'lucide-react';

export const DynamicPricingPage: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  // Test Calculator State
  const [testCalc, setTestCalc] = useState({
    customerId: '',
    productId: '',
    quantity: 1
  });
  const [testResult, setTestResult] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    priority: 1,
    ruleType: 'SPECIAL_CUSTOMER',
    productId: '',
    customerId: '',
    customerGroupId: '',
    minQty: 1,
    maxQty: '',
    rate: '',
    discountPercent: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, cRes, cgRes] = await Promise.all([
        ApiService.get('/app/pricing-rules'),
        ApiService.get('/app/products'),
        ApiService.get('/app/customers'),
        ApiService.get('/app/customer-groups')
      ]);
      setRules(rRes || []);
      setProducts(pRes || []);
      setCustomers(cRes || []);
      setCustomerGroups(cgRes || []);

      if (pRes.length > 0 && !form.productId) {
        setForm((f) => ({ ...f, productId: pRes[0].id }));
        setTestCalc((t) => ({ ...t, productId: pRes[0].id }));
      }
      if (cRes.length > 0 && !testCalc.customerId) {
        setTestCalc((t) => ({ ...t, customerId: cRes[0].id }));
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

  const handleTestPricing = async () => {
    if (!testCalc.productId || !testCalc.customerId) return;
    try {
      const res = await ApiService.post('/app/pricing/calculate', testCalc);
      setTestResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setEditingRule(null);
    setForm({
      priority: 1,
      ruleType: 'SPECIAL_CUSTOMER',
      productId: products[0]?.id || '',
      customerId: '',
      customerGroupId: '',
      minQty: 1,
      maxQty: '',
      rate: '',
      discountPercent: 0
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setForm({
      priority: rule.priority || 1,
      ruleType: rule.ruleType || 'SPECIAL_CUSTOMER',
      productId: rule.productId || '',
      customerId: rule.customerId || '',
      customerGroupId: rule.customerGroupId || '',
      minQty: rule.minQty ?? 1,
      maxQty: rule.maxQty ? String(rule.maxQty) : '',
      rate: String(rule.rate ?? ''),
      discountPercent: rule.discountPercent ?? 0
    });
    setShowModal(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await ApiService.delete(`/app/pricing-rules/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await ApiService.patch(`/app/pricing-rules/${id}/status`, {});
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRuleTypeChange = (type: string) => {
    let newPriority = 1;
    if (type === 'CUSTOMER_GROUP') newPriority = 2;
    if (type === 'QUANTITY_TIER') newPriority = 3;

    setForm({
      ...form,
      ruleType: type,
      priority: newPriority,
      customerId: type === 'SPECIAL_CUSTOMER' ? form.customerId : '',
      customerGroupId: type === 'CUSTOMER_GROUP' ? form.customerGroupId : ''
    });
  };

  const handleSubmitRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.ruleType === 'SPECIAL_CUSTOMER' && !form.customerId) {
      alert('Please select a target customer for the Special Customer Price rule.');
      return;
    }
    if (form.ruleType === 'CUSTOMER_GROUP' && !form.customerGroupId) {
      alert('Please select a target customer group for the Customer Group Price rule.');
      return;
    }

    try {
      if (editingRule) {
        await ApiService.put(`/app/pricing-rules/${editingRule.id}`, form);
      } else {
        await ApiService.post('/app/pricing-rules', form);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Priority & Rule Type',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-marron-800 text-white mr-2">
            P{row.priority}
          </span>
          <span className="font-bold text-gray-800 text-xs">{row.ruleType.replace(/_/g, ' ')}</span>
        </div>
      )
    },
    {
      header: 'Product',
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.product?.name}</p>
          <p className="text-xs text-gray-500">Base Price: ₹{row.product?.sellingPrice}</p>
        </div>
      )
    },
    {
      header: 'Assigned Target',
      cell: (row) => (
        <div className="text-xs">
          {row.customer && <p className="font-semibold text-gray-800">Customer: {row.customer.customerName}</p>}
          {row.customerGroup && <p className="font-semibold text-gray-800">Group: {row.customerGroup.name}</p>}
          {!row.customer && !row.customerGroup && <p className="text-gray-400 font-medium">All Customers (Tier {row.minQty}+)</p>}
        </div>
      )
    },
    {
      header: 'Min Qty',
      accessorKey: 'minQty',
      cell: (row) => <span className="font-semibold text-xs text-gray-700">{row.minQty} units</span>
    },
    {
      header: 'Applied Rate (₹)',
      accessorKey: 'rate',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-extrabold text-emerald-800">₹ {Number(row.rate).toLocaleString('en-IN')}</p>
          {row.discountPercent > 0 && <p className="text-[10px] text-emerald-600 font-semibold">{row.discountPercent}% Discount</p>}
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron-800">Dynamic Pricing Engine</h1>
          <p className="text-xs text-gray-500">Configure priority-based pricing rules: Special Customer, Customer Group, Volume Tier & Price Lists.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Pricing Rule</span>
        </button>
      </div>

      {/* Interactive Live Pricing Calculator Card */}
      <div className="glass-card p-5 rounded-3xl border border-warm-200 bg-gradient-to-br from-white to-warm-50/60 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-5 w-5 text-marron-800" />
          <h2 className="text-sm font-bold text-marron-900">Live Dynamic Pricing Test Calculator</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Select Customer</label>
            <select
              value={testCalc.customerId}
              onChange={(e) => setTestCalc({ ...testCalc, customerId: e.target.value })}
              className="w-full p-2 bg-white border rounded-lg font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName} ({c.customerCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Select Product</label>
            <select
              value={testCalc.productId}
              onChange={(e) => setTestCalc({ ...testCalc, productId: e.target.value })}
              className="w-full p-2 bg-white border rounded-lg font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Base ₹{p.sellingPrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={testCalc.quantity === 0 ? '' : testCalc.quantity}
              onChange={(e) => setTestCalc({ ...testCalc, quantity: e.target.value === '' ? 0 : Number(e.target.value) })}
              className="w-full p-2 bg-white border rounded-lg font-medium"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestPricing}
              className="w-full py-2 bg-marron-800 hover:bg-marron-700 text-white font-bold rounded-lg shadow transition"
            >
              Test Price Calculation
            </button>
          </div>
        </div>

        {/* Calculation Result Preview */}
        {testResult && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div>
              <p className="font-bold text-emerald-900 text-sm">Applied Rule: {testResult.ruleDescription}</p>
              <p className="text-gray-600 mt-0.5">
                Standard Base Price: ₹{testResult.standardPrice} | Applied Rule Rate: ₹{testResult.appliedRate} | Discount: {testResult.discountPercent}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-emerald-700">Final Calculated Unit Rate</p>
              <p className="text-xl font-extrabold text-emerald-900">₹ {Number(testResult.finalUnitRate).toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rules Table */}
      <DataTable
        columns={columns}
        data={rules}
        loading={loading}
        searchPlaceholder="Search pricing rules..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleToggleStatus(row.id)}
              className={`p-1.5 rounded-lg border transition ${
                row.active
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
              title={row.active ? 'Deactivate Rule' : 'Activate Rule'}
            >
              <Power className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleEditRule(row)}
              className="p-1.5 text-marron-800 hover:text-marron-900 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition"
              title="Edit Rule"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDeleteRule(row.id)}
              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              title="Delete Rule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      />

      {/* Create / Edit Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-4">
              {editingRule ? 'Edit Dynamic Pricing Rule' : 'Add Dynamic Pricing Rule'}
            </h3>
            <form onSubmit={handleSubmitRule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700">Rule Type *</label>
                  <select
                    value={form.ruleType}
                    onChange={(e) => handleRuleTypeChange(e.target.value)}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-bold text-marron-800"
                  >
                    <option value="SPECIAL_CUSTOMER">Special Customer Price</option>
                    <option value="CUSTOMER_GROUP">Customer Group Price</option>
                    <option value="QUANTITY_TIER">Quantity Tier Price</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Priority Level *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-bold"
                  >
                    <option value={1}>Priority 1: Special Customer Price</option>
                    <option value={2}>Priority 2: Customer Group Price</option>
                    <option value={3}>Priority 3: Volume Quantity Tier</option>
                    <option value={4}>Priority 4: Price List Rate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Select Product *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Base Price ₹{p.sellingPrice})
                    </option>
                  ))}
                </select>
              </div>

              {form.ruleType === 'SPECIAL_CUSTOMER' && (
                <div>
                  <label className="font-semibold text-gray-700">Assign Target Customer *</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-medium"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerName} ({c.customerCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.ruleType === 'CUSTOMER_GROUP' && (
                <div>
                  <label className="font-semibold text-gray-700">Assign Customer Group *</label>
                  <select
                    value={form.customerGroupId}
                    onChange={(e) => setForm({ ...form, customerGroupId: e.target.value })}
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-medium"
                  >
                    <option value="">Select Customer Group</option>
                    {customerGroups.map((cg) => (
                      <option key={cg.id} value={cg.id}>
                        {cg.name} ({cg.discountPercent}% default discount)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700">Min Qty *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.minQty === 0 ? '' : form.minQty}
                    onChange={(e) => setForm({ ...form, minQty: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="1"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Negotiated Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    placeholder="9500"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-bold text-marron-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent === 0 ? '' : form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0"
                    className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-semibold"
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
                  {editingRule ? 'Update Pricing Rule' : 'Save Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
