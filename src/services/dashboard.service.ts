import { prisma } from '../utils/prisma';
import { TransactionType } from '../utils/types';

export const dashboardService = {
  /**
   * Returns total income, total expenses, net balance,
   * category breakdown, and 5 most recent transactions.
   */
  async getSummary(startDate?: string, endDate?: string) {
    const dateFilter =
      startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {};

    const baseWhere = { isDeleted: false, ...dateFilter };

    // ── Aggregate totals ───────────────────────────────────────────────────
    const [incomeAgg, expenseAgg, transactionCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...baseWhere, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...baseWhere, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({ where: baseWhere }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);

    // ── Category breakdown ─────────────────────────────────────────────────
    const categoryRows = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where: baseWhere,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryBreakdown = categoryRows.map((row: {
      category: string;
      type: TransactionType;
      _sum: { amount: unknown };
      _count: number;
    }) => ({
      category: row.category,
      type: row.type,
      total: Number(row._sum.amount ?? 0),
      count: row._count,
    }));

    // ── Recent transactions ────────────────────────────────────────────────
    const recentTransactions = await prisma.transaction.findMany({
      where: baseWhere,
      orderBy: { date: 'desc' },
      take: 5,
      include: { user: { select: { id: true, name: true } } },
    });

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount,
      categoryBreakdown,
      recentTransactions,
    };
  },

  /**
   * Monthly trends for a given year: income vs expenses per month.
   */
  async getMonthlyTrends(year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const transactions = await prisma.transaction.findMany({
      where: { isDeleted: false, date: { gte: startDate, lte: endDate } },
      select: { amount: true, type: true, date: true },
    });

    // Build month buckets 1–12
    const months: Record<number, { income: number; expenses: number }> = {};
    for (let m = 1; m <= 12; m++) {
      months[m] = { income: 0, expenses: 0 };
    }

    for (const tx of transactions) {
      const month = tx.date.getMonth() + 1; // getMonth() is 0-indexed
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        months[month].income += amount;
      } else {
        months[month].expenses += amount;
      }
    }

    const MONTH_NAMES = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return Object.entries(months).map(([month, data]) => ({
      month: Number(month),
      monthName: MONTH_NAMES[Number(month) - 1],
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    }));
  },

  /**
   * Category totals (all time or filtered).
   * Groups by category and type, sorted by total amount descending.
   */
  async getCategoryBreakdown() {
    const rows = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where: { isDeleted: false },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    return rows.map((row: {
      category: string;
      type: TransactionType;
      _sum: { amount: unknown };
      _count: number;
    }) => ({
      category: row.category,
      type: row.type,
      total: Number(row._sum.amount ?? 0),
      count: row._count,
    }));
  },
};
