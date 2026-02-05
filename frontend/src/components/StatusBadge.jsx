// components/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    ACTIVE: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: '✓'
    },
    UNSUBSCRIBED: {
      label: 'Unsubscribed',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '✕'
    },
    BOUNCED: {
      label: 'Bounced',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: '⚠'
    },
    COMPLAINED: {
      label: 'Complained',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '⚠'
    },
    PENDING: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⏳'
    }
  };

  const config = statusConfig[status] || statusConfig.ACTIVE;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;