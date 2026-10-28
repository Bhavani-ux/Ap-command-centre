export interface InvoiceTrackerQueryDto {
  status?: string[];
  approvalStatus?: string[];
  paymentStatus?: string[];
  vendorId?: string;
  departmentId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'invoiceDate' | 'dueDate' | 'totalAmount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface InvoiceTrackerItemDto {
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
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  approvalStatus: string;
  paymentStatus: string;
  daysUntilDue: number;
  isOverdue: boolean;
  currentApprovalLevel?: number;
  assignedApprover?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTimelineEventDto {
  id: string;
  type: 'created' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'status_changed' | 'comment_added';
  description: string;
  user?: {
    id: string;
    name: string;
  };
  timestamp: Date;
  metadata?: any;
}

export interface InvoiceDetailDto {
  invoice: InvoiceTrackerItemDto;
  lineItems: Array<{
    id: string;
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    glAccount?: {
      id: string;
      accountNumber: string;
      accountName: string;
    };
  }>;
  approvalChain: Array<{
    level: number;
    status: string;
    approver: {
      id: string;
      name: string;
      email: string;
    };
    approvedAt?: Date;
    comments?: string;
  }>;
  timeline: InvoiceTimelineEventDto[];
  attachments: Array<{
    id: string;
    filename: string;
    fileSize: number;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
    };
    createdAt: Date;
  }>;
}

export interface InvoicePipelineStatsDto {
  draft: number;
  pendingApproval: number;
  approved: number;
  paid: number;
  rejected: number;
  overdue: number;
}

export interface InvoiceAgingBucketDto {
  current: number; // 0-30 days
  days31to60: number;
  days61to90: number;
  over90: number;
  totalCount: number;
  totalAmount: number;
}

export interface BulkActionResultDto {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

export interface InvoiceExportDto {
  format: 'csv' | 'excel' | 'pdf';
  filters: InvoiceTrackerQueryDto;
}
