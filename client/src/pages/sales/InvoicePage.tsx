import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PdfModal } from '../../components/common/PdfModal';
import { Eye, CreditCard, Receipt } from 'lucide-react';

export const InvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePdf, setActivePdf] = useState<{ title: string; url: string } | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);

  // Payment Form State
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'BANK' | 'CASH' | 'UPI' | 'CHEQUE'>('BANK');
  const [referenceNumber, setReferenceNumber] = useState('');

  const loadData = () => {
    setLoading(true);
    ApiService.get('/app/invoices')
      .then((res) => setInvoices(res.invoices || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    try {
      await ApiService.post('/app/payments', {
        customerId: paymentInvoice.customerId,
        invoiceId: paymentInvoice.id,
        amount: Number(amount),
        paymentMode,
        referenceNumber
      });
      setPaymentInvoice(null);
      setAmount('');
      setReferenceNumber('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Invoice # & Date',
      accessorKey: 'invoiceNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.invoiceNumber}</p>
          <p className="text-xs text-gray-500">{new Date(row.invoiceDate).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      header: 'Customer',
      accessorKey: 'customer.customerName',
      cell: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.customer?.customerName}</p>
          <p className="text-xs text-gray-500">GSTIN: {row.customerGstin || 'URP'}</p>
        </div>
      )
    },
    {
      header: 'Grand Total & Tax',
      accessorKey: 'grandTotal',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-extrabold text-marron-900">₹ {Number(row.grandTotal).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500">GST Tax: ₹ {Number(row.taxTotal).toLocaleString('en-IN')}</p>
        </div>
      )
    },
    {
      header: 'Paid / Balance',
      cell: (row) => {
        const balance = Number(row.balanceAmount);
        return (
          <div className="text-xs">
            <p className="font-bold text-emerald-700">Paid: ₹ {Number(row.paidAmount).toLocaleString('en-IN')}</p>
            <p className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              Remaining: ₹ {balance.toLocaleString('en-IN')}
            </p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => {
        const currentStatus = Number(row.balanceAmount) > 0 ? 'PENDING' : 'PAID';
        return <StatusBadge status={currentStatus} />;
      }
    }
  ];

  const payVal = Number(amount || 0);
  const currentBal = paymentInvoice ? Number(paymentInvoice.balanceAmount) : 0;
  const remainingAfterPayment = Math.max(0, currentBal - payVal);
  const projectedStatus = remainingAfterPayment > 0 ? 'PENDING' : 'PAID';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron-800">Tax Invoices</h1>
        <p className="text-xs text-gray-500">View generated tax invoices, intra-state CGST+SGST / IGST tax calculations, and record payments.</p>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Search invoice number or customer..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setActivePdf({ title: `Invoice ${row.invoiceNumber}`, url: `/api/app/invoices/${row.id}/pdf` })}
              className="p-1.5 text-gray-600 hover:text-marron-800 bg-gray-100 hover:bg-marron-50 rounded-lg transition"
              title="View PDF"
            >
              <Eye className="h-4 w-4" />
            </button>

            {row.balanceAmount > 0 && (
              <button
                onClick={() => {
                  setPaymentInvoice(row);
                  setAmount(String(row.balanceAmount));
                }}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Record Payment</span>
              </button>
            )}
          </div>
        )}
      />

      {/* Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-warm-200">
            <h3 className="text-lg font-bold text-marron-800 mb-1">Record Payment for {paymentInvoice.invoiceNumber}</h3>
            <p className="text-xs text-gray-500 mb-3">
              Customer: <span className="font-semibold text-gray-800">{paymentInvoice.customer?.customerName}</span>
            </p>

            {/* Live Balance Summary Box */}
            <div className="p-3 bg-warm-50 rounded-xl border border-warm-200 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Invoice Amount:</span>
                <span className="font-bold text-gray-900">₹ {Number(paymentInvoice.grandTotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Outstanding:</span>
                <span className="font-bold text-rose-600">₹ {currentBal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-warm-200 pt-1.5">
                <span className="font-semibold text-marron-800">Remaining Balance After Payment:</span>
                <span className={`font-extrabold ${remainingAfterPayment > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  ₹ {remainingAfterPayment.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-600">Updated Invoice Status:</span>
                <StatusBadge status={projectedStatus} />
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-gray-700">Payment Amount (₹) *</label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round(currentBal / 2)))}
                    className="text-[10px] text-marron-800 bg-marron-50 hover:bg-marron-100 px-2 py-0.5 rounded font-bold"
                  >
                    Pay Half (50%)
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentInvoice.balanceAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 bg-warm-50 border rounded-lg font-bold text-marron-800 text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1.5">Select Payment Mode *</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: '📱' },
                    { id: 'CHEQUE', label: 'Cheque', icon: '📜' },
                    { id: 'CASH', label: 'Cash', icon: '💵' },
                    { id: 'BANK', label: 'Bank (NEFT)', icon: '🏦' }
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMode(m.id as any)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition flex flex-col items-center gap-1 ${
                        paymentMode === m.id
                          ? 'bg-marron-800 text-white border-marron-800 shadow'
                          : 'bg-warm-50 text-gray-700 border-warm-200 hover:bg-warm-100'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Payment Reference Number</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={paymentMode === 'UPI' ? 'UPI UTR / Txn ID' : paymentMode === 'CHEQUE' ? 'Cheque No. & Bank' : 'NEFT / Reference ID'}
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow">
                  Post Payment
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
