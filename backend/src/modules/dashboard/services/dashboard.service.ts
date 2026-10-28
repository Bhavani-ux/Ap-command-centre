import { PrismaClient } from '@prisma/client';
import {
  DashboardQueryDto,
  DashboardDataDto,
  DashboardMetricsDto,
  InvoiceTrendDto,
  VendorSpendDto,
  ApprovalMetricsDto,
  RecentActivityDto,
  PendingApprovalDto,
  UpcomingPaymentDto,
} from '../dto/dashboard-query.dto';

const prisma = new PrismaClient();

export class DashboardService {
  async getDashboardData(
    companyId: string,
    userId: string,
    query: DashboardQueryDto
  ): Promise<DashboardDataDto> {
    const { startDate, endDate, departmentId } = query;

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = endDate || new Date();
    const defaultStartDate =
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all data in parallel for better performance
    const [
      metrics,
      invoiceTrend,
      topVendors,
      approvalMetrics,
      recentActivity,
      pendingApprovals,
      upcomingPayments,
    ] = await Promise.all([
      this.getMetrics(companyId, defaultStartDate, defaultEndDate, departmentId),
      this.getInvoiceTrend(companyId, defaultStartDate, defaultEndDate, departmentId),
      this.getTopVendors(companyId, defaultStartDate, defaultEndDate, departmentId),
      this.getApprovalMetrics(companyId, defaultStartDate, defaultEndDate),
      this.getRecentActivity(companyId, 10),
      this.getPendingApprovals(companyId, userId, departmentId),
      this.getUpcomingPayments(companyId, 10, departmentId),
    ]);

    return {
      metrics,
      invoiceTrend,
      topVendors,
      approvalMetrics,
      recentActivity,
      pendingApprovals,
      upcomingPayments,
    };
  }

