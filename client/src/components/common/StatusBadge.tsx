import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toUpperCase().trim();

  let style = 'bg-gray-100 text-gray-700 border-gray-200';

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'CONFIRMED':
    case 'PAID':
    case 'COMPLETED':
    case 'ACCEPTED':
    case 'WON':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'TRIAL':
    case 'PENDING_APPROVAL':
    case 'SUBMITTED':
    case 'PROCESSING':
    case 'PARTIALLY_PAID':
    case 'OPEN':
    case 'IN_PROGRESS':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'DRAFT':
      style = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'REJECTED':
    case 'CANCELLED':
    case 'SUSPENDED':
    case 'EXPIRED':
    case 'OVERDUE':
    case 'LOST':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'POSTED':
    case 'QUOTED':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
  }

  const displayText = normalized.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {displayText}
    </span>
  );
};
