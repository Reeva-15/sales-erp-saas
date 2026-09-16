import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CreditCard } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.get('/app/payments')
      .then((res) => setPayments(res.payments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Payment # & Date',
      accessorKey: 'paymentNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.paymentNumber}</p>
          <p className="text-xs text-gray-500">{new Date(row.paymentDate).toLocaleDateString()}</p>
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
      header: 'Allocated Invoice',
      cell: (row) => {
        const inv = row.allocations?.[0]?.invoice;
        if (!inv) return <span className="text-gray-400">—</span>;
        return (
          <div>
            <span className="font-mono text-xs bg-warm-100 px-2 py-0.5 rounded text-gray-800 font-semibold">{inv.invoiceNumber}</span>
            {inv.grandTotal && (
              <p className="text-[11px] text-gray-500 mt-0.5">Total: ₹ {Number(inv.grandTotal).toLocaleString('en-IN')}</p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Amount Collected',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => <p className="font-extrabold text-emerald-800">₹ {Number(row.amount).toLocaleString('en-IN')}</p>
    },
    {
      header: 'Remaining Balance',
      cell: (row) => {
        const inv = row.allocations?.[0]?.invoice;
        const balance = inv ? Number(inv.balanceAmount) : 0;
        return (
          <div>
            <p className={`font-extrabold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹ {balance.toLocaleString('en-IN')}
            </p>
            {balance > 0 ? (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Pending Balance
              </span>
            ) : (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Fully Paid
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Mode & Ref',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-gray-700">{row.paymentMode}</p>
          <p className="text-gray-500 font-mono">{row.referenceNumber || '—'}</p>
        </div>
      )
    },
    {
      header: 'Invoice Status',
      cell: (row) => {
        const inv = row.allocations?.[0]?.invoice;
        const status = inv && Number(inv.balanceAmount) > 0 ? 'PENDING' : (inv?.status || 'PAID');
        return <StatusBadge status={status} />;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron-800">Customer Payments Collection</h1>
        <p className="text-xs text-gray-500">Track all received payments and invoice allocations.</p>
      </div>

      <DataTable columns={columns} data={payments} loading={loading} searchPlaceholder="Search payment number or customer..." />
    </div>
  );
};
