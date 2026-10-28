import React from 'react';
import { InvoiceDetail } from '../../../types/invoice-tracker.types';
import { format } from 'date-fns';

interface InvoiceDetailModalProps {
  invoice: InvoiceDetail;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, onClose }) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      paid: 'bg-purple-100 text-purple-700',
      pending: 'bg-yellow-100 text-yellow-700',
      unpaid: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      processing: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getApprovalStatusIcon = (status: string) => {
    if (status === 'approved') return '✓';
    if (status === 'rejected') return '✗';
    if (status === 'pending') return '○';
    return '−';
  };

  const getTimelineIcon = (type: string) => {
    const icons: Record<string, string> = {
      created: '📄',
      submitted: '📤',
      approved: '✅',
      rejected: '❌',
      paid: '💰',
      status_changed: '🔄',
      comment_added: '💬',
    };
    return icons[type] || '•';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Invoice {invoice.invoice.invoiceNumber}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{invoice.invoice.vendor.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Invoice Number</div>
                    <div className="font-medium text-gray-900">{invoice.invoice.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vendor</div>
                    <div className="font-medium text-gray-900">{invoice.invoice.vendor.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Invoice Date</div>
                    <div className="font-medium text-gray-900">
                      {format(new Date(invoice.invoice.invoiceDate), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Due Date</div>
                    <div className={`font-medium ${invoice.invoice.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {format(new Date(invoice.invoice.dueDate), 'MMM dd, yyyy')}
                      {invoice.invoice.isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                    </div>
                  </div>
                  {invoice.invoice.department && (
                    <div>
                      <div className="text-sm text-gray-600">Department</div>
                      <div className="font-medium text-gray-900">{invoice.invoice.department.name}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.invoice.status)}`}>
                        {invoice.invoice.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.invoice.approvalStatus)}`}>
                        {invoice.invoice.approvalStatus}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.invoice.paymentStatus)}`}>
                        {invoice.invoice.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Line Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.lineNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>{item.description}</div>
                            {item.glAccount && (
                              <div className="text-xs text-gray-500 mt-1">
                                GL: {item.glAccount.accountNumber} - {item.glAccount.accountName}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.unitPrice, invoice.invoice.currency)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(item.amount, invoice.invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(invoice.invoice.totalAmount, invoice.invoice.currency)}
                        </td>
                      </tr>
                      {invoice.invoice.amountPaid > 0 && (
                        <>
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-sm text-gray-600 text-right">
                              Amount Paid:
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                              {formatCurrency(invoice.invoice.amountPaid, invoice.invoice.currency)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                              Amount Due:
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                              {formatCurrency(invoice.invoice.amountDue, invoice.invoice.currency)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              {invoice.attachments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {invoice.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📎</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{attachment.filename}</div>
                            <div className="text-xs text-gray-500">
                              {(attachment.fileSize / 1024).toFixed(2)} KB ·
                              {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Chain</h3>
                <div className="space-y-3">
                  {invoice.approvalChain.map((approval) => (
                    <div key={approval.level} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        approval.status === 'approved' ? 'bg-green-500' :
                        approval.status === 'rejected' ? 'bg-red-500' :
                        approval.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}>
                        {getApprovalStatusIcon(approval.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{approval.approver.name}</div>
                          <div className="text-xs text-gray-500">Level {approval.level}</div>
                        </div>
                        <div className="text-sm text-gray-600">{approval.approver.email}</div>
                        {approval.approvedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(approval.approvedAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                        {approval.comments && (
                          <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                            {approval.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {invoice.timeline.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="text-xl">{getTimelineIcon(event.type)}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{event.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {invoice.comments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {invoice.comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm text-gray-900">{comment.user.name}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">{comment.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Edit Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
