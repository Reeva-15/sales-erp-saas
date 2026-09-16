import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { ShieldCheck } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.get('/app/audit-logs')
      .then((res) => setLogs(res.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      header: 'Date & Time',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-gray-500 font-mono">{new Date(row.createdAt).toLocaleString()}</span>
      )
    },
    {
      header: 'User',
      cell: (row) => (
        <span className="font-semibold text-gray-800 text-xs">{row.user?.name || 'System User'}</span>
      )
    },
    {
      header: 'Module & Action',
      cell: (row) => (
        <div className="text-xs">
          <span className="font-bold text-marron-800">{row.module}</span> → <span className="font-mono text-gray-700 bg-warm-100 px-1 rounded">{row.action}</span>
        </div>
      )
    },
    {
      header: 'Details / Record',
      cell: (row) => (
        <span className="text-xs text-gray-600 truncate max-w-xs block font-mono">
          {row.newValueJson || row.oldValueJson || '—'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-marron-800">Append-Only Audit Trail</h1>
        <p className="text-xs text-gray-500">Immutable event log tracking logins, approvals, pricing modifications, and document updates.</p>
      </div>

      <DataTable columns={columns} data={logs} loading={loading} searchPlaceholder="Search audit logs by module or action..." />
    </div>
  );
};
