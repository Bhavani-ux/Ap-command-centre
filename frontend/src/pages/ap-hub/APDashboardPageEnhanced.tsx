import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.client';

interface DashboardData {
  kpis: {
    totalInvoices: {
      count: number;
      nonPO: number;
      po: number;
      period: string;
    };
    totalSpend: {
      amount: number;
      formatted: string;
      categories: number;
      branches: number;
    };
    openInFlight: {
      count: number;
      liability: number;
      formatted: string;
    };
    posted: {
      count: number;
      straightThroughPercent: number;
    };
  };
  pipeline: {
    received: number;
    completenessCheck: number;
    validation: number;
    pendingApproval: number;
    approved: number;
    posted: number;
    exception: number;
    rejected: number;
  };
  insights: Array<{
    id: string;
    icon: string;
    severity: string;
    title: string;
    description: string;
    count?: number;
    amount?: number;
    percentage?: number;
    vendors?: string;
    actionable: boolean;
  }>;
  spendByCategory: Array<{
    category: string;
    amount: number;
  }>;
  generatedAt: string;
  recordCount: number;
}

export const APDashboardPageEnhanced: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      console.log('Dashboard response:', response.data);
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-500/20 border-red-500/30 text-red-100',
      MED: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100',
      INFO: 'bg-green-500/20 border-green-500/30 text-green-100',
    };
    return colors[severity] || 'bg-blue-500/20 border-blue-500/30 text-blue-100';
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-600 text-white',
      MED: 'bg-yellow-600 text-white',
      INFO: 'bg-green-600 text-white',
    };
    return colors[severity] || 'bg-blue-600 text-white';
  };

  const getIconEmoji = (icon: string) => {
    const icons: Record<string, string> = {
      warning: '⚠️',
      rupee: '₹',
      document: '📄',
      users: '👥',
      bank: '🏦',
    };
    return icons[icon] || '📊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data || !data.kpis) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-bold mb-2">Failed to load dashboard data</p>
          <p className="text-sm">Data structure: {JSON.stringify(data, null, 2)}</p>
        </div>
      </div>
    );
  }

  const maxCategoryAmount = data.spendByCategory && data.spendByCategory.length > 0
    ? Math.max(...data.spendByCategory.map(c => c.amount))
    : 1;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Executive overview & AI insights</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invoices */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">
                Total Invoices ({data.kpis.totalInvoices.period})
              </p>
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{data.kpis.totalInvoices?.count?.toLocaleString() || 0}</p>
            <p className="text-sm opacity-90">
              {data.kpis.totalInvoices?.nonPO || 0} Non-PO · {data.kpis.totalInvoices?.po || 0} PO
            </p>
          </div>
        </div>

        {/* Total Spend Value */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Total Spend Value</p>
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{data.kpis.totalSpend?.formatted || '₹0.00 Cr'}</p>
            <p className="text-sm opacity-90">
              Across {data.kpis.totalSpend?.categories || 0} categories · {data.kpis.totalSpend?.branches || 0} branches
            </p>
          </div>
        </div>

        {/* Open / In-Flight */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Open / In-Flight</p>
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{data.kpis.openInFlight?.count || 0}</p>
            <p className="text-sm opacity-90">{data.kpis.openInFlight?.formatted || '₹0.00 Cr'} pipeline liability</p>
          </div>
        </div>

        {/* Posted to ERP */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Posted to ERP</p>
              <div className="bg-white/20 rounded-lg p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{data.kpis.posted?.count || 0}</p>
            <p className="text-sm opacity-90">{data.kpis.posted?.straightThroughPercent || 0}% straight-through</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights - Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">✨</span>
                AI Insights
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">LIVE</span>
              </h2>
            </div>
            <p className="text-sm text-purple-200 mb-6">
              Generated from {data.recordCount.toLocaleString()} tracker records · GST, DOA & cash signals · refreshed on load
            </p>

            <div className="space-y-4">
              {data.insights && data.insights.length > 0 ? data.insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`${getSeverityColor(insight.severity)} border rounded-lg p-4 backdrop-blur-sm`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">{getIconEmoji(insight.icon)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white">{insight.title}</h3>
                        <span className={`${getSeverityBadge(insight.severity)} px-2 py-1 text-xs font-bold rounded flex-shrink-0`}>
                          {insight.severity}
                        </span>
                      </div>
                      <p className="text-sm opacity-90 text-white">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-purple-200 text-sm">No insights available</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Status Pipeline & Spend by Category */}
        <div className="space-y-6">
          {/* Status Pipeline */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Status Pipeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Received</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-gray-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.received || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Completeness Check</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-cyan-500 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.completenessCheck || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Validation</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-purple-500 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.validation || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Pending Approval</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-orange-500 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.pendingApproval || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Approved</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.approved || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Posted</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.posted || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Exception</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-red-500 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.exception || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Rejected</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-red-700 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.pipeline?.rejected || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spend by Category */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📈</span>
              Spend by Category
            </h2>
            <div className="space-y-4">
              {data.spendByCategory && data.spendByCategory.length > 0 ? (
                data.spendByCategory.slice(0, 5).map((cat) => {
                  const widthPercent = (cat.amount / maxCategoryAmount) * 100;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No category data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
