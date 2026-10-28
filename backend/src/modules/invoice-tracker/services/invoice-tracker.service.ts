import { PrismaClient } from '@prisma/client';
import {
  InvoiceTrackerQueryDto,
  InvoiceTrackerItemDto,
  InvoiceDetailDto,
  InvoiceTimelineEventDto,
  InvoicePipelineStatsDto,
  InvoiceAgingBucketDto,
  BulkActionResultDto,
} from '../dto/invoice-tracker.dto';

const prisma = new PrismaClient();

export class InvoiceTrackerService {
  async getInvoices(
    companyId: string,
    query: InvoiceTrackerQueryDto
  ): Promise<{ items: InvoiceTrackerItemDto[]; total: number; page: number; limit: number }> {
    const {
      status,
      approvalStatus,
      paymentStatus,
      vendorId,
      departmentId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Build where clause
    const whereClause: any = {
      companyId,
    };

    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    if (approvalStatus && approvalStatus.length > 0) {
      whereClause.approvalStatus = { in: approvalStatus };
    }

    if (paymentStatus && paymentStatus.length > 0) {
      whereClause.paymentStatus = { in: paymentStatus };
    }

    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (startDate || endDate) {
      whereClause.invoiceDate = {};
      if (startDate) whereClause.invoiceDate.gte = startDate;
      if (endDate) whereClause.invoiceDate.lte = endDate;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.totalAmount = {};
      if (minAmount !== undefined) whereClause.totalAmount.gte = minAmount;
      if (maxAmount !== undefined) whereClause.totalAmount.lte = maxAmount;
    }

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { poNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.invoice.count({ where: whereClause });

    // Get paginated invoices
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        approvals: {
          where: { status: 'pending' },
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { level: 'asc' },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: InvoiceTrackerItemDto[] = invoices.map((invoice) => {
      const now = new Date();
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0 && invoice.paymentStatus !== 'paid';

      const pendingApproval = invoice.approvals[0];

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        vendor: invoice.vendor,
        department: invoice.department || undefined,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        totalAmount: Number(invoice.totalAmount),
        amountPaid: Number(invoice.amountPaid),
        amountDue: Number(invoice.amountDue),
        currency: invoice.currency,
        status: invoice.status,
        approvalStatus: invoice.approvalStatus,
        paymentStatus: invoice.paymentStatus,
        daysUntilDue,
        isOverdue,
        currentApprovalLevel: pendingApproval?.level,
        assignedApprover: pendingApproval
          ? {
              id: pendingApproval.approver.id,
              name: `${pendingApproval.approver.firstName} ${pendingApproval.approver.lastName}`,
            }
          : undefined,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      };
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getInvoiceDetail(invoiceId: string, companyId: string): Promise<InvoiceDetailDto> {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
      },
      include: {
        vendor: true,
        department: true,
        lineItems: {
          include: {
            glAccount: true,
          },
          orderBy: { lineNumber: 'asc' },
        },
        approvals: {
          include: {
            approver: true,
          },
          orderBy: { level: 'asc' },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get attachments
    const attachments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, file_name as filename, file_size as "fileSize", uploaded_at as "uploadedAt", uploaded_by as "uploadedBy"
       FROM attachments WHERE invoice_id = $1`,
      invoiceId
    );

    // Build timeline
    const timeline = await this.buildTimeline(invoiceId);

    // Calculate days until due
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const invoiceItem: InvoiceTrackerItemDto = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      vendor: {
        id: invoice.vendor.id,
        name: invoice.vendor.name,
      },
      department: invoice.department
        ? {
            id: invoice.department.id,
            name: invoice.department.name,
          }
        : undefined,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      totalAmount: Number(invoice.totalAmount),
      amountPaid: Number(invoice.amountPaid),
      amountDue: Number(invoice.amountDue),
      currency: invoice.currency,
      status: invoice.status,
      approvalStatus: invoice.approvalStatus,
      paymentStatus: invoice.paymentStatus,
      daysUntilDue,
      isOverdue: daysUntilDue < 0 && invoice.paymentStatus !== 'paid',
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    return {
      invoice: invoiceItem,
      lineItems: invoice.lineItems.map((item) => ({
        id: item.id,
        lineNumber: item.lineNumber,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        glAccount: item.glAccount
          ? {
              id: item.glAccount.id,
              accountNumber: item.glAccount.accountNumber,
              accountName: item.glAccount.accountName,
            }
          : undefined,
      })),
      approvalChain: invoice.approvals.map((approval) => ({
        level: approval.level,
        status: approval.status,
        approver: {
          id: approval.approver.id,
          name: `${approval.approver.firstName} ${approval.approver.lastName}`,
          email: approval.approver.email,
        },
        approvedAt: approval.approvedAt || undefined,
        comments: approval.comments || undefined,
      })),
      timeline,
      attachments: attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        fileSize: att.fileSize || 0,
        uploadedAt: att.uploadedAt,
        uploadedBy: att.uploadedBy || 'Unknown',
      })),
      comments: invoice.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        user: {
          id: comment.user.id,
          name: `${comment.user.firstName} ${comment.user.lastName}`,
        },
        createdAt: comment.createdAt,
      })),
    };
  }

  private async buildTimeline(invoiceId: string): Promise<InvoiceTimelineEventDto[]> {
    const events: InvoiceTimelineEventDto[] = [];

    // Get audit logs for this invoice
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'invoice',
        entityId: invoiceId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    auditLogs.forEach((log) => {
      let type: InvoiceTimelineEventDto['type'] = 'status_changed';
      let description = log.action;

      if (log.action === 'created') {
        type = 'created';
        description = 'Invoice created';
      } else if (log.action === 'submitted') {
        type = 'submitted';
        description = 'Submitted for approval';
      } else if (log.action === 'approved') {
        type = 'approved';
        description = 'Invoice approved';
      } else if (log.action === 'rejected') {
        type = 'rejected';
        description = 'Invoice rejected';
      } else if (log.action === 'paid') {
        type = 'paid';
        description = 'Payment processed';
      }

      events.push({
        id: log.id,
        type,
        description,
        timestamp: log.createdAt,
        metadata: log.changes,
      });
    });

    return events;
  }

  async getPipelineStats(companyId: string): Promise<InvoicePipelineStatsDto> {
    const [draft, pendingApproval, approved, paid, rejected, overdue] = await Promise.all([
      prisma.invoice.count({
        where: { companyId, status: 'draft' },
      }),
      prisma.invoice.count({
        where: { companyId, approvalStatus: 'pending' },
      }),
      prisma.invoice.count({
        where: { companyId, approvalStatus: 'approved', paymentStatus: { not: 'paid' } },
      }),
      prisma.invoice.count({
        where: { companyId, paymentStatus: 'paid' },
      }),
      prisma.invoice.count({
        where: { companyId, approvalStatus: 'rejected' },
      }),
      prisma.invoice.count({
        where: {
          companyId,
          dueDate: { lt: new Date() },
          paymentStatus: { not: 'paid' },
        },
      }),
    ]);

    return {
      draft,
      pendingApproval,
      approved,
      paid,
      rejected,
      overdue,
    };
  }

  async getAgingReport(companyId: string): Promise<InvoiceAgingBucketDto> {
    const now = new Date();
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [current, days31to60, days61to90, over90] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          companyId,
          paymentStatus: { not: 'paid' },
          dueDate: { gte: days30Ago, lte: now },
        },
        _count: true,
        _sum: { amountDue: true },
      }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          paymentStatus: { not: 'paid' },
          dueDate: { gte: days60Ago, lt: days30Ago },
        },
        _count: true,
        _sum: { amountDue: true },
      }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          paymentStatus: { not: 'paid' },
          dueDate: { gte: days90Ago, lt: days60Ago },
        },
        _count: true,
        _sum: { amountDue: true },
      }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          paymentStatus: { not: 'paid' },
          dueDate: { lt: days90Ago },
        },
        _count: true,
        _sum: { amountDue: true },
      }),
    ]);

    return {
      current: current._count,
      days31to60: days31to60._count,
      days61to90: days61to90._count,
      over90: over90._count,
      totalCount:
        current._count + days31to60._count + days61to90._count + over90._count,
      totalAmount:
        Number(current._sum.amountDue || 0) +
        Number(days31to60._sum.amountDue || 0) +
        Number(days61to90._sum.amountDue || 0) +
        Number(over90._sum.amountDue || 0),
    };
  }

  async bulkUpdateStatus(
    invoiceIds: string[],
    status: string,
    companyId: string
  ): Promise<BulkActionResultDto> {
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    for (const invoiceId of invoiceIds) {
      try {
        await prisma.invoice.updateMany({
          where: {
            id: invoiceId,
            companyId,
          },
          data: {
            status,
            updatedAt: new Date(),
          },
        });
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Failed to update ${invoiceId}: ${error}`);
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors,
    };
  }

  async getInvoicesByVendor(
    companyId: string,
    vendorId: string,
    limit: number = 10
  ): Promise<InvoiceTrackerItemDto[]> {
    const result = await this.getInvoices(companyId, {
      vendorId,
      limit,
      sortBy: 'invoiceDate',
      sortOrder: 'desc',
    });

    return result.items;
  }
}
