import React, { useState } from 'react';
import { ApprovalItem } from '../../../types/approval.types';
import { format } from 'date-fns';

interface ApprovalCardProps {
  approval: ApprovalItem;
  onApprove: (approvalId: string, comments?: string) => Promise<void>;
  onReject: (approvalId: string, comments: string) => Promise<void>;
  onRequestInfo: (approvalId: string, comments: string) => Promise<void>;
  onViewDetails: (invoiceId: string) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onApprove,
  onReject,
  onRequestInfo,
  onViewDetails,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'info' | null>(null);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!actionType) return;

    setProcessing(true);
    try {
      if (actionType === 'approve') {
        await onApprove(approval.id, comments || undefined);
      } else if (actionType === 'reject') {
        if (!comments.trim()) {
          alert('Comments are required for rejection');
          return;
        }
        await onReject(approval.id, comments);
      } else if (actionType === 'info') {
        if (!comments.trim()) {
          alert('Comments are required when requesting information');
          return;
        }
        await onRequestInfo(approval.id, comments);
      }

      setShowActions(false);
      setActionType(null);
      setComments('');
    } catch (err) {
      alert('Action failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      normal: 'bg-blue-100 text-blue-700 border-blue-300',
      low: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[priority] || colors.normal;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow border-l-4 p-6 ${
        approval.isOverdue
          ? 'border-l-red-500'
          : approval.priority === 'urgent'
          ? 'border-l-red-400'
          : approval.priority === 'high'
          ? 'border-l-orange-400'
          : 'border-l-blue-400'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {approval.invoice.invoiceNumber}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(approval.priority)}`}>
              {approval.priority.toUpperCase()}
            </span>
            {approval.isOverdue && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
                OVERDUE
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {approval.invoice.vendor.name}
            {approval.invoice.department && (
              <span className="ml-2">• {approval.invoice.department.name}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(approval.invoice.totalAmount, approval.invoice.currency)}
          </div>
          <div className="text-sm text-gray-600">Level {approval.level}</div>
        </div>
      </div>

      {approval.invoice.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
          {approval.invoice.description}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-600">Invoice Date</div>
          <div className="font-medium text-gray-900">
            {format(new Date(approval.invoice.invoiceDate), 'MMM dd, yyyy')}
          </div>
        </div>
        <div>
          <div className="text-gray-600">Due Date</div>
          <div className="font-medium text-gray-900">
            {format(new Date(approval.invoice.dueDate), 'MMM dd, yyyy')}
          </div>
        </div>
        <div>
          <div className="text-gray-600">Assigned</div>
          <div className="font-medium text-gray-900">
            {format(new Date(approval.assignedAt), 'MMM dd, yyyy')}
          </div>
        </div>
        <div>
          <div className="text-gray-600">Time Remaining</div>
          <div className={`font-medium ${approval.isOverdue ? 'text-red-600' : approval.daysRemaining <= 1 ? 'text-orange-600' : 'text-gray-900'}`}>
            {approval.isOverdue
              ? `${Math.abs(approval.daysRemaining)} days overdue`
              : approval.daysRemaining === 0
              ? 'Due today'
              : `${approval.daysRemaining} days`}
          </div>
        </div>
      </div>

      {approval.previousApprovals.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">Previous Approvals</div>
          <div className="space-y-2">
            {approval.previousApprovals.map((prev, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                  prev.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {prev.status === 'approved' ? '✓' : '✗'}
                </span>
                <span className="text-gray-700">
                  Level {prev.level}: {prev.approver} - {prev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showActions ? (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setActionType('approve');
              setShowActions(true);
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Approve
          </button>
          <button
            onClick={() => {
              setActionType('reject');
              setShowActions(true);
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Reject
          </button>
          <button
            onClick={() => {
              setActionType('info');
              setShowActions(true);
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
          >
            Request Info
          </button>
          <button
            onClick={() => onViewDetails(approval.invoice.id)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            View Details
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments {actionType !== 'approve' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                actionType === 'approve'
                  ? 'Optional comments...'
                  : actionType === 'reject'
                  ? 'Reason for rejection (required)...'
                  : 'Questions or information needed (required)...'
              }
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAction}
              disabled={processing}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionType === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {processing ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : actionType === 'reject' ? 'Rejection' : 'Request'}`}
            </button>
            <button
              onClick={() => {
                setShowActions(false);
                setActionType(null);
                setComments('');
              }}
              disabled={processing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
