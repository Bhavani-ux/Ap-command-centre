import { Request, Response, NextFunction } from 'express';
import { EmailIntakeService } from '../services/email-intake.service';

export class EmailIntakeController {
  private emailIntakeService: EmailIntakeService;

  constructor() {
    this.emailIntakeService = new EmailIntakeService();
  }

  processEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const results = await this.emailIntakeService.processIncomingEmails(req.user.companyId);

      res.status(200).json({
        success: true,
        data: results,
        message: `Processed ${results.length} emails`,
      });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const stats = await this.emailIntakeService.getIntakeStats(req.user.companyId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const history = await this.emailIntakeService.getIntakeHistory(
        req.user.companyId,
        limit
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  getPendingReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const items = await this.emailIntakeService.getPendingReviewItems(req.user.companyId);

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  };
}
