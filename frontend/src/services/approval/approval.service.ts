import apiClient from '../api/client';
import {
  ApprovalItem,
  ApprovalHistory,
  ApprovalStats,
  ApprovalChain,
  Escalation,
  BulkApprovalResult,
  DOAMatrixRule,
  ApprovalFilters,
} from '../../types/approval.types';

class ApprovalService {
  private readonly baseUrl = '/approval';

  async getPendingApprovals(filters?: ApprovalFilters): Promise<ApprovalItem[]> {
    const params = new URLSearchParams();

    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.minAmount !== undefined) params.append('minAmount', String(filters.minAmount));
    if (filters?.maxAmount !== undefined) params.append('maxAmount', String(filters.maxAmount));

    const response = await apiClient.get(`${this.baseUrl}/pending?${params.toString()}`);

    return response.data.data.map((item: any) => ({
      ...item,
      invoice: {
        ...item.invoice,
        invoiceDate: new Date(item.invoice.invoiceDate),
        dueDate: new Date(item.invoice.dueDate),
      },
      assignedAt: new Date(item.assignedAt),
      dueAt: new Date(item.dueAt),
      previousApprovals: item.previousApprovals.map((prev: any) => ({
        ...prev,
        approvedAt: new Date(prev.approvedAt),
      })),
    }));
  }

  async approveInvoice(approvalId: string, comments?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${approvalId}/approve`, { comments });
  }

  async rejectInvoice(approvalId: string, comments: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${approvalId}/reject`, { comments });
  }

  async requestInfo(approvalId: string, comments: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${approvalId}/request-info`, { comments });
  }

  async getApprovalHistory(limit: number = 50): Promise<ApprovalHistory[]> {
    const response = await apiClient.get(`${this.baseUrl}/history?limit=${limit}`);

    return response.data.data.map((item: any) => ({
      ...item,
      actionDate: new Date(item.actionDate),
    }));
  }

  async getApprovalStats(): Promise<ApprovalStats> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data.data;
  }

  async getApprovalChain(invoiceId: string): Promise<ApprovalChain> {
    const response = await apiClient.get(`${this.baseUrl}/chain/${invoiceId}`);
    return response.data.data;
  }

  async createApprovalChain(invoiceId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/chain/${invoiceId}`);
  }

  async getEscalations(): Promise<Escalation[]> {
    const response = await apiClient.get(`${this.baseUrl}/escalations`);

    return response.data.data.map((item: any) => ({
      ...item,
      assignedAt: new Date(item.assignedAt),
      escalationTime: new Date(item.escalationTime),
    }));
  }

  async escalateApproval(approvalId: string, escalateToUserId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${approvalId}/escalate`, { escalateToUserId });
  }

  async bulkApprove(invoiceIds: string[], comments?: string): Promise<BulkApprovalResult> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-approve`, {
      invoiceIds,
      comments,
    });
    return response.data.data;
  }

  async bulkReject(invoiceIds: string[], comments: string): Promise<BulkApprovalResult> {
    const response = await apiClient.post(`${this.baseUrl}/bulk-reject`, {
      invoiceIds,
      comments,
    });
    return response.data.data;
  }

  async getDOAMatrix(): Promise<DOAMatrixRule[]> {
    const response = await apiClient.get(`${this.baseUrl}/doa-matrix`);
    return response.data.data;
  }

  async createDOARule(rule: Omit<DOAMatrixRule, 'id'>): Promise<DOAMatrixRule> {
    const response = await apiClient.post(`${this.baseUrl}/doa-matrix`, rule);
    return response.data.data;
  }

  async updateDOARule(ruleId: string, updates: Partial<DOAMatrixRule>): Promise<DOAMatrixRule> {
    const response = await apiClient.put(`${this.baseUrl}/doa-matrix/${ruleId}`, updates);
    return response.data.data;
  }

  async deleteDOARule(ruleId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/doa-matrix/${ruleId}`);
  }
}

export default new ApprovalService();
