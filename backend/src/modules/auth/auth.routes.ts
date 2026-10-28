import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { AuthGuard } from './guards/auth.guard';

const router = Router();
const authController = new AuthController();
const authGuard = new AuthGuard();

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authGuard.authenticate, authController.logout);
router.get('/me', authGuard.authenticate, authController.me);
router.post('/change-password', authGuard.authenticate, authController.changePassword);

export default router;
