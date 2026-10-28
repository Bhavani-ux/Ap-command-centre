import React from 'react';
import { InvoicePipelineStats } from '../../../types/invoice-tracker.types';

interface InvoicePipelineProps {
  stats: InvoicePipelineStats;
  onStageClick: (stage: string) => void;
}

export const InvoicePipeline: React.FC<InvoicePipelineProps> = ({ stats, onStageClick }) => {
  const stages = [
    {
      key: 'draft',
      label: 'Draft',
      count: stats.draft,
      color: 'bg-gray-100 border-gray-300 text-gray-700',
      hoverColor: 'hover:bg-gray-200',
    },
    {
      key: 'pendingApproval',
      label: 'Pending Approval',
      count: stats.pendingApproval,
      color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
      hoverColor: 'hover:bg-yellow-200',
    },
    {
      key: 'approved',
      label: 'Approved',
      count: stats.approved,
      color: 'bg-green-100 border-green-300 text-green-700',
      hoverColor: 'hover:bg-green-200',
    },
    {
      key: 'paid',
      label: 'Paid',
      count: stats.paid,
      color: 'bg-blue-100 border-blue-300 text-blue-700',
      hoverColor: 'hover:bg-blue-200',
    },
  ];

  const alertStages = [
    {
      key: 'overdue',
      label: 'Overdue',
      count: stats.overdue,
      color: 'bg-red-100 border-red-300 text-red-700',
      hoverColor: 'hover:bg-red-200',
      icon: '!',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: stats.rejected,
      color: 'bg-orange-100 border-orange-300 text-orange-700',
      hoverColor: 'hover:bg-orange-200',
      icon: 'x',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Invoice Pipeline</h2>

      <div className="flex items-center gap-2 mb-6">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <button
              onClick={() => onStageClick(stage.key)}
              className={`flex-1 border-2 rounded-lg p-4 transition-all cursor-pointer ${stage.color} ${stage.hoverColor}`}
            >
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{stage.count}</div>
                <div className="text-sm font-medium">{stage.label}</div>
              </div>
            </button>
            {index < stages.length - 1 && (
              <div className="text-gray-400 text-2xl">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-4">
        {alertStages.map((stage) => (
          <button
            key={stage.key}
            onClick={() => onStageClick(stage.key)}
            className={`flex-1 border-2 rounded-lg p-4 transition-all cursor-pointer ${stage.color} ${stage.hoverColor}`}
          >
            <div className="flex items-center justify-center gap-3">
              {stage.icon && (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold">
                  {stage.icon}
                </div>
              )}
              <div>
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-sm font-medium">{stage.label}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
