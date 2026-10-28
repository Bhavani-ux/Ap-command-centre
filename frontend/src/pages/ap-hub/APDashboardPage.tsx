import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.client';

interface DashboardStats {
  kpis: {
    totalInvoices: number;
    totalSpend: number;
    openInFlight: number;
    posted: number;
  };
  insights: {
    slaBreaches: number;
    msmeExposure: number;
    missingIrn: number;
    pendingApprovals: number;
  };
  pipeline: {
    received: number;
    validation: number;
    pendingApproval: number;
    approved: number;
    posted: number;
    exception: number;
    rejected: number;
  };
  spendByCategory: Array<{ category: string; amount: number }>;
}

export const APDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const pipelineStages = [
    { key: 'received', label: 'Received', count: stats.pipeline.received, color: 'bg-gray-500' },
    { key: 'validation', label: 'Validation', count: stats.pipeline.validation, color: 'bg-blue-500' },
    { key: 'pendingApproval', label: 'Pending Approval', count: stats.pipeline.pendingApproval, color: 'bg-yellow-500' },
    { key: 'approved', label: 'Approved', count: stats.pipeline.approved, color: 'bg-green-500' },
    { key: 'posted', label: 'Posted', count: stats.pipeline.posted, color: 'bg-purple-500' },
    { key: 'exception', label: 'Exception', count: stats.pipeline.exception, color: 'bg-orange-500' },
    { key: 'rejected', label: 'Rejected', count: stats.pipeline.rejected, color: 'bg-red-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AP Hub Dashboard</h1>
        <p className="text-gray-600 mt-1">Accounts Payable Command Center</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.kpis.totalInvoices}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spend</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(Number(stats.kpis.totalSpend))}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open/In Flight</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.kpis.openInFlight}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Posted To ERP</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.kpis.posted}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">🤖</span>
          AI Insights & Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90">SLA Breaches</p>
            <p className="text-3xl font-bold mt-2">{stats.insights.slaBreaches}</p>
            <p className="text-xs mt-1 opacity-75">Invoices &gt; 5 days old</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90">MSME Exposure</p>
            <p className="text-2xl font-bold mt-2">{formatCurrency(Number(stats.insights.msmeExposure))}</p>
            <p className="text-xs mt-1 opacity-75">Outstanding amount</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90">Missing IRN</p>
            <p className="text-3xl font-bold mt-2">{stats.insights.missingIrn}</p>
            <p className="text-xs mt-1 opacity-75">High-value invoices</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm opacity-90">Pending Approvals</p>
            <p className="text-3xl font-bold mt-2">{stats.insights.pendingApprovals}</p>
            <p className="text-xs mt-1 opacity-75">Awaiting your action</p>
          </div>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Invoice Processing Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {pipelineStages.map((stage) => (
            <div key={stage.key} className="text-center">
              <div className={`${stage.color} rounded-lg p-6 mb-2`}>
                <p className="text-4xl font-bold text-white">{stage.count}</p>
              </div>
              <p className="text-sm font-medium text-gray-700">{stage.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spend By Category */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Spend By Category</h2>
        <div className="space-y-4">
          {stats.spendByCategory.map((cat) => {
            const percentage = (Number(cat.amount) / Number(stats.kpis.totalSpend)) * 100;
            return (
              <div key={cat.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(cat.amount))}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total spend</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
