import React, { useState } from 'react';
import { ApprovalFilters as FiltersType } from '../../../types/approval.types';

interface ApprovalFiltersProps {
  onFilterChange: (filters: FiltersType) => void;
}

export const ApprovalFilters: React.FC<ApprovalFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<FiltersType>({});

  const handlePriorityChange = (priority: string) => {
    const newFilters = { ...filters, priority: priority === filters.priority ? undefined : priority };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAmountRangeChange = (minAmount?: number, maxAmount?: number) => {
    const newFilters = { ...filters, minAmount, maxAmount };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).some((key) => filters[key as keyof FiltersType] !== undefined);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filter Approvals</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800">
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {['urgent', 'high', 'normal', 'low'].map((priority) => {
              const isSelected = filters.priority === priority;
              const colors: Record<string, string> = {
                urgent: isSelected ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
                high: isSelected ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
                normal: isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                low: isSelected ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              };

              return (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colors[priority]}`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  handleAmountRangeChange(
                    e.target.value ? Number(e.target.value) : undefined,
                    filters.maxAmount
                  )
                }
                placeholder="Min amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  handleAmountRangeChange(
                    filters.minAmount,
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Max amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleAmountRangeChange(undefined, 5000)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            &lt; $5,000
          </button>
          <button
            onClick={() => handleAmountRangeChange(5000, 50000)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            $5K - $50K
          </button>
          <button
            onClick={() => handleAmountRangeChange(50000, undefined)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            &gt; $50,000
          </button>
        </div>
      </div>
    </div>
  );
};
