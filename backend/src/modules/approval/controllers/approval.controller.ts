import { Request, Response } from 'express';
import { ApprovalService } from '../services/approval.service';
import { DOAMatrixService } from '../services/doa-matrix.service';

export class ApprovalController {
  private service: ApprovalService;
  private doaService: DOAMatrixService;

  constructor() {
    this.service = new ApprovalService();
    this.doaService = new DOAMatrixService();
  }

  async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const filters = {
        priority: req.query.priority as string,
        departmentId: req.query.departmentId as string,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      };

      const result = await this.service.getPendingApprovals(companyId, userId, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending approvals',
        error: String(error),
      });
    }
  }

  async approveInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { approvalId } = req.params;
      const { comments } = req.body;

      await this.service.approveInvoice(approvalId, userId, companyId, comments);

      res.json({
        success: true,
        message: 'Invoice approved successfully',
      });
    } catch (error) {
      console.error('Approve invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve invoice',
        error: String(error),
      });
    }
  }

  async rejectInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { approvalId } = req.params;
      const { comments } = req.body;

      if (!comments) {
        res.status(400).json({
          success: false,
          message: 'Comments are required when rejecting',
        });
        return;
      }

      await this.service.rejectInvoice(approvalId, userId, companyId, comments);

      res.json({
        success: true,
        message: 'Invoice rejected successfully',
      });
    } catch (error) {
      console.error('Reject invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject invoice',
        error: String(error),
      });
    }
  }

  async requestInfo(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { approvalId } = req.params;
      const { comments } = req.body;

      if (!comments) {
        res.status(400).json({
          success: false,
          message: 'Comments are required when requesting info',
        });
        return;
      }

      await this.service.requestMoreInfo(approvalId, userId, companyId, comments);

      res.json({
        success: true,
        message: 'Information request sent successfully',
      });
    } catch (error) {
      console.error('Request info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request information',
        error: String(error),
      });
    }
  }

  async getApprovalHistory(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const result = await this.service.getApprovalHistory(companyId, userId, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get approval history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approval history',
        error: String(error),
      });
    }
  }

  async getApprovalStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const result = await this.service.getApprovalStats(companyId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get approval stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch approval statistics',
        error: String(error),
      });
    }
  }

  async generateApprovalChain(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { invoiceId } = req.params;

      const result = await this.service.generateApprovalChain(invoiceId, companyId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Generate approval chain error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate approval chain',
        error: String(error),
      });
    }
  }

  async createApprovalChain(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { invoiceId } = req.params;

      await this.service.createApprovalChain(invoiceId, companyId);

      res.json({
        success: true,
        message: 'Approval chain created successfully',
      });
    } catch (error) {
      console.error('Create approval chain error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create approval chain',
        error: String(error),
      });
    }
  }

  async getEscalations(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;

      const result = await this.service.getEscalations(companyId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get escalations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch escalations',
        error: String(error),
      });
    }
  }

  async escalateApproval(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { approvalId } = req.params;
      const { escalateToUserId } = req.body;

      if (!escalateToUserId) {
        res.status(400).json({
          success: false,
          message: 'Target user ID is required',
        });
        return;
      }

      await this.service.escalateApproval(approvalId, escalateToUserId, companyId);

      res.json({
        success: true,
        message: 'Approval escalated successfully',
      });
    } catch (error) {
      console.error('Escalate approval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to escalate approval',
        error: String(error),
      });
    }
  }

  async bulkApprove(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { invoiceIds, comments } = req.body;

      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invoice IDs are required',
        });
        return;
      }

      const result = await this.service.bulkApprove(invoiceIds, userId, companyId, comments);

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Bulk approve error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk approve invoices',
        error: String(error),
      });
    }
  }

  async bulkReject(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { invoiceIds, comments } = req.body;

      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invoice IDs are required',
        });
        return;
      }

      if (!comments) {
        res.status(400).json({
          success: false,
          message: 'Comments are required for bulk rejection',
        });
        return;
      }

      const result = await this.service.bulkReject(invoiceIds, userId, companyId, comments);

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Bulk reject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk reject invoices',
        error: String(error),
      });
    }
  }

  async getDOAMatrix(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;

      const result = await this.doaService.getAllRules(companyId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get DOA matrix error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch DOA matrix',
        error: String(error),
      });
    }
  }

  async createDOARule(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const rule = req.body;

      const result = await this.doaService.createRule(companyId, rule);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Create DOA rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create DOA rule',
        error: String(error),
      });
    }
  }

  async updateDOARule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const updates = req.body;

      const result = await this.doaService.updateRule(ruleId, updates);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Update DOA rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update DOA rule',
        error: String(error),
      });
    }
  }

  async deleteDOARule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;

      await this.doaService.deleteRule(ruleId);

      res.json({
        success: true,
        message: 'DOA rule deleted successfully',
      });
    } catch (error) {
      console.error('Delete DOA rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete DOA rule',
        error: String(error),
      });
    }
  }
}
