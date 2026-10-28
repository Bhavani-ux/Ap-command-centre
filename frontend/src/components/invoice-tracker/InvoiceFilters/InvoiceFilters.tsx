import React, { useState } from 'react';
import { InvoiceTrackerQuery } from '../../../types/invoice-tracker.types';

interface InvoiceFiltersProps {
  onFilterChange: (filters: InvoiceTrackerQuery) => void;
  initialFilters?: InvoiceTrackerQuery;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  onFilterChange,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<InvoiceTrackerQuery>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof InvoiceTrackerQuery, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleMultiSelect = (key: keyof InvoiceTrackerQuery, value: string) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    handleFilterChange(key, newValues.length > 0 ? newValues : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            placeholder="Invoice #, PO #, Vendor..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {['draft', 'submitted', 'approved', 'rejected'].map((status) => {
              const isSelected = filters.status?.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => handleMultiSelect('status', status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
          <div className="flex flex-wrap gap-2">
            {['pending', 'approved', 'rejected'].map((status) => {
              const isSelected = filters.approvalStatus?.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => handleMultiSelect('approvalStatus', status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showAdvanced ? '− Hide Advanced Filters' : '+ Show Advanced Filters'}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <div className="flex flex-wrap gap-2">
              {['unpaid', 'scheduled', 'processing', 'paid', 'failed'].map((status) => {
                const isSelected = filters.paymentStatus?.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => handleMultiSelect('paymentStatus', status)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) =>
                  handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Min"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Max"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="invoiceDate">Invoice Date</option>
                <option value="dueDate">Due Date</option>
                <option value="totalAmount">Amount</option>
              </select>
              <select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
