import apiClient from '../api/client';
import {
  InvoiceTrackerQuery,
  InvoiceTrackerItem,
  InvoiceDetail,
  InvoicePipelineStats,
  InvoiceAgingBucket,
  InvoiceListResponse,
  BulkActionResult,
} from '../../types/invoice-tracker.types';

class InvoiceTrackerService {
  private readonly baseUrl = '/invoice-tracker';

  async getInvoices(query: InvoiceTrackerQuery = {}): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();

    if (query.status && query.status.length > 0) {
      params.append('status', query.status.join(','));
    }
    if (query.approvalStatus && query.approvalStatus.length > 0) {
      params.append('approvalStatus', query.approvalStatus.join(','));
    }
    if (query.paymentStatus && query.paymentStatus.length > 0) {
      params.append('paymentStatus', query.paymentStatus.join(','));
    }
    if (query.vendorId) params.append('vendorId', query.vendorId);
    if (query.departmentId) params.append('departmentId', query.departmentId);
    if (query.startDate) params.append('startDate', query.startDate.toISOString());
    if (query.endDate) params.append('endDate', query.endDate.toISOString());
    if (query.minAmount !== undefined) params.append('minAmount', String(query.minAmount));
    if (query.maxAmount !== undefined) params.append('maxAmount', String(query.maxAmount));
    if (query.search) params.append('search', query.search);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);

    return {
      ...response.data.data,
      items: response.data.data.items.map((item: any) => ({
        ...item,
        invoiceDate: new Date(item.invoiceDate),
        dueDate: new Date(item.dueDate),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
    };
  }

  async getInvoiceDetail(invoiceId: string): Promise<InvoiceDetail> {
    const response = await apiClient.get(`${this.baseUrl}/${invoiceId}`);
    const data = response.data.data;

    return {
      invoice: {
        ...data.invoice,
        invoiceDate: new Date(data.invoice.invoiceDate),
        dueDate: new Date(data.invoice.dueDate),
        createdAt: new Date(data.invoice.createdAt),
        updatedAt: new Date(data.invoice.updatedAt),
      },
      lineItems: data.lineItems,
      approvalChain: data.approvalChain.map((item: any) => ({
        ...item,
        approvedAt: item.approvedAt ? new Date(item.approvedAt) : undefined,
      })),
      timeline: data.timeline.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      })),
      attachments: data.attachments.map((att: any) => ({
        ...att,
        uploadedAt: new Date(att.uploadedAt),
      })),
      comments: data.comments.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
      })),
    };
  }

  async getPipelineStats(): Promise<InvoicePipelineStats> {
    const response = await apiClient.get(`${this.baseUrl}/pipeline-stats`);
    return response.data.data;
  }

  async getAgingReport(): Promise<InvoiceAgingBucket> {
    const response = await apiClient.get(`${this.baseUrl}/aging-report`);
    return response.data.data;
  }

  async bulkUpdateStatus(invoiceIds: string[], status: string): Promise<BulkActionResult> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-update`, {
      invoiceIds,
      status,
    });
    return response.data.data;
  }

  async getInvoicesByVendor(vendorId: string, limit: number = 10): Promise<InvoiceTrackerItem[]> {
    const response = await apiClient.get(`${this.baseUrl}/vendor/${vendorId}?limit=${limit}`);
    return response.data.data.map((item: any) => ({
      ...item,
      invoiceDate: new Date(item.invoiceDate),
      dueDate: new Date(item.dueDate),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  }
}

export default new InvoiceTrackerService();
