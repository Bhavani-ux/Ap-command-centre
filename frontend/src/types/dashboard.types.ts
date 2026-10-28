export interface DashboardMetrics {
  totalInvoices: number;
  pendingApprovals: number;
  overdueInvoices: number;
  totalAmount: number;
  approvedThisMonth: number;
  paidThisMonth: number;
  averageApprovalTime: number;
  comparisonWithLastMonth: {
    invoices: number;
    amount: number;
  };
}

export interface InvoiceTrend {
  month: string;
  count: number;
  amount: number;
}

export interface VendorSpend {
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface ApprovalMetrics {
  level: number;
  pending: number;
  approved: number;
  rejected: number;
  averageTime: number;
}

export interface RecentActivity {
  id: string;
  type: 'invoice_created' | 'invoice_approved' | 'invoice_rejected' | 'payment_processed';
  description: string;
  user: string;
  timestamp: string;
  metadata?: any;
}

export interface PendingApproval {
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface UpcomingPayment {
  invoiceId: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  invoiceTrend: InvoiceTrend[];
  topVendors: VendorSpend[];
  approvalMetrics: ApprovalMetrics[];
  recentActivity: RecentActivity[];
  pendingApprovals: PendingApproval[];
  upcomingPayments: UpcomingPayment[];
}
