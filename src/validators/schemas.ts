import { z } from 'zod';

// ── Auth ───────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// ── Users ──────────────────────────────────────────────────────────────────────
export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
  body: z
    .object({
      name: z.string().min(2).max(100).optional(),
      role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid user ID') }),
});

// ── Transactions ───────────────────────────────────────────────────────────────
export const createTransactionSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive('Amount must be greater than 0')
      .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
    type: z.enum(['INCOME', 'EXPENSE'], 'Type must be INCOME or EXPENSE'),
    category: z.string().min(1, 'Category is required').max(100),
    date: z.string().datetime({ message: 'Date must be an ISO 8601 datetime' }),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid transaction ID') }),
  body: z
    .object({
      amount: z.number().positive().multipleOf(0.01).optional(),
      type: z.enum(['INCOME', 'EXPENSE']).optional(),
      category: z.string().min(1).max(100).optional(),
      date: z.string().datetime().optional(),
      notes: z.string().max(500).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const transactionFiltersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid transaction ID') }),
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardFiltersSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    year: z.string().regex(/^\d{4}$/).optional().transform(Number),
  }),
});

// ── Validate helper ────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory — validates req against the provided Zod schema.
 * Schema should be an object with keys: body, params, query (all optional).
 */
export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  };
