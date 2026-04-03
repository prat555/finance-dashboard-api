import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export const dashboardController = {
  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const data = await dashboardService.getSummary(startDate, endDate);
      return sendSuccess(res, data, 'Dashboard summary retrieved');
    } catch (err) {
      return next(err);
    }
  },

  async trends(req: Request, res: Response, next: NextFunction) {
    try {
      const year = Number(req.query.year) || new Date().getFullYear();
      const data = await dashboardService.getMonthlyTrends(year);
      return sendSuccess(res, data, `Monthly trends for ${year}`);
    } catch (err) {
      return next(err);
    }
  },

  async categories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getCategoryBreakdown();
      return sendSuccess(res, data, 'Category breakdown retrieved');
    } catch (err) {
      return next(err);
    }
  },
};
