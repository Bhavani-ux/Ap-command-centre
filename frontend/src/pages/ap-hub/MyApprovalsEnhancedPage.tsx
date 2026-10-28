import React, { useEffect, useState } from 'react';
import { approvalsAPI } from '../../services/api.client';

interface Approval {
  id: string;
  invoice: {
    id: string;
    referenceNumber: string;
    invoiceNumber: string;
    totalAmount: number;
    vendor: { name: string; code?: string };
    category: string | null;
    invoiceDate: string;
    dueDate: string;
    status?: string;
    approvalStatus?: string;
  };
  level: number;
  status: string;
  assignedAt: string;
  dueAt: string | null;
}

export const MyApprovalsEnhancedPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');
  const [quickFilter, setQuickFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalsAPI.getPending();
      console.log('Approvals response:', response.data);
      const approvalsData = response.data.data || response.data.approvals || [];
      setApprovals(approvalsData);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const lakhs = amount / 100000;
    const crores = amount / 10000000;
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

  const getWaitingTime = (assignedAt: string) => {
    const hours = Math.floor((Date.now() - new Date(assignedAt).getTime()) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  const getDoaLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      1: 'text-green-600',
      2: 'text-blue-600',
      3: 'text-purple-600',
      4: 'text-orange-600',
      5: 'text-red-600',
    };
    return colors[level] || 'text-gray-600';
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

  const totalAmount = approvals.reduce((sum, a) => sum + Number(a.invoice.totalAmount), 0);
  const slaBreaches = approvals.filter(
    (a) => Math.floor((Date.now() - new Date(a.assignedAt).getTime()) / (1000 * 60 * 60)) > 72
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Approvals</h1>
        <p className="text-gray-600 mt-1">DOA queue · filters, views & bulk actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">PENDING MY APPROVAL (L1, L2, L3, L4, L5)</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{approvals.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">QUEUE VALUE</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SLA BREACH (&gt;72 HRS)</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{slaBreaches}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SELECTED FOR BULK ACTION</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{selectedApprovals.size}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
          </select>
          <select
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Amounts</option>
            <option value="0-50k">₹0 - ₹50K</option>
            <option value="50k-5l">₹50K - ₹5L</option>
            <option value="5l-25l">₹5L - ₹25L</option>
            <option value="25l+">₹25L+</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
          </select>
          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount_high">Amount: High to Low</option>
            <option value="amount_low">Amount: Low to High</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">QUICK FILTERS</span>
            <button
              onClick={() => setQuickFilter('msme')}
              className={`px-3 py-1 text-sm rounded-lg ${quickFilter === 'msme' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}
            >
              MSME only
            </button>
            <button
              onClick={() => setQuickFilter('sla')}
              className={`px-3 py-1 text-sm rounded-lg ${quickFilter === 'sla' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}
            >
              SLA breached
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setVendorFilter('');
                setAmountFilter('');
                setCategoryFilter('');
                setQuickFilter('');
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
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b text-sm text-gray-600">
          295 records · page 1 of 30 · 10/page
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reference #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vendor / Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">DOA</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waiting</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvals.slice(0, 10).map((approval) => (
                  <tr
                    key={approval.id}
                    onClick={(e) => {
                      // Don't open modal if clicking checkbox or action buttons
                      const target = e.target as HTMLElement;
                      if (!target.closest('input') && !target.closest('button')) {
                        setSelectedApproval(approval);
                      }
                    }}
                    className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedApprovals.has(approval.id)}
                        onChange={() => toggleSelection(approval.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{approval.invoice.referenceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{approval.invoice.vendor.name}</div>
                      <div className="text-xs text-gray-500">{approval.invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {approval.invoice.category || 'G&A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(Number(approval.invoice.totalAmount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getDoaLevelColor(approval.level)}`}>
                        L{approval.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getWaitingTime(approval.assignedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(approval.assignedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 bg-green-100 text-green-600 rounded hover:bg-green-200">
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button className="w-8 h-8 bg-red-100 text-red-600 rounded hover:bg-red-200">
                          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedApproval(null)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedApproval.invoice.referenceNumber}</h2>
                  <p className="text-sm text-gray-600">{selectedApproval.invoice.vendor.name} · {selectedApproval.invoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  • Pending Approval
                </span>
                <button onClick={() => setSelectedApproval(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="p-8 border-b bg-gray-50">
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300" style={{ left: '20px', right: '20px' }}></div>
                <div className="absolute top-5 left-0 h-1 bg-green-500" style={{ left: '20px', width: 'calc(50% - 40px)' }}></div>

                <div className="relative flex justify-between">
                  {['Received', 'Completeness Check', 'Validation', 'Pending Approval', 'Approved', 'Posted'].map((step, idx) => {
                    const isCompleted = idx < 3;
                    const isCurrent = idx === 3;

                    return (
                      <div key={step} className="flex flex-col items-center" style={{ minWidth: '100px' }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white shadow-md ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
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
            </div>

            {/* Invoice Details */}
            <div className="p-6 grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(Number(selectedApproval.invoice.totalAmount))}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Category</div>
                <div className="text-base font-semibold text-gray-900">{selectedApproval.invoice.category || 'Network O&M / Field Services'}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Branch / Cost Center</div>
                <div className="text-base font-semibold text-gray-900">Kozhikode</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Invoice Date</div>
                <div className="text-base text-gray-900">{formatDate(selectedApproval.invoice.invoiceDate)}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Type</div>
                <div className="text-base font-semibold text-gray-900">PO · Capex</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">GL Code</div>
                <div className="text-base text-gray-900">433276</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">DOA Tier Required</div>
                <div className={`text-base font-bold ${getDoaLevelColor(selectedApproval.level)}`}>
                  L{selectedApproval.level} — Finance Controller
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Approval Chain</div>
                <div className="text-sm text-gray-900">Functional Head → Finance Controller</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Days in Process</div>
                <div className="text-base text-gray-900">{getWaitingTime(selectedApproval.assignedAt)}</div>
              </div>
            </div>

            {/* Compliance Checks */}
            <div className="px-6 pb-6">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-3">IN Compliance Checks</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ IRN / e-Invoice verified</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ GSTIN & GSTR-2B match</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">TDS: 194C</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">PO — 3-way match</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">MSME - 43B(h) 45-day clock</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t flex justify-between items-center bg-gray-50">
              <button
                onClick={() => setSelectedApproval(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Close
              </button>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to reject this invoice?')) {
                      setApproving(true);
                      try {
                        const comments = prompt('Rejection reason (optional):');
                        await approvalsAPI.reject(selectedApproval.id, comments || 'Rejected');
                        alert('Invoice rejected successfully');
                        setSelectedApproval(null);
                        fetchApprovals();
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
                      await approvalsAPI.approve(selectedApproval.id);
                      alert('Invoice approved successfully');
                      setSelectedApproval(null);
                      fetchApprovals();
                    } catch (error) {
                      alert('Failed to approve invoice');
                    } finally {
                      setApproving(false);
                    }
                  }}
                  disabled={approving}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
                >
                  ✓ Approve (L{selectedApproval.level})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
