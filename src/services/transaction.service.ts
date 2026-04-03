import { TransactionType } from '../utils/types';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

interface CreateTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string | null;
  userId: string;
}

export const transactionService = {
  async list(filters: TransactionFilters) {
    const { type, category, startDate, endDate, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(type && { type }),
      ...(category && { category: { contains: category, mode: 'insensitive' as const } }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const tx = await prisma.transaction.findFirst({
      where: { id, isDeleted: false },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!tx) throw new NotFoundError('Transaction');
    return tx;
  },

  async create(data: CreateTransactionData) {
    return prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        userId: data.userId,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  async update(
    id: string,
    data: Partial<Omit<CreateTransactionData, 'userId'>>,
  ) {
    const existing = await prisma.transaction.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) throw new NotFoundError('Transaction');

    return prisma.transaction.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type && { type: data.type }),
        ...(data.category && { category: data.category }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  },

  /** Soft delete — sets isDeleted=true instead of destroying the record */
  async softDelete(id: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, isDeleted: false },
    });
    if (!existing) throw new NotFoundError('Transaction');

    return prisma.transaction.update({
      where: { id },
      data: { isDeleted: true },
    });
  },
};