  private async getMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ): Promise<DashboardMetricsDto> {
    const whereClause: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    // Current period metrics
    const [
      totalInvoices,
      pendingApprovals,
      overdueInvoices,
      amountAggregation,
      approvedThisMonth,
      paidThisMonth,
      approvalTimeData,
    ] = await Promise.all([
      prisma.invoice.count({ where: whereClause }),
      prisma.invoice.count({
        where: {
          ...whereClause,
          approvalStatus: 'pending',
        },
      }),
      prisma.invoice.count({
        where: {
          ...whereClause,
          paymentStatus: 'unpaid',
          dueDate: { lt: new Date() },
        },
      }),
      prisma.invoice.aggregate({
        where: whereClause,
        _sum: { totalAmount: true },
      }),
      prisma.invoice.count({
        where: {
          ...whereClause,
          approvalStatus: 'approved',
        },
      }),
      prisma.invoice.count({
        where: {
          ...whereClause,
          paymentStatus: 'paid',
        },
      }),
      this.calculateAverageApprovalTime(companyId, startDate, endDate),
    ]);

    // Previous period for comparison
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const previousWhereClause = {
      ...whereClause,
      createdAt: {
        gte: previousPeriodStart,
        lte: startDate,
      },
    };

    const [previousInvoiceCount, previousAmountAggregation] = await Promise.all([
      prisma.invoice.count({ where: previousWhereClause }),
      prisma.invoice.aggregate({
        where: previousWhereClause,
        _sum: { totalAmount: true },
      }),
    ]);

    // Calculate percentage changes
    const invoiceChange = previousInvoiceCount > 0
      ? ((totalInvoices - previousInvoiceCount) / previousInvoiceCount) * 100
      : 0;

    const currentAmount = amountAggregation._sum.totalAmount || 0;
    const previousAmount = previousAmountAggregation._sum.totalAmount || 0;
    const amountChange = previousAmount > 0
      ? ((Number(currentAmount) - Number(previousAmount)) / Number(previousAmount)) * 100
      : 0;

    return {
      totalInvoices,
      pendingApprovals,
      overdueInvoices,
      totalAmount: Number(currentAmount),
      approvedThisMonth,
      paidThisMonth,
      averageApprovalTime: approvalTimeData,
      comparisonWithLastMonth: {
        invoices: Math.round(invoiceChange * 10) / 10,
        amount: Math.round(amountChange * 10) / 10,
      },
    };
  }

  private async calculateAverageApprovalTime(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const approvals = await prisma.approval.findMany({
      where: {
        invoice: {
          companyId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        status: 'approved',
        approvedAt: { not: null },
      },
      select: {
        createdAt: true,
        approvedAt: true,
      },
    });

    if (approvals.length === 0) return 0;

    const totalHours = approvals.reduce((sum, approval) => {
      const hours =
        (approval.approvedAt!.getTime() - approval.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round((totalHours / approvals.length) * 10) / 10;
  }

  private async getInvoiceTrend(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ): Promise<InvoiceTrendDto[]> {
    const whereClause: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by month
    const trendMap = new Map<string, { count: number; amount: number }>();

    invoices.forEach((invoice) => {
      const monthKey = `${invoice.createdAt.getFullYear()}-${String(
        invoice.createdAt.getMonth() + 1
      ).padStart(2, '0')}`;

      const existing = trendMap.get(monthKey) || { count: 0, amount: 0 };
      trendMap.set(monthKey, {
        count: existing.count + 1,
        amount: existing.amount + Number(invoice.totalAmount),
      });
    });

    // Convert to array and sort
    return Array.from(trendMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getTopVendors(
    companyId: string,
    startDate: Date,
    endDate: Date,
    departmentId?: string
  ): Promise<VendorSpendDto[]> {
    const whereClause: any = {
      companyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const result = await prisma.invoice.groupBy({
      by: ['vendorId'],
      where: whereClause,
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    });

    // Get vendor names
    const vendorIds = result.map((r) => r.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true },
    });

    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

    return result.map((r) => ({
      vendorId: r.vendorId,
      vendorName: vendorMap.get(r.vendorId) || 'Unknown',
      totalAmount: Number(r._sum.totalAmount || 0),
      invoiceCount: r._count.id,
    }));
  }

  private async getApprovalMetrics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApprovalMetricsDto[]> {
    const approvals = await prisma.approval.findMany({
      where: {
        invoice: {
          companyId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        level: true,
        status: true,
        createdAt: true,
        approvedAt: true,
      },
    });

    // Group by level
    const metricsMap = new Map<
      number,
      { pending: number; approved: number; rejected: number; totalTime: number; count: number }
    >();

    approvals.forEach((approval) => {
      const existing = metricsMap.get(approval.level) || {
        pending: 0,
        approved: 0,
        rejected: 0,
        totalTime: 0,
        count: 0,
      };

      if (approval.status === 'pending') existing.pending++;
      if (approval.status === 'approved') {
        existing.approved++;
        if (approval.approvedAt) {
          const hours =
            (approval.approvedAt.getTime() - approval.createdAt.getTime()) / (1000 * 60 * 60);
          existing.totalTime += hours;
          existing.count++;
        }
      }
      if (approval.status === 'rejected') existing.rejected++;

      metricsMap.set(approval.level, existing);
    });

    return Array.from(metricsMap.entries())
      .map(([level, data]) => ({
        level,
        pending: data.pending,
        approved: data.approved,
        rejected: data.rejected,
        averageTime: data.count > 0 ? Math.round((data.totalTime / data.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.level - b.level);
  }

  private async getRecentActivity(
    companyId: string,
    limit: number
  ): Promise<RecentActivityDto[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        companyId,
        entityType: {
          in: ['invoice', 'approval', 'payment'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        company: true,
      },
    });

    return auditLogs.map((log) => {
      let type: RecentActivityDto['type'];
      let description = '';

      if (log.entityType === 'invoice') {
        if (log.action === 'created') {
          type = 'invoice_created';
          description = 'New invoice created';
        } else {
          type = 'invoice_created';
          description = `Invoice ${log.action}`;
        }
      } else if (log.entityType === 'approval') {
        if (log.action === 'approved') {
          type = 'invoice_approved';
          description = 'Invoice approved';
        } else {
          type = 'invoice_rejected';
          description = 'Invoice rejected';
        }
      } else {
        type = 'payment_processed';
        description = 'Payment processed';
      }

      return {
        id: log.id,
        type,
        description,
        user: log.userId || 'System',
        timestamp: log.createdAt,
        metadata: log.changes,
      };
    });
  }

  private async getPendingApprovals(
    companyId: string,
    userId: string,
    departmentId?: string
  ): Promise<PendingApprovalDto[]> {
    const whereClause: any = {
      invoice: {
        companyId,
        approvalStatus: 'pending',
      },
      status: 'pending',
      approverId: userId,
    };

    const approvals = await prisma.approval.findMany({
      where: whereClause,
      include: {
        invoice: {
          include: {
            vendor: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10,
    });

    const now = new Date();

    return approvals.map((approval) => {
      const daysOverdue = Math.floor(
        (now.getTime() - approval.invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priority: PendingApprovalDto['priority'] = 'normal';
      if (daysOverdue > 7) priority = 'urgent';
      else if (daysOverdue > 3) priority = 'high';
      else if (daysOverdue < -7) priority = 'low';

      return {
        invoiceId: approval.invoice.id,
        invoiceNumber: approval.invoice.invoiceNumber,
        vendor: approval.invoice.vendor.name,
        amount: Number(approval.invoice.totalAmount),
        dueDate: approval.invoice.dueDate,
        daysOverdue,
        priority,
      };
    });
  }

  private async getUpcomingPayments(
    companyId: string,
    limit: number,
    departmentId?: string
  ): Promise<UpcomingPaymentDto[]> {
    const whereClause: any = {
      companyId,
      approvalStatus: 'approved',
      paymentStatus: { in: ['unpaid', 'partially_paid'] },
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: { name: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    });

    const now = new Date();

    return invoices.map((invoice) => {
      const daysUntilDue = Math.floor(
        (invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        vendor: invoice.vendor.name,
        amount: Number(invoice.amountDue),
        dueDate: invoice.dueDate,
        daysUntilDue,
      };
    });
  }
}
