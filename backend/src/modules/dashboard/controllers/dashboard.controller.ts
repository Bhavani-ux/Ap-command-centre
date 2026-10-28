import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const query: DashboardQueryDto = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        departmentId: req.query.departmentId as string | undefined,
      };

      const data = await this.dashboardService.getDashboardData(
        req.user.companyId,
        req.user.id,
        query
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
