import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Invoices</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">1</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">0</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Amount</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">$1,080</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-3xl font-bold text-red-600 mt-2">0</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl">📄</div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Invoice INV-001 created</div>
              <div className="text-sm text-gray-600">Office Supplies Inc - $1,080.00</div>
            </div>
            <div className="text-sm text-gray-500">Today</div>
          </div>
        </div>
      </div>
    </div>
  );
};
