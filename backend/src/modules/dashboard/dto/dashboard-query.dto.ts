export interface DashboardQueryDto {
  startDate?: Date;
  endDate?: Date;
  departmentId?: string;
}

export interface DashboardMetricsDto {
  totalInvoices: number;
  pendingApprovals: number;
  overdueInvoices: number;
  totalAmount: number;
  approvedThisMonth: number;
  paidThisMonth: number;
  averageApprovalTime: number; // in hours
  comparisonWithLastMonth: {
    invoices: number; // percentage change
    amount: number; // percentage change
  };
}

export interface InvoiceTrendDto {
  month: string;
  count: number;
  amount: number;
}

export interface VendorSpendDto {
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface ApprovalMetricsDto {
  level: number;
  pending: number;
  approved: number;
  rejected: number;
  averageTime: number; // in hours
}

export interface RecentActivityDto {
  id: string;
  type: 'invoice_created' | 'invoice_approved' | 'invoice_rejected' | 'payment_processed';
  description: string;
  user: string;
  timestamp: Date;
  metadata?: any;
}

export interface PendingApprovalDto {
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface UpcomingPaymentDto {
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
}

export interface DashboardDataDto {
  metrics: DashboardMetricsDto;
  invoiceTrend: InvoiceTrendDto[];
  topVendors: VendorSpendDto[];
  approvalMetrics: ApprovalMetricsDto[];
  recentActivity: RecentActivityDto[];
  pendingApprovals: PendingApprovalDto[];
  upcomingPayments: UpcomingPaymentDto[];
}
