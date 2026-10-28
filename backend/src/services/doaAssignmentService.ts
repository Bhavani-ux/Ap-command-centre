import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DOAAssignmentResult {
  success: boolean;
  approvalId?: string;
  level?: number;
  error?: string;
}

export class DOAAssignmentService {
  /**
   * Assigns an invoice to the appropriate approval level based on DOA Matrix
   */
  async assignInvoiceForApproval(invoiceId: string, companyId: string): Promise<DOAAssignmentResult> {
    try {
      // Get the invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Find the appropriate DOA band based on amount
      const doaRule = await prisma.doaMatrixRule.findFirst({
        where: {
          companyId,
          isActive: true,
          minAmount: { lte: invoice.totalAmount },
          maxAmount: { gte: invoice.totalAmount },
        },
        orderBy: { approvalLevel: 'asc' },
      });

      if (!doaRule) {
        // No DOA rule found - assign to highest level (Level 5)
        console.warn(`No DOA rule found for amount ${invoice.totalAmount}, assigning to L5`);
        return await this.createApprovalForLevel(invoiceId, companyId, 5, 'CFO');
      }

      // Update invoice with DOA level
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          doaLevel: doaRule.approvalLevel,
          status: 'pending_approval',
          approvalStatus: 'pending_approval',
        },
      });

      // Create approval record
      return await this.createApprovalForLevel(
        invoiceId,
        companyId,
        doaRule.approvalLevel,
        doaRule.roleCode
      );
    } catch (error) {
      console.error('DOA assignment error:', error);
      return { success: false, error: 'Failed to assign invoice for approval' };
    }
  }

  /**
   * Creates an approval record for a specific level and assigns to users with that role
   */
  private async createApprovalForLevel(
    invoiceId: string,
    companyId: string,
    level: number,
    roleCode: string
  ): Promise<DOAAssignmentResult> {
    try {
      // Check if approval already exists
      const existingApproval = await prisma.approval.findFirst({
        where: {
          invoiceId,
          level,
        },
      });

      if (existingApproval) {
        return {
          success: true,
          approvalId: existingApproval.id,
          level,
        };
      }

      // Find users with the required role
      const usersWithRole = await prisma.user.findMany({
        where: {
          companyId,
          isActive: true,
          roles: {
            some: {
              code: roleCode,
            },
          },
        },
        take: 1, // Get first user with this role
      });

      // If no user found with exact role, find System Admin as fallback
      let approver = usersWithRole[0];
      if (!approver) {
        const systemAdmin = await prisma.user.findFirst({
          where: {
            companyId,
            isActive: true,
            roles: {
              some: {
                code: 'SYSTEM_ADMIN',
              },
            },
          },
        });
        approver = systemAdmin || await prisma.user.findFirst({ where: { companyId, isActive: true } });
      }

      if (!approver) {
        return { success: false, error: 'No approver found' };
      }

      // Create approval record
      const approval = await prisma.approval.create({
        data: {
          invoiceId,
          approverId: approver.id,
          level,
          status: 'pending',
          assignedAt: new Date(),
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
          isEscalated: false,
        },
      });

      console.log(`Created approval L${level} for invoice ${invoiceId}, assigned to ${approver.email}`);

      return {
        success: true,
        approvalId: approval.id,
        level,
      };
    } catch (error) {
      console.error('Create approval error:', error);
      return { success: false, error: 'Failed to create approval' };
    }
  }

  /**
   * Reassigns all pending invoices based on current DOA Matrix
   */
  async reassignAllPendingInvoices(companyId: string): Promise<{ reassigned: number; failed: number }> {
    try {
      const pendingInvoices = await prisma.invoice.findMany({
        where: {
          companyId,
          status: { in: ['completeness_check', 'validation', 'pending_approval'] },
        },
      });

      let reassigned = 0;
      let failed = 0;

      for (const invoice of pendingInvoices) {
        // Delete existing approvals
        await prisma.approval.deleteMany({
          where: {
            invoiceId: invoice.id,
            status: 'pending',
          },
        });

        // Reassign based on current DOA matrix
        const result = await this.assignInvoiceForApproval(invoice.id, companyId);
        if (result.success) {
          reassigned++;
        } else {
          failed++;
        }
      }

      console.log(`Reassigned ${reassigned} invoices, ${failed} failed`);
      return { reassigned, failed };
    } catch (error) {
      console.error('Reassign all invoices error:', error);
      return { reassigned: 0, failed: 0 };
    }
  }
}

export const doaAssignmentService = new DOAAssignmentService();
