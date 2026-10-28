export interface ApprovalItem {
  id: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    vendor: {
      id: string;
      name: string;
    };
    department?: {
      id: string;
      name: string;
    };
    totalAmount: number;
    currency: string;
    invoiceDate: Date;
    dueDate: Date;
    description?: string;
  };
  level: number;
  approver: {
    id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assignedAt: Date;
  dueAt: Date;
  isOverdue: boolean;
  daysRemaining: number;
  previousApprovals: Array<{
    level: number;
    approver: string;
    status: string;
    approvedAt: Date;
  }>;
}

export interface ApprovalAction {
  approvalId: string;
  action: 'approve' | 'reject' | 'request_info';
  comments?: string;
}

export interface ApprovalHistory {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  level: number;
  action: string;
  approver: string;
  comments?: string;
  actionDate: Date;
}

export interface ApprovalStats {
  pending: number;
  urgent: number;
  overdue: number;
  approvedToday: number;
  rejectedToday: number;
  averageTimeToApprove: number;
  totalProcessed: number;
}

export interface DOAMatrixRule {
  id: string;
  role: string;
  departmentId?: string;
  minAmount: number;
  maxAmount: number;
  requiresApproval: boolean;
  approvalLevel: number;
  autoApprove: boolean;
}

export interface ApprovalChain {
  invoiceId: string;
  totalAmount: number;
  departmentId?: string;
  levels: Array<{
    level: number;
    approvers: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    minApprovals: number;
    doaRule: string;
  }>;
}

export interface Escalation {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currentApprover: string;
  assignedAt: Date;
  escalationTime: Date;
  escalationReason: string;
  escalatedTo?: string;
}

export interface BulkApprovalResult {
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    invoiceId: string;
    status: 'success' | 'failed';
    message: string;
  }>;
}

export interface ApprovalFilters {
  priority?: string;
  departmentId?: string;
  minAmount?: number;
  maxAmount?: number;
}
