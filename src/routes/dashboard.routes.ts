import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All dashboard analytics require authentication + ANALYST or ADMIN role
router.use(authenticate, authorize('ANALYST', 'ADMIN'));

// GET /api/dashboard/summary
router.get('/summary', dashboardController.summary);

// GET /api/dashboard/trends?year=2024
router.get('/trends', dashboardController.trends);

// GET /api/dashboard/categories
router.get('/categories', dashboardController.categories);

export default router;
