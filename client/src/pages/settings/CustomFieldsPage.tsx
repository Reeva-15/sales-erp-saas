import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { Sliders, Plus } from 'lucide-react';

export const CustomFieldsPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState('CUSTOMER');
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [newField, setNewField] = useState({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'TEXT',
    isRequired: false
  });

  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const loadFields = () => {
    setLoading(true);
    ApiService.get(`/app/custom-fields/${selectedModule}`)
      .then(setFields)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setExpandedFieldId(null);
    loadFields();
  }, [selectedModule]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/app/custom-fields', {
        ...newField,
        module: selectedModule
      });
      setShowModal(false);
      loadFields();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron-800">Dynamic Custom Fields Engine</h1>
          <p className="text-xs text-gray-500">Configure customer-specific fields without source code or database migrations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-marron-800 text-white font-semibold text-xs rounded-xl shadow hover:bg-marron-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Module selector */}
      <div className="flex items-center gap-2 border-b border-warm-200 text-xs font-semibold">
        {['CUSTOMER', 'PRODUCT', 'ENQUIRY', 'QUOTATION', 'SALES_ORDER', 'INVOICE'].map((mod) => (
          <button
            key={mod}
            onClick={() => setSelectedModule(mod)}
            className={`pb-3 px-3 border-b-2 transition ${
              selectedModule === mod ? 'border-marron-800 text-marron-800 font-bold' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Fields List */}
      <div className="glass-card rounded-2xl p-4">
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-6">Loading custom fields...</p>
        ) : fields.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">No custom fields defined for {selectedModule}.</p>
        ) : (
          <div className="divide-y divide-warm-100 space-y-2">
            {fields.map((f) => {
              const isExpanded = expandedFieldId === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setExpandedFieldId(isExpanded ? null : f.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isExpanded ? 'bg-marron-50/40 border-marron-300 shadow-sm' : 'bg-white/60 border-warm-200 hover:bg-warm-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-marron-100 text-marron-800 flex items-center justify-center font-bold text-xs">
                        {f.fieldLabel ? f.fieldLabel.charAt(0).toUpperCase() : 'F'}
                      </div>
                      <div>
                        <p className="font-bold text-marron-900 text-sm">{f.fieldLabel}</p>
                        <p className="text-gray-500 font-mono text-[11px]">Field Name: <span className="text-marron-700 font-semibold">{f.fieldName}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.isRequired ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                        {f.isRequired ? 'Required' : 'Optional'}
                      </span>
                      <span className="text-[10px] bg-marron-100 text-marron-800 font-semibold px-2 py-0.5 rounded">
                        Click to {isExpanded ? 'Collapse' : 'View Details'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-marron-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-3 rounded-lg border border-marron-100">
                      <div className="space-y-2">
                        <p className="font-bold text-marron-800 uppercase tracking-wider text-[10px]">Field Specification</p>
                        <div className="space-y-1">
                          <p className="text-gray-600"><span className="font-semibold text-gray-800">Display Label:</span> {f.fieldLabel}</p>
                          <p className="text-gray-600"><span className="font-semibold text-gray-800">System Field Name:</span> <code className="bg-warm-100 px-1.5 py-0.5 rounded text-marron-800 font-mono">{f.fieldName}</code></p>
                          <p className="text-gray-600"><span className="font-semibold text-gray-800">Target Module:</span> <span className="font-medium text-marron-700">{f.module || selectedModule}</span></p>
                          <p className="text-gray-600"><span className="font-semibold text-gray-800">Data Type:</span> <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">{f.fieldType}</span></p>
                          <p className="text-gray-600"><span className="font-semibold text-gray-800">Validation:</span> {f.isRequired ? 'Mandatory Field (Required)' : 'Optional Field'}</p>
                        </div>
                      </div>

                      <div className="space-y-2 border-l border-warm-200 pl-4">
                        <p className="font-bold text-marron-800 uppercase tracking-wider text-[10px]">Live Form Input Preview</p>
                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            {f.fieldLabel} {f.isRequired && <span className="text-red-500">*</span>}
                          </label>
                          {f.fieldType === 'CHECKBOX' ? (
                            <div className="flex items-center gap-2 mt-2">
                              <input type="checkbox" className="h-4 w-4 text-marron-600 rounded" defaultChecked />
                              <span className="text-gray-700">{f.fieldLabel}</span>
                            </div>
                          ) : f.fieldType === 'DROPDOWN' ? (
                            <select className="w-full p-2 bg-warm-50 border border-warm-300 rounded-lg text-xs">
                              <option>Select Option...</option>
                            </select>
                          ) : (
                            <input
                              type={f.fieldType === 'NUMBER' || f.fieldType === 'DECIMAL' ? 'number' : f.fieldType === 'DATE' ? 'date' : 'text'}
                              placeholder={`Enter ${f.fieldLabel}...`}
                              className="w-full p-2 bg-warm-50 border border-warm-300 rounded-lg text-xs"
                              disabled
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-4">Add Custom Field for {selectedModule}</h3>
            <form onSubmit={handleCreateField} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700">Field Label *</label>
                <input
                  type="text"
                  required
                  value={newField.fieldLabel}
                  onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value, fieldName: e.target.value })}
                  placeholder="e.g. Machine Serial Number"
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700">Field Type *</label>
                <select
                  value={newField.fieldType}
                  onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="DECIMAL">Decimal</option>
                  <option value="DATE">Date</option>
                  <option value="DROPDOWN">Dropdown</option>
                  <option value="CHECKBOX">Checkbox</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="req"
                  checked={newField.isRequired}
                  onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                />
                <label htmlFor="req" className="font-semibold text-gray-700">Is Required Field?</label>
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
                  Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
