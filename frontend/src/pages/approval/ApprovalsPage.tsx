import React, { useEffect, useState } from 'react';
import { useApproval } from '../../hooks/approval/useApproval';
import { ApprovalCard } from '../../components/approval/ApprovalCard/ApprovalCard';
import { ApprovalFilters } from '../../components/approval/ApprovalFilters/ApprovalFilters';
import { ApprovalFilters as FiltersType } from '../../types/approval.types';
import { format } from 'date-fns';

export const ApprovalsPage: React.FC = () => {
  const {
    pendingApprovals,
    approvalHistory,
    approvalStats,
    escalations,
    loading,
    error,
    fetchPendingApprovals,
    approveInvoice,
    rejectInvoice,
    requestInfo,
    fetchApprovalHistory,
    fetchApprovalStats,
    fetchEscalations,
    bulkApprove,
    bulkReject,
    refreshData,
  } = useApproval();

  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'escalations'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkComments, setBulkComments] = useState('');

  useEffect(() => {
    refreshData();
    if (activeTab === 'history') {
      fetchApprovalHistory();
    }
  }, [activeTab]);

  const handleFilterChange = (filters: FiltersType) => {
    fetchPendingApprovals(filters);
  };

  const handleViewDetails = (invoiceId: string) => {
    window.location.href = `/invoice-tracker`;
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    try {
      const result = await bulkApprove(selectedIds, bulkComments || undefined);
      if (result.success) {
        alert(`Successfully approved ${result.processed} invoices`);
      } else {
        alert(`Approved ${result.processed} invoices, ${result.failed} failed`);
      }
      setSelectedIds([]);
      setShowBulkActions(false);
      setBulkComments('');
    } catch (err) {
      alert('Bulk approval failed');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    if (!bulkComments.trim()) {
      alert('Comments are required for bulk rejection');
      return;
    }

    try {
      const result = await bulkReject(selectedIds, bulkComments);
      if (result.success) {
        alert(`Successfully rejected ${result.processed} invoices`);
      } else {
        alert(`Rejected ${result.processed} invoices, ${result.failed} failed`);
      }
      setSelectedIds([]);
      setShowBulkActions(false);
      setBulkComments('');
    } catch (err) {
      alert('Bulk rejection failed');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const urgentApprovals = pendingApprovals.filter((a) => a.priority === 'urgent');
  const overdueApprovals = pendingApprovals.filter((a) => a.isOverdue);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
            <p className="text-gray-600 mt-1">Review and approve pending invoices</p>
          </div>
          <button
            onClick={() => refreshData()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {approvalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-3xl font-bold text-blue-600">{approvalStats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Urgent</div>
              <div className="text-3xl font-bold text-red-600">{approvalStats.urgent}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Overdue</div>
              <div className="text-3xl font-bold text-orange-600">{approvalStats.overdue}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Approved Today</div>
              <div className="text-3xl font-bold text-green-600">{approvalStats.approvedToday}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Rejected Today</div>
              <div className="text-3xl font-bold text-red-600">{approvalStats.rejectedToday}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Avg Time</div>
              <div className="text-2xl font-bold text-gray-800">{approvalStats.averageTimeToApprove}h</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Processed</div>
              <div className="text-2xl font-bold text-gray-800">{approvalStats.totalProcessed}</div>
            </div>
          </div>
        )}

        {urgentApprovals.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold">
                  {urgentApprovals.length} urgent approval{urgentApprovals.length !== 1 ? 's' : ''} requiring immediate attention
                </div>
                <div className="text-sm text-red-700">
                  High-value invoices or approaching due dates
                </div>
              </div>
            </div>
          </div>
        )}

        {overdueApprovals.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="font-semibold">
                  {overdueApprovals.length} overdue approval{overdueApprovals.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-orange-700">
                  These approvals have exceeded the 3-day SLA
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pending ({pendingApprovals.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('escalations')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'escalations'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Escalations ({escalations.length})
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'pending' && (
          <>
            <ApprovalFilters onFilterChange={handleFilterChange} />

            {selectedIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {selectedIds.length} invoice(s) selected
                  </div>
                  <div className="flex gap-2">
                    {!showBulkActions ? (
                      <>
                        <button
                          onClick={() => setShowBulkActions(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Bulk Actions
                        </button>
                        <button
                          onClick={() => setSelectedIds([])}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Clear Selection
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bulkComments}
                          onChange={(e) => setBulkComments(e.target.value)}
                          placeholder="Optional comments..."
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleBulkApprove}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Approve All
                        </button>
                        <button
                          onClick={handleBulkReject}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject All
                        </button>
                        <button
                          onClick={() => {
                            setShowBulkActions(false);
                            setBulkComments('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading approvals...</div>
              </div>
            )}

            {!loading && pendingApprovals.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-xl font-semibold text-gray-800 mb-2">
                  All caught up!
                </div>
                <div className="text-gray-600">You have no pending approvals</div>
              </div>
            )}

            {!loading && (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(approval.invoice.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, approval.invoice.id]);
                        } else {
                          setSelectedIds(selectedIds.filter((id) => id !== approval.invoice.id));
                        }
                      }}
                      className="mt-6 w-5 h-5 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <ApprovalCard
                        approval={approval}
                        onApprove={approveInvoice}
                        onReject={rejectInvoice}
                        onRequestInfo={requestInfo}
                        onViewDetails={handleViewDetails}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {approvalHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.vendor}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.amount, item.currency)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.level}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {format(new Date(item.actionDate), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.comments || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'escalations' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {escalations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-xl font-semibold text-gray-800 mb-2">No escalations</div>
                <div className="text-gray-600">All approvals are within SLA</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approver</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {escalations.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.vendor}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${item.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.currentApprover}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {format(new Date(item.assignedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600">{item.escalationReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
