import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  // ── Zod validation errors ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const issues = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: issues,
    });
  }

  // ── Known operational errors ──────────────────────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // ── Prisma unique constraint violation ────────────────────────────────────
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  ) {
    return res.status(409).json({
      success: false,
      message: 'A record with those unique fields already exists',
      code: 'CONFLICT',
    });
  }

  // ── Unexpected errors ─────────────────────────────────────────────────────
  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};
