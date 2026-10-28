import { useState, useEffect } from 'react';
import { useEmailIntake } from '../../hooks/email-intake/useEmailIntake';
import {
  EmailIntakeStats,
  EmailIntakeHistory,
  PendingReviewItem,
} from '../../types/email-intake.types';
import { formatDistanceToNow } from 'date-fns';

export const EmailIntakePage = () => {
  const { isProcessing, error, processEmails, getStats, getHistory, getPendingReview } =
    useEmailIntake();

  const [stats, setStats] = useState<EmailIntakeStats | null>(null);
  const [history, setHistory] = useState<EmailIntakeHistory[]>([]);
  const [pendingReview, setPendingReview] = useState<PendingReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'review'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [statsData, historyData, pendingData] = await Promise.all([
      getStats(),
      getHistory(50),
      getPendingReview(),
    ]);

    if (statsData) setStats(statsData);
    setHistory(historyData);
    setPendingReview(pendingData);
    setIsLoading(false);
  };

  const handleProcessEmails = async () => {
    setSuccessMessage(null);

    try {
      const results = await processEmails();
      const successCount = results.filter((r) => r.status === 'success').length;
      const invoicesCreated = results.reduce((sum, r) => sum + r.invoicesCreated, 0);

      setSuccessMessage(
        `Processed ${results.length} emails. ${successCount} successful. ${invoicesCreated} invoices created.`
      );

      // Reload data
      await loadData();
    } catch (err) {
      // Error is already set by the hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700';
      case 'failed':
        return 'bg-red-50 text-red-700';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Intake</h1>
          <p className="mt-1 text-sm text-gray-500">
            Automatically process invoice emails and create draft invoices
          </p>
        </div>
        <button
          onClick={handleProcessEmails}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isProcessing ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>📧</span>
              <span>Process Emails</span>
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Processed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProcessed}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <span className="text-2xl">📧</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalProcessed > 0
                    ? Math.round((stats.successCount / stats.totalProcessed) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50 text-green-600">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Invoices Created</p>
                <p className="text-3xl font-bold text-purple-600">{stats.invoicesCreated}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Processing</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.averageProcessingTime.toFixed(1)}s
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Processing History ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'review'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Review ({pendingReview.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-3xl mb-2">📧</span>
                    <h4 className="font-medium text-gray-900 mb-1">1. Receive Email</h4>
                    <p className="text-sm text-gray-600">
                      Vendors send invoices to your dedicated email
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-3xl mb-2">🔍</span>
                    <h4 className="font-medium text-gray-900 mb-1">2. Extract Data</h4>
                    <p className="text-sm text-gray-600">
                      OCR extracts invoice details from attachments
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-3xl mb-2">✨</span>
                    <h4 className="font-medium text-gray-900 mb-1">3. Create Draft</h4>
                    <p className="text-sm text-gray-600">
                      Automatically creates draft invoice in system
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-3xl mb-2">👤</span>
                    <h4 className="font-medium text-gray-900 mb-1">4. Review & Approve</h4>
                    <p className="text-sm text-gray-600">AP team reviews and submits for approval</p>
                  </div>
                </div>
              </div>

              {stats && stats.lastProcessedAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Last processed:</strong>{' '}
                    {formatDistanceToNow(new Date(stats.lastProcessedAt), { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attachments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No processing history yet
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.from}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDistanceToNow(new Date(item.processedAt), { addSuffix: true })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.invoicesCreated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.attachmentCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              {pendingReview.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items pending review
                </div>
              ) : (
                pendingReview.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.attachmentFilename}</h4>
                        <p className="text-sm text-gray-500">
                          From: {item.fromAddress} • Subject: {item.subject}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-medium ${getConfidenceColor(
                            item.confidenceScore
                          )}`}
                        >
                          {Math.round(item.confidenceScore * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-xs text-gray-500">Invoice #</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.extractedData.invoiceNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Vendor</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.extractedData.vendorName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.extractedData.totalAmount
                            ? `$${item.extractedData.totalAmount.toFixed(2)}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.extractedData.invoiceDate || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        Approve & Create Invoice
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Edit & Create
                      </button>
                      <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
