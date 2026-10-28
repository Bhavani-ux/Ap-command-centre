import { Router } from 'express';
import { DashboardController } from './controllers/dashboard.controller';
import { AuthGuard } from '../auth/guards/auth.guard';

const router = Router();
const dashboardController = new DashboardController();
const authGuard = new AuthGuard();

// All dashboard routes require authentication
router.get('/', authGuard.authenticate, dashboardController.getDashboardData);

export default router;
