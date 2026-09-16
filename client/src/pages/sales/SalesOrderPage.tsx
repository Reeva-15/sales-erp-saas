import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShoppingCart, Receipt } from 'lucide-react';

export const SalesOrderPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    ApiService.get('/app/sales-orders')
      .then((res) => setOrders(res.salesOrders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConvertToInvoice = async (id: string) => {
    try {
      const res = await ApiService.post(`/app/invoices/convert-sales-order/${id}`, {});
      alert(`Tax Invoice generated successfully: ${res.invoiceNumber}`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Order # & Date',
      accessorKey: 'orderNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-marron-800">{row.orderNumber}</p>
          <p className="text-xs text-gray-500">{new Date(row.orderDate).toLocaleDateString()}</p>
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
      header: 'Grand Total',
      accessorKey: 'grandTotal',
      sortable: true,
      cell: (row) => <p className="font-extrabold text-marron-900">₹ {Number(row.grandTotal).toLocaleString('en-IN')}</p>
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
        <h1 className="text-2xl font-bold text-marron-800">Sales Orders</h1>
        <p className="text-xs text-gray-500">Track confirmed customer sales orders converted from approved quotations.</p>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchPlaceholder="Search order number or customer..."
        actions={(row) => (
          <div className="flex items-center justify-end">
            {row.status === 'CONFIRMED' && (
              <button
                onClick={() => handleConvertToInvoice(row.id)}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition flex items-center gap-1"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Generate Invoice</span>
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
};
