import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

export const ApprovalPage: React.FC = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');

  const loadData = () => {
    setLoading(true);
    ApiService.get('/app/approvals/pending')
      .then(setPending)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    try {
      await ApiService.post('/app/approvals/action', {
        documentType: 'QUOTATION',
        documentId: selectedDoc.id,
        action: actionType,
        comment
      });
      setSelectedDoc(null);
      setComment('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Quotation # & Date',
      accessorKey: 'quotationNumber',
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
      cell: (row) => <p className="font-semibold text-gray-800">{row.customer?.customerName}</p>
    },
    {
      header: 'Grand Total',
      accessorKey: 'grandTotal',
      cell: (row) => <p className="font-extrabold text-marron-900">₹ {Number(row.grandTotal).toLocaleString('en-IN')}</p>
    },
    {
      header: 'Created By',
      cell: (row) => <p className="text-xs text-gray-600">{row.createdBy?.name || 'Sales User'}</p>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron-800">Quotation Approval Queue</h1>
        <p className="text-xs text-gray-500">Review commercial quotations exceeding discount threshold limits.</p>
      </div>

      <DataTable
        columns={columns}
        data={pending}
        loading={loading}
        emptyMessage="No pending quotation approvals in queue."
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedDoc(row);
                setActionType('APPROVED');
              }}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => {
                setSelectedDoc(row);
                setActionType('REJECTED');
              }}
              className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex items-center gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          </div>
        )}
      />

      {/* Action Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-2">
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Quotation {selectedDoc.quotationNumber}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Grand Total: <span className="font-bold text-gray-800">₹ {Number(selectedDoc.grandTotal).toLocaleString('en-IN')}</span>
            </p>

            <form onSubmit={handleProcessAction} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700">Approval Comment / Notes</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter reason for approval or rejection..."
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-semibold rounded-lg shadow ${
                    actionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
