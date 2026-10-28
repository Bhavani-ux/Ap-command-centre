import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.client';

interface AnalyticsData {
  committedOutflow: number;
  pipelineLiability: number;
  dpo: number;
  itcAtRisk: number;
  msmeExposure: number;
  capexShare: number;
  top5VendorShare: number;
  exceptionRate: number;
  topVendors: Array<{ name: string; amount: number; percentage: number }>;
  agingBuckets: Array<{ bucket: string; amount: number; percentage: number; color: string }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  totalInvoices: number;
  totalAmount: number;
  avgInvoiceAge: number;
}

export const CFOAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/analytics/cfo-dashboard');
      setAnalytics(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
    if (lakhs >= 1) {
      return `₹${lakhs.toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          No analytics data available
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Committed Outflow',
      value: formatCurrency(analytics.committedOutflow),
      subtitle: 'Next 30 days',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pipeline Liability',
      value: formatCurrency(analytics.pipelineLiability),
      subtitle: 'Total unbilled + open',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Est. DPO',
      value: `${analytics.dpo} days`,
      subtitle: 'Days payable outstanding',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'ITC At Risk',
      value: formatCurrency(analytics.itcAtRisk),
      subtitle: 'Missing IRN / non-compliant',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    },
    {
      title: 'MSME Exposure',
      value: formatCurrency(analytics.msmeExposure),
      subtitle: 'Outstanding > 45 days',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Capex Share',
      value: `${analytics.capexShare}%`,
      subtitle: 'Of total AP value',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Top-5 Vendor Share',
      value: `${analytics.top5VendorShare}%`,
      subtitle: 'Concentration risk',
      color: 'text-teal-700',
      bgColor: 'bg-teal-100',
    },
    {
      title: 'Exception Rate',
      value: `${analytics.exceptionRate}%`,
      subtitle: 'Missing docs or mismatches',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    },
  ];

  const maxVendorAmount = analytics.topVendors.length > 0
    ? Math.max(...analytics.topVendors.map(v => v.amount))
    : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CFO Analytics</h1>
        <p className="text-gray-600 mt-1">Cash, risk & spend cockpit</p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              CFO Cockpit
            </h2>
            <p className="text-sm opacity-90 mb-4">
              Real-time view of AP obligations, vendor concentration, compliance risk, and MSME payment discipline.
              {analytics.totalInvoices} invoices totaling {formatCurrency(analytics.totalAmount)}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live data</span>
              </div>
              <span className="opacity-75">Updated: Just now</span>
              <span className="opacity-75">Avg Age: {analytics.avgInvoiceAge} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className={`${kpi.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <svg className={`w-6 h-6 ${kpi.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
            <p className={`text-2xl font-bold ${kpi.color} mb-1`}>{kpi.value}</p>
            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Concentration */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Top Vendors
          </h2>
          <p className="text-sm text-gray-600 mb-4">By outstanding liability</p>
          {analytics.topVendors.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No vendor data available</p>
          ) : (
            <div className="space-y-4">
              {analytics.topVendors.map((vendor, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{vendor.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(vendor.amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({vendor.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(vendor.amount / maxVendorAmount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aging Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Aging Analysis
          </h2>
          <p className="text-sm text-gray-600 mb-4">Outstanding by age bucket</p>
          {analytics.agingBuckets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No aging data available</p>
          ) : (
            <div className="space-y-4">
              {analytics.agingBuckets.map((bucket, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{bucket.bucket}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(bucket.amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({bucket.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${bucket.color} h-2 rounded-full transition-all`}
                      style={{ width: `${bucket.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Category Breakdown
          </h2>
          <p className="text-sm text-gray-600 mb-4">Spend by invoice category</p>
          {analytics.categoryBreakdown.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No category data available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                    <span className="text-xs text-gray-500">{cat.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(cat.amount)}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className="bg-green-600 h-1 rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchAnalytics}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};
