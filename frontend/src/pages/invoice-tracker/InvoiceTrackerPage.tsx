import React, { useEffect, useState } from 'react';
import { useInvoiceTracker } from '../../hooks/invoice-tracker/useInvoiceTracker';
import { InvoicePipeline } from '../../components/invoice-tracker/InvoicePipeline/InvoicePipeline';
import { InvoiceTable } from '../../components/invoice-tracker/InvoiceTable/InvoiceTable';
import { InvoiceFilters } from '../../components/invoice-tracker/InvoiceFilters/InvoiceFilters';
import { InvoiceDetailModal } from '../../components/invoice-tracker/InvoiceDetailModal/InvoiceDetailModal';
import { InvoiceTrackerQuery } from '../../types/invoice-tracker.types';

export const InvoiceTrackerPage: React.FC = () => {
  const {
    invoices,
    selectedInvoice,
    pipelineStats,
    agingReport,
    loading,
    error,
    pagination,
    fetchInvoices,
    fetchInvoiceDetail,
    fetchPipelineStats,
    fetchAgingReport,
    bulkUpdateStatus,
    clearSelectedInvoice,
    refreshData,
  } = useInvoiceTracker();

  const [currentFilters, setCurrentFilters] = useState<InvoiceTrackerQuery>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const handleFilterChange = (filters: InvoiceTrackerQuery) => {
    setCurrentFilters(filters);
    fetchInvoices({ ...filters, page: 1 });
  };

  const handleStageClick = (stage: string) => {
    let filters: InvoiceTrackerQuery = {};

    if (stage === 'draft') {
      filters = { status: ['draft'] };
    } else if (stage === 'pendingApproval') {
      filters = { approvalStatus: ['pending'] };
    } else if (stage === 'approved') {
      filters = { approvalStatus: ['approved'], paymentStatus: ['unpaid', 'scheduled'] };
    } else if (stage === 'paid') {
      filters = { paymentStatus: ['paid'] };
    } else if (stage === 'rejected') {
      filters = { approvalStatus: ['rejected'] };
    } else if (stage === 'overdue') {
      filters = { paymentStatus: ['unpaid', 'scheduled'], endDate: new Date() };
    }

    setCurrentFilters(filters);
    fetchInvoices({ ...filters, page: 1 });
  };

  const handleInvoiceClick = (invoiceId: string) => {
    fetchInvoiceDetail(invoiceId);
  };

  const handlePageChange = (page: number) => {
    fetchInvoices({ ...currentFilters, page, limit: pagination.limit });
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    try {
      const result = await bulkUpdateStatus(selectedIds, status);
      if (result.success) {
        alert(`Successfully updated ${result.processed} invoices`);
        setSelectedIds([]);
        setShowBulkActions(false);
      } else {
        alert(`Updated ${result.processed} invoices, ${result.failed} failed`);
      }
    } catch (err) {
      alert('Failed to update invoices');
    }
  };

  const handleRefresh = () => {
    refreshData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Tracker</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all invoices in real-time</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Bulk Actions ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {showBulkActions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {selectedIds.length} invoice(s) selected. Choose an action:
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('submitted')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Submit for Approval
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('approved')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('rejected')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedIds([]);
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {pipelineStats && (
          <InvoicePipeline stats={pipelineStats} onStageClick={handleStageClick} />
        )}

        {agingReport && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Aging Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 font-medium mb-1">Current (0-30 days)</div>
                <div className="text-2xl font-bold text-green-800">{agingReport.current}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-700 font-medium mb-1">31-60 days</div>
                <div className="text-2xl font-bold text-yellow-800">{agingReport.days31to60}</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-sm text-orange-700 font-medium mb-1">61-90 days</div>
                <div className="text-2xl font-bold text-orange-800">{agingReport.days61to90}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700 font-medium mb-1">Over 90 days</div>
                <div className="text-2xl font-bold text-red-800">{agingReport.over90}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-700 font-medium mb-1">Total Amount</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatCurrency(agingReport.totalAmount)}
                </div>
                <div className="text-xs text-gray-600 mt-1">{agingReport.totalCount} invoices</div>
              </div>
            </div>
          </div>
        )}

        <InvoiceFilters onFilterChange={handleFilterChange} initialFilters={currentFilters} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading invoices...</div>
          </div>
        )}

        {!loading && (
          <>
            <InvoiceTable
              invoices={invoices}
              onInvoiceClick={handleInvoiceClick}
              onSelectInvoices={setSelectedIds}
              selectable={true}
            />

            {pagination.total > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} invoices
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded ${
                                page === pagination.page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {selectedInvoice && (
          <InvoiceDetailModal invoice={selectedInvoice} onClose={clearSelectedInvoice} />
        )}
      </div>
    </div>
  );
};
