import { PrismaClient } from '@prisma/client';
import {
  ApprovalItemDto,
  ApprovalHistoryDto,
  ApprovalStatsDto,
  ApprovalChainDto,
  EscalationDto,
  BulkApprovalResultDto,
} from '../dto/approval.dto';
import { DOAMatrixService } from './doa-matrix.service';

const prisma = new PrismaClient();

export class ApprovalService {
  private doaMatrixService: DOAMatrixService;

  constructor() {
    this.doaMatrixService = new DOAMatrixService();
  }

  async getPendingApprovals(
    companyId: string,
    userId: string,
    filters?: {
      priority?: string;
      departmentId?: string;
      minAmount?: number;
      maxAmount?: number;
    }
  ): Promise<ApprovalItemDto[]> {
    const whereClause: any = {
      invoice: { companyId },
      approverId: userId,
      status: 'pending',
    };

    if (filters?.departmentId) {
      whereClause.invoice = {
        ...whereClause.invoice,
        departmentId: filters.departmentId,
      };
    }

    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      whereClause.invoice = {
        ...whereClause.invoice,
        totalAmount: {},
      };
      if (filters.minAmount !== undefined) {
        whereClause.invoice.totalAmount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        whereClause.invoice.totalAmount.lte = filters.maxAmount;
      }
    }

    const approvals = await prisma.approval.findMany({
      where: whereClause,
      include: {
        invoice: {
          include: {
            vendor: true,
            department: true,
          },
        },
        approver: true,
      },
      orderBy: { assignedAt: 'asc' },
    });

    const items: ApprovalItemDto[] = [];

    for (const approval of approvals) {
      const priority = this.calculatePriority(
        approval.invoice.totalAmount,
        approval.invoice.dueDate,
        approval.assignedAt
      );

      if (filters?.priority && priority !== filters.priority) {
        continue;
      }

      const now = new Date();
      const dueAt = new Date(approval.assignedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.ceil((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysRemaining < 0;

      const previousApprovals = await prisma.approval.findMany({
        where: {
          invoiceId: approval.invoiceId,
          level: { lt: approval.level },
          status: { in: ['approved', 'rejected'] },
        },
        include: {
          approver: true,
        },
        orderBy: { level: 'asc' },
      });

      items.push({
        id: approval.id,
        invoice: {
          id: approval.invoice.id,
          invoiceNumber: approval.invoice.invoiceNumber,
          vendor: {
            id: approval.invoice.vendor.id,
            name: approval.invoice.vendor.name,
          },
          department: approval.invoice.department
            ? {
                id: approval.invoice.department.id,
                name: approval.invoice.department.name,
              }
            : undefined,
          totalAmount: Number(approval.invoice.totalAmount),
          currency: approval.invoice.currency,
          invoiceDate: approval.invoice.invoiceDate,
          dueDate: approval.invoice.dueDate,
          description: approval.invoice.description || undefined,
        },
        level: approval.level,
        approver: {
          id: approval.approver.id,
          name: `${approval.approver.firstName} ${approval.approver.lastName}`,
          email: approval.approver.email,
        },
        status: approval.status as any,
        priority,
        assignedAt: approval.assignedAt,
        dueAt,
        isOverdue,
        daysRemaining,
        previousApprovals: previousApprovals.map((prev) => ({
          level: prev.level,
          approver: `${prev.approver.firstName} ${prev.approver.lastName}`,
          status: prev.status,
          approvedAt: prev.approvedAt!,
        })),
      });
    }

    return items;
  }

  async approveInvoice(
    approvalId: string,
    userId: string,
    companyId: string,
    comments?: string
  ): Promise<void> {
    const approval = await prisma.approval.findFirst({
      where: {
        id: approvalId,
        approverId: userId,
        status: 'pending',
      },
      include: {
        invoice: true,
      },
    });

    if (!approval) {
      throw new Error('Approval not found or already processed');
    }

    await prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          comments,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'approved',
          entityType: 'invoice',
          entityId: approval.invoiceId,
          changes: { level: approval.level, comments },
        },
      });

      const nextLevelApproval = await tx.approval.findFirst({
        where: {
          invoiceId: approval.invoiceId,
          level: approval.level + 1,
          status: 'pending',
        },
      });

