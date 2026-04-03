import { Request, Response, NextFunction } from 'express';
import { Role, UserStatus } from '../utils/types';
import { userService } from '../services/user.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { param, query } from '../utils/request';

export const userController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page   = Number(query(req, 'page'))  || 1;
      const limit  = Math.min(Number(query(req, 'limit')) || 10, 100);
      const role   = query(req, 'role')   as Role | undefined;
      const status = query(req, 'status') as UserStatus | undefined;

      const { users, meta } = await userService.list({ role, status, page, limit });
      return sendPaginated(res, users, meta);
    } catch (err) {
      return next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(param(req, 'id'));
      return sendSuccess(res, user);
    } catch (err) {
      return next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(param(req, 'id'), req.body);
      return sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      return next(err);
    }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.deactivate(param(req, 'id'));
      return sendSuccess(res, user, 'User deactivated successfully');
    } catch (err) {
      return next(err);
    }
  },
};
