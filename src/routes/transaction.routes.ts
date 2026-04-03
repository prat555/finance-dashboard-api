import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  validate,
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdParamSchema,
} from '../validators/schemas';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// GET /api/transactions  — all roles can read
router.get(
  '/',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  transactionController.list,
);

// GET /api/transactions/:id  — all roles can read
router.get(
  '/:id',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(transactionIdParamSchema),
  transactionController.getById,
);

// POST /api/transactions  — ADMIN only
router.post(
  '/',
  authorize('ADMIN'),
  validate(createTransactionSchema),
  transactionController.create,
);

// PATCH /api/transactions/:id  — ADMIN only
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate(updateTransactionSchema),
  transactionController.update,
);

// DELETE /api/transactions/:id  — ADMIN only (soft delete)
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(transactionIdParamSchema),
  transactionController.remove,
);

export default router;