      if (!nextLevelApproval) {
        await tx.invoice.update({
          where: { id: approval.invoiceId },
          data: {
            approvalStatus: 'approved',
            status: 'approved',
          },
        });

        await tx.auditLog.create({
          data: {
            companyId,
            userId,
            action: 'fully_approved',
            entityType: 'invoice',
            entityId: approval.invoiceId,
            changes: { finalApprover: userId },
          },
        });
      }
    });
  }

  async rejectInvoice(
    approvalId: string,
    userId: string,
    companyId: string,
    comments: string
  ): Promise<void> {
    const approval = await prisma.approval.findFirst({
      where: {
        id: approvalId,
        approverId: userId,
        status: 'pending',
      },
    });

    if (!approval) {
      throw new Error('Approval not found or already processed');
    }

    await prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: 'rejected',
          approvedAt: new Date(),
          comments,
        },
      });

      await tx.approval.updateMany({
        where: {
          invoiceId: approval.invoiceId,
          level: { gt: approval.level },
        },
        data: {
          status: 'skipped',
        },
      });

      await tx.invoice.update({
        where: { id: approval.invoiceId },
        data: {
          approvalStatus: 'rejected',
          status: 'rejected',
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'rejected',
          entityType: 'invoice',
          entityId: approval.invoiceId,
          changes: { level: approval.level, comments },
        },
      });
    });
  }

  async requestMoreInfo(
    approvalId: string,
    userId: string,
    companyId: string,
    comments: string
  ): Promise<void> {
    const approval = await prisma.approval.findFirst({
      where: {
        id: approvalId,
        approverId: userId,
        status: 'pending',
      },
    });

    if (!approval) {
      throw new Error('Approval not found or already processed');
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: approval.invoiceId },
        data: {
          status: 'info_requested',
        },
      });

      await tx.comment.create({
        data: {
          invoiceId: approval.invoiceId,
          userId,
          content: comments,
          type: 'info_request',
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId,
          action: 'info_requested',
          entityType: 'invoice',
          entityId: approval.invoiceId,
          changes: { level: approval.level, comments },
        },
      });
    });
  }

  async getApprovalHistory(
    companyId: string,
    userId: string,
    limit: number = 50
  ): Promise<ApprovalHistoryDto[]> {
    const approvals = await prisma.approval.findMany({
      where: {
        invoice: { companyId },
        approverId: userId,
        status: { in: ['approved', 'rejected'] },
      },
      include: {
        invoice: {
          include: {
            vendor: true,
          },
        },
        approver: true,
      },
      orderBy: { approvedAt: 'desc' },
      take: limit,
    });

    return approvals.map((approval) => ({
      id: approval.id,
      invoiceId: approval.invoice.id,
      invoiceNumber: approval.invoice.invoiceNumber,
      vendor: approval.invoice.vendor.name,
      amount: Number(approval.invoice.totalAmount),
      currency: approval.invoice.currency,
      level: approval.level,
      action: approval.status,
      approver: `${approval.approver.firstName} ${approval.approver.lastName}`,
      comments: approval.comments || undefined,
      actionDate: approval.approvedAt!,
    }));
  }

  async getApprovalStats(companyId: string, userId: string): Promise<ApprovalStatsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [pending, urgent, overdue, approvedToday, rejectedToday, avgTime] = await Promise.all([
      prisma.approval.count({
        where: {
          invoice: { companyId },
          approverId: userId,
          status: 'pending',
        },
      }),

      prisma.approval.count({
        where: {
          invoice: { companyId, totalAmount: { gte: 10000 } },
          approverId: userId,
          status: 'pending',
        },
      }),

      prisma.approval.count({
        where: {
          invoice: { companyId },
          approverId: userId,
          status: 'pending',
          assignedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        },
      }),

      prisma.approval.count({
        where: {
          invoice: { companyId },
          approverId: userId,
          status: 'approved',
          approvedAt: { gte: todayStart },
        },
      }),

      prisma.approval.count({
        where: {
          invoice: { companyId },
          approverId: userId,
          status: 'rejected',
          approvedAt: { gte: todayStart },
        },
      }),

      this.calculateAverageApprovalTime(companyId, userId),
    ]);

    const totalProcessed = await prisma.approval.count({
      where: {
        invoice: { companyId },
        approverId: userId,
        status: { in: ['approved', 'rejected'] },
      },
    });

    return {
      pending,
      urgent,
      overdue,
      approvedToday,
      rejectedToday,
      averageTimeToApprove: avgTime,
      totalProcessed,
    };
  }

  private async calculateAverageApprovalTime(companyId: string, userId: string): Promise<number> {
    const approvals = await prisma.approval.findMany({
      where: {
        invoice: { companyId },
        approverId: userId,
        status: { in: ['approved', 'rejected'] },
        approvedAt: { not: null },
      },
      select: {
        assignedAt: true,
        approvedAt: true,
      },
      take: 100,
    });

    if (approvals.length === 0) return 0;

    const totalHours = approvals.reduce((sum, approval) => {
      const hours =
        (approval.approvedAt!.getTime() - approval.assignedAt.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round(totalHours / approvals.length);
  }

  async generateApprovalChain(
    invoiceId: string,
    companyId: string
  ): Promise<ApprovalChainDto> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const levels = await this.doaMatrixService.determineApprovalLevels(
      companyId,
      Number(invoice.totalAmount),
      invoice.departmentId || undefined
    );

    const chain: ApprovalChainDto = {
      invoiceId,
      totalAmount: Number(invoice.totalAmount),
      departmentId: invoice.departmentId || undefined,
      levels: [],
    };

    for (const level of levels) {
      const approvers = await this.doaMatrixService.getApproversForLevel(
        companyId,
        level,
        Number(invoice.totalAmount),
        invoice.departmentId || undefined
      );

      chain.levels.push({
        level,
        approvers,
        minApprovals: 1,
        doaRule: `Level ${level} approval required`,
      });
    }

    return chain;
  }

  async createApprovalChain(invoiceId: string, companyId: string): Promise<void> {
    const chain = await this.generateApprovalChain(invoiceId, companyId);

    for (const level of chain.levels) {
      for (const approver of level.approvers) {
        await prisma.approval.create({
          data: {
            invoiceId,
            approverId: approver.id,
            level: level.level,
            status: 'pending',
            assignedAt: new Date(),
          },
        });
      }
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        approvalStatus: 'pending',
        status: 'submitted',
      },
    });
  }

  async getEscalations(companyId: string): Promise<EscalationDto[]> {
    const now = new Date();
    const escalationThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const overdueApprovals = await prisma.approval.findMany({
      where: {
        invoice: { companyId },
        status: 'pending',
        assignedAt: { lt: escalationThreshold },
      },
      include: {
        invoice: {
          include: {
            vendor: true,
          },
        },
        approver: true,
      },
    });

    return overdueApprovals.map((approval) => ({
      id: approval.id,
      invoiceId: approval.invoice.id,
      invoiceNumber: approval.invoice.invoiceNumber,
      vendor: approval.invoice.vendor.name,
      amount: Number(approval.invoice.totalAmount),
      currentApprover: `${approval.approver.firstName} ${approval.approver.lastName}`,
      assignedAt: approval.assignedAt,
      escalationTime: new Date(approval.assignedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      escalationReason: 'No action taken within 3 days',
    }));
  }

  async escalateApproval(approvalId: string, escalateToUserId: string, companyId: string): Promise<void> {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new Error('Approval not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          approverId: escalateToUserId,
          assignedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId: escalateToUserId,
          action: 'escalated',
          entityType: 'approval',
          entityId: approvalId,
          changes: { from: approval.approverId, to: escalateToUserId },
        },
      });
    });
  }

  async bulkApprove(
    invoiceIds: string[],
    userId: string,
    companyId: string,
    comments?: string
  ): Promise<BulkApprovalResultDto> {
    const results: BulkApprovalResultDto = {
      success: true,
      processed: 0,
      failed: 0,
      results: [],
    };

    for (const invoiceId of invoiceIds) {
      try {
        const approval = await prisma.approval.findFirst({
          where: {
            invoiceId,
            approverId: userId,
            status: 'pending',
          },
        });

        if (!approval) {
          results.failed++;
          results.results.push({
            invoiceId,
            status: 'failed',
            message: 'No pending approval found',
          });
          continue;
        }

        await this.approveInvoice(approval.id, userId, companyId, comments);

        results.processed++;
        results.results.push({
          invoiceId,
          status: 'success',
          message: 'Approved successfully',
        });
      } catch (error) {
        results.failed++;
        results.results.push({
          invoiceId,
          status: 'failed',
          message: String(error),
        });
      }
    }

    results.success = results.failed === 0;

    return results;
  }

  async bulkReject(
    invoiceIds: string[],
    userId: string,
    companyId: string,
    comments: string
  ): Promise<BulkApprovalResultDto> {
    const results: BulkApprovalResultDto = {
      success: true,
      processed: 0,
      failed: 0,
      results: [],
    };

    for (const invoiceId of invoiceIds) {
      try {
        const approval = await prisma.approval.findFirst({
          where: {
            invoiceId,
            approverId: userId,
            status: 'pending',
          },
        });

        if (!approval) {
          results.failed++;
          results.results.push({
            invoiceId,
            status: 'failed',
            message: 'No pending approval found',
          });
          continue;
        }

        await this.rejectInvoice(approval.id, userId, companyId, comments);

        results.processed++;
        results.results.push({
          invoiceId,
          status: 'success',
          message: 'Rejected successfully',
        });
      } catch (error) {
        results.failed++;
        results.results.push({
          invoiceId,
          status: 'failed',
          message: String(error),
        });
      }
    }

    results.success = results.failed === 0;

    return results;
  }

  private calculatePriority(
    amount: any,
    dueDate: Date,
    assignedAt: Date
  ): 'urgent' | 'high' | 'normal' | 'low' {
    const amountNum = Number(amount);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInQueue = Math.ceil((now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (amountNum >= 50000 || daysUntilDue <= 3 || daysInQueue >= 3) {
      return 'urgent';
    }

    if (amountNum >= 10000 || daysUntilDue <= 7 || daysInQueue >= 2) {
      return 'high';
    }

    if (amountNum >= 5000 || daysUntilDue <= 14) {
      return 'normal';
    }

    return 'low';
  }
}
