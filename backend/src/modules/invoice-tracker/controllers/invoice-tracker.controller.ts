import { Request, Response } from 'express';
import { InvoiceTrackerService } from '../services/invoice-tracker.service';
import { InvoiceTrackerQueryDto } from '../dto/invoice-tracker.dto';

export class InvoiceTrackerController {
  private service: InvoiceTrackerService;

  constructor() {
    this.service = new InvoiceTrackerService();
  }

  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;

      const query: InvoiceTrackerQueryDto = {
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        approvalStatus: req.query.approvalStatus ? (req.query.approvalStatus as string).split(',') : undefined,
        paymentStatus: req.query.paymentStatus ? (req.query.paymentStatus as string).split(',') : undefined,
        vendorId: req.query.vendorId as string,
        departmentId: req.query.departmentId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await this.service.getInvoices(companyId, query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices',
        error: String(error),
      });
    }
  }

  async getInvoiceDetail(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { invoiceId } = req.params;

      const result = await this.service.getInvoiceDetail(invoiceId, companyId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get invoice detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invoice details',
        error: String(error),
      });
    }
  }

  async getPipelineStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;

      const result = await this.service.getPipelineStats(companyId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get pipeline stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pipeline statistics',
        error: String(error),
      });
    }
  }

  async getAgingReport(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;

      const result = await this.service.getAgingReport(companyId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get aging report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch aging report',
        error: String(error),
      });
    }
  }

  async bulkUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { invoiceIds, status } = req.body;

      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invoice IDs are required',
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required',
        });
        return;
      }

      const result = await this.service.bulkUpdateStatus(invoiceIds, status, companyId);

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Bulk update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update invoice statuses',
        error: String(error),
      });
    }
  }

  async getInvoicesByVendor(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const { vendorId } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await this.service.getInvoicesByVendor(companyId, vendorId, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Get invoices by vendor error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vendor invoices',
        error: String(error),
      });
    }
  }
}
