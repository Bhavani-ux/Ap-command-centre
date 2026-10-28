import React, { useEffect, useState } from 'react';
import { approvalsAPI } from '../../services/api.client';

interface Approval {
  id: string;
  invoice: {
    id: string;
    referenceNumber: string;
    invoiceNumber: string;
    totalAmount: number;
    vendor: { name: string };
    department: { name: string } | null;
    category: string | null;
  };
  level: number;
  status: string;
  assignedAt: string;
  dueAt: string | null;
}

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | null;
    id: string | null;
  }>({ type: null, id: null });
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalsAPI.getPending();
      setApprovals(response.data.approvals);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessing(true);
      await approvalsAPI.approve(id, comments);
      await fetchApprovals();
      setActionModal({ type: null, id: null });
      setComments('');
      setSelectedApprovals(new Set());
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!comments.trim()) {
      alert('Comments are required for rejection');
      return;
    }
    try {
      setProcessing(true);
      await approvalsAPI.reject(id, comments);
      await fetchApprovals();
      setActionModal({ type: null, id: null });
      setComments('');
      setSelectedApprovals(new Set());
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedApprovals.size === 0) {
      alert('Please select at least one approval');
      return;
    }
    if (!confirm(`Approve ${selectedApprovals.size} invoice(s)?`)) {
      return;
    }
    try {
      setProcessing(true);
      await approvalsAPI.bulkApprove(Array.from(selectedApprovals), comments);
      await fetchApprovals();
      setSelectedApprovals(new Set());
      setComments('');
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      alert('Failed to bulk approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedApprovals.size === 0) {
      alert('Please select at least one approval');
      return;
    }
    if (!comments.trim()) {
      alert('Comments are required for rejection');
      return;
    }
    if (!confirm(`Reject ${selectedApprovals.size} invoice(s)?`)) {
      return;
    }
    try {
      setProcessing(true);
      await approvalsAPI.bulkReject(Array.from(selectedApprovals), comments);
      await fetchApprovals();
      setSelectedApprovals(new Set());
      setComments('');
    } catch (error) {
      console.error('Failed to bulk reject:', error);
      alert('Failed to bulk reject');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedApprovals);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedApprovals(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedApprovals.size === approvals.length) {
      setSelectedApprovals(new Set());
    } else {
      setSelectedApprovals(new Set(approvals.map((a) => a.id)));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve pending invoices</p>
        </div>
        <div className="flex gap-2">
          {selectedApprovals.size > 0 && (
            <>
              <button
                onClick={handleBulkApprove}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Selected ({selectedApprovals.size})
              </button>
              <button
                onClick={handleBulkReject}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Selected ({selectedApprovals.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Approvals</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{approvals.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(approvals.reduce((sum, a) => sum + Number(a.invoice.totalAmount), 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Selected</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{selectedApprovals.size}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg. Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(approvals.length > 0 ? approvals.reduce((sum, a) => sum + Number(a.invoice.totalAmount), 0) / approvals.length : 0)}
          </p>
        </div>
      </div>

      {/* Bulk Comments */}
      {selectedApprovals.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bulk Action Comments (optional for approval, required for rejection)
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter comments for bulk action..."
          />
        </div>
      )}

      {/* Approvals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedApprovals.size === approvals.length && approvals.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.has(approval.id)}
                        onChange={() => toggleSelection(approval.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {approval.invoice.referenceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.invoice.vendor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {approval.invoice.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(Number(approval.invoice.totalAmount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Level {approval.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(approval.assignedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setActionModal({ type: 'approve', id: approval.id })}
                        disabled={processing}
                        className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'reject', id: approval.id })}
                        disabled={processing}
                        className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && approvals.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-500">No pending approvals</p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.type && actionModal.id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionModal.type === 'approve' ? 'Approve Invoice' : 'Reject Invoice'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {actionModal.type === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${actionModal.type === 'reject' ? 'rejection reason' : 'optional comments'}...`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActionModal({ type: null, id: null });
                  setComments('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (actionModal.type === 'approve') {
                    handleApprove(actionModal.id!);
                  } else {
                    handleReject(actionModal.id!);
                  }
                }}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? 'Processing...' : actionModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
