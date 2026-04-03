import { Request, Response, NextFunction } from 'express';
import { TransactionType } from '../utils/types';
import { transactionService } from '../services/transaction.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { param, query } from '../utils/request';

export const transactionController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page  = Number(query(req, 'page'))  || 1;
      const limit = Math.min(Number(query(req, 'limit')) || 10, 100);
      const type      = query(req, 'type') as TransactionType | undefined;
      const category  = query(req, 'category');
      const startDate = query(req, 'startDate');
      const endDate   = query(req, 'endDate');

      const { transactions, meta } = await transactionService.list({
        type, category, startDate, endDate, page, limit,
      });
      return sendPaginated(res, transactions, meta);
    } catch (err) {
      return next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.getById(param(req, 'id'));
      return sendSuccess(res, tx);
    } catch (err) {
      return next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.create({
        ...req.body,
        userId: req.user!.userId,
      });
      return sendCreated(res, tx, 'Transaction created successfully');
    } catch (err) {
      return next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.update(param(req, 'id'), req.body);
      return sendSuccess(res, tx, 'Transaction updated successfully');
    } catch (err) {
      return next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await transactionService.softDelete(param(req, 'id'));
      return sendSuccess(res, null, 'Transaction deleted successfully');
    } catch (err) {
      return next(err);
    }
  },
};
