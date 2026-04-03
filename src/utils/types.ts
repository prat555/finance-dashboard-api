/**
 * Local mirror of the Prisma-generated enum types.
 *
 * These are identical to what `prisma generate` produces in @prisma/client.
 * Once you run `npx prisma generate` locally, you can import directly from
 * '@prisma/client' if you prefer — both are interchangeable.
 */

export type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TransactionType = 'INCOME' | 'EXPENSE';

export const Role = {
  VIEWER: 'VIEWER' as Role,
  ANALYST: 'ANALYST' as Role,
  ADMIN: 'ADMIN' as Role,
};

export const UserStatus = {
  ACTIVE: 'ACTIVE' as UserStatus,
  INACTIVE: 'INACTIVE' as UserStatus,
};

export const TransactionType = {
  INCOME: 'INCOME' as TransactionType,
  EXPENSE: 'EXPENSE' as TransactionType,
};
