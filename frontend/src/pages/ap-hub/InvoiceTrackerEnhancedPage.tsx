import React, { useEffect, useState } from 'react';
import { invoicesAPI, apiClient, approvalsAPI } from '../../services/api.client';

interface Invoice {
  id: string;
  referenceNumber: string;
  invoiceNumber: string;
  vendor: { name: string; code?: string };
  category: string | null;
  invoiceDate: string;
  totalAmount: number;
  status: string;
  approvalStatus: string;
  doaLevel: number | null;
  ageInDays: number | null;
  poNumber?: string;
}

export const InvoiceTrackerEnhancedPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [myApprovals, setMyApprovals] = useState<Array<{ invoiceId: string; id: string; level: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchVendors();
    fetchMyApprovals();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter, categoryFilter, typeFilter, vendorFilter, dateFrom, dateTo, page]);

  const fetchVendors = async () => {
    try {
      const response = await apiClient.get('/vendors');
      setVendors(response.data.data?.vendors || response.data.vendors || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchMyApprovals = async () => {
    try {
      const response = await approvalsAPI.getPending();
      const approvalsData = response.data.data || response.data.approvals || [];
      setMyApprovals(approvalsData.map((a: any) => ({
        invoiceId: a.invoice.id,
        id: a.id,
        level: a.level,
      })));
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (typeFilter) params.type = typeFilter;
      if (vendorFilter) params.vendorId = vendorFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await invoicesAPI.getAll(params);
      console.log('Invoice API response:', response.data);
      const data = response.data.data || response.data;
      setInvoices(data.invoices || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const crores = amount / 10000000;
    const lakhs = amount / 100000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    } else if (lakhs >= 1) {
      return `₹${lakhs.toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_approval: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      exception: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getDoaLevelColor = (level: number | null) => {
    if (!level) return 'text-gray-500';
    const colors: Record<number, string> = {
      1: 'text-green-600',
      2: 'text-blue-600',
      3: 'text-purple-600',
      4: 'text-orange-600',
      5: 'text-red-600',
    };
    return colors[level] || 'text-gray-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Tracker</h1>
        <p className="text-gray-600 mt-1">{totalRecords.toLocaleString()} records · central tracker</p>
      </div>

      {/* Filters Row 1 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ref, vendor, invoice no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="received">Received</option>
            <option value="completeness_check">Completeness Check</option>
            <option value="validation">Validation</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="posted">Posted</option>
            <option value="exception">Exception</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="Commissions">Commissions</option>
            <option value="Content">Content</option>
            <option value="Network Materials">Network Materials</option>
            <option value="Pole/Utilities">Pole/Utilities</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="IT Services">IT Services</option>
            <option value="Logistics">Logistics</option>
            <option value="Marketing">Marketing</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">PO + Non-PO</option>
            <option value="po">PO</option>
            <option value="non-po">Non-PO</option>
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Row 2 - Date Range & View Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">PERIOD</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCategoryFilter('');
              setTypeFilter('');
              setVendorFilter('');
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded ${viewMode === 'table' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded ${viewMode === 'cards' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>2,000 records · page {page} of {totalPages} · 10/page</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded ${page === p ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Data Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendor / Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DOA</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => setSelectedInvoice(invoice)}
                    className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{invoice.referenceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{invoice.vendor.name}</div>
                      <div className="text-xs text-gray-500">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {invoice.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${invoice.poNumber ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {invoice.poNumber ? 'PO' : 'Non-PO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(Number(invoice.totalAmount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getDoaLevelColor(invoice.doaLevel)}`}>
                        {invoice.doaLevel ? `L${invoice.doaLevel}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.ageInDays || 0}d
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusBadge(invoice.status)}`}></div>
                        <span className="text-sm text-gray-900 capitalize">
                          {invoice.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              onClick={() => setSelectedInvoice(invoice)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-blue-600 mb-1">{invoice.referenceNumber}</h3>
                  <p className="text-base font-semibold text-gray-900">{invoice.vendor.name}</p>
                  <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${invoice.poNumber ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {invoice.poNumber ? 'PO' : 'Non-PO'}
                  </span>
                  <span className={`text-sm font-bold ${getDoaLevelColor(invoice.doaLevel)}`}>
                    {invoice.doaLevel ? `L${invoice.doaLevel}` : '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(invoice.totalAmount))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {invoice.category || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Date</span>
                  <span className="text-xs text-gray-700">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Age</span>
                  <span className="text-xs text-gray-700">{invoice.ageInDays || 0} days</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <div className={`w-2 h-2 rounded-full ${getStatusBadge(invoice.status)}`}></div>
                <span className="text-sm text-gray-900 capitalize">
                  {invoice.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedInvoice.referenceNumber}</h2>
                  <p className="text-sm text-gray-600">{selectedInvoice.vendor.name} · {selectedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                  • Completeness Check
                </span>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="p-8 border-b bg-gray-50">
              {(() => {
                const steps = ['Received', 'Completeness Check', 'Validation', 'Pending Approval', 'Approved', 'Posted'];
                const statusMap: Record<string, number> = {
                  'draft': 0,
                  'received': 1,
                  'completeness_check': 2,
                  'validation': 3,
                  'pending_approval': 4,
                  'approved': 5,
                  'posted': 6,
                };
                const currentStep = statusMap[selectedInvoice.status] || 1;
                const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

                return (
                  <div className="relative">
                    {/* Progress Line Background */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300" style={{ left: '20px', right: '20px' }}></div>
                    {/* Progress Line Active */}
                    <div
                      className="absolute top-5 left-0 h-1 bg-blue-500 transition-all duration-500"
                      style={{ left: '20px', width: `calc(${progressPercent}% - 40px)` }}
                    ></div>

                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {steps.map((step, idx) => {
                        const stepNumber = idx + 1;
                        const isCompleted = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;
                        const isPending = stepNumber > currentStep;

                        return (
                          <div key={step} className="flex flex-col items-center" style={{ minWidth: '100px' }}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-md ${
                              isCompleted ? 'bg-green-500 text-white' :
                              isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {isCompleted ? '✓' : stepNumber}
                            </div>
                            <span className={`text-xs mt-2 text-center font-medium ${
                              isCurrent ? 'text-blue-600 font-bold' :
                              isCompleted ? 'text-gray-700' :
                              'text-gray-400'
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Invoice Details Grid */}
            <div className="p-6 grid grid-cols-3 gap-6">
              {/* Amount */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(Number(selectedInvoice.totalAmount))}</div>
              </div>

              {/* Category */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</div>
                <div className="text-base font-semibold text-gray-900">{selectedInvoice.category || 'N/A'}</div>
              </div>

              {/* Branch / Cost Center */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Branch / Cost Center</div>
                <div className="text-base font-semibold text-gray-900">Kochi</div>
              </div>

              {/* Invoice Date */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Invoice Date</div>
                <div className="text-base text-gray-900">{formatDate(selectedInvoice.invoiceDate)}</div>
              </div>

              {/* Type */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Type</div>
                <div className="text-base font-semibold text-gray-900">{selectedInvoice.poNumber ? 'PO' : 'Non-PO'} · Opex</div>
              </div>

              {/* GL Code */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">GL Code</div>
                <div className="text-base text-gray-900">458004</div>
              </div>

              {/* DOA Tier Required */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">DOA Tier Required</div>
                <div className={`text-base font-bold ${getDoaLevelColor(selectedInvoice.doaLevel)}`}>
                  L{selectedInvoice.doaLevel} — Finance Controller
                </div>
              </div>

              {/* Approval Chain */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Approval Chain</div>
                <div className="text-sm text-gray-900">Functional Head → Finance Controller</div>
              </div>

              {/* Days in Process */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Days in Process</div>
                <div className="text-base text-gray-900">{selectedInvoice.ageInDays || 0} days</div>
              </div>
            </div>

            {/* Compliance Checks */}
            <div className="px-6 pb-6">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">IN Compliance Checks</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ IRN / e-Invoice verified</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ GSTIN & GSTR-2B match</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">TDS: 194H</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Non-PO — DOA routing</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t flex justify-between items-center bg-gray-50">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Close
              </button>
              {(() => {
                const approval = myApprovals.find(a => a.invoiceId === selectedInvoice.id);
                if (approval) {
                  return (
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to reject this invoice?')) {
                            setApproving(true);
                            try {
                              const comments = prompt('Rejection reason (optional):');
                              await approvalsAPI.reject(approval.id, comments || 'Rejected');
                              alert('Invoice rejected successfully');
                              setSelectedInvoice(null);
                              fetchInvoices();
                              fetchMyApprovals();
                            } catch (error) {
                              alert('Failed to reject invoice');
                            } finally {
                              setApproving(false);
                            }
                          }
                        }}
                        disabled={approving}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                      <button
                        onClick={async () => {
                          setApproving(true);
                          try {
                            await approvalsAPI.approve(approval.id);
                            alert('Invoice approved successfully');
                            setSelectedInvoice(null);
                            fetchInvoices();
                            fetchMyApprovals();
                          } catch (error) {
                            alert('Failed to approve invoice');
                          } finally {
                            setApproving(false);
                          }
                        }}
                        disabled={approving}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
                      >
                        ✓ Approve (L{approval.level})
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
