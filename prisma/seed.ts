import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Seeding database...');

  // ── Skip if already seeded ─────────────────────────────────────────────────
  // This keeps deploy-time seeding safe on Render and avoids wiping demo data.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('✅  Database already seeded, skipping.');
    return;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hash(pw, 12);

  const [admin, analyst, viewer] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@finance.dev',
        passwordHash: await hash('admin1234'),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Analyst User',
        email: 'analyst@finance.dev',
        passwordHash: await hash('analyst1234'),
        role: 'ANALYST',
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Viewer User',
        email: 'viewer@finance.dev',
        passwordHash: await hash('viewer1234'),
        role: 'VIEWER',
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log(`✅  Created users: ${admin.email}, ${analyst.email}, ${viewer.email}`);

  // ── Transactions ───────────────────────────────────────────────────────────
  const now = new Date();
  const monthsAgo = (n: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - n);
    return d;
  };

  const transactions = [
    // Income
    { amount: 85000, type: 'INCOME' as const, category: 'Salary', date: monthsAgo(0), notes: 'Monthly salary - April', userId: admin.id },
    { amount: 12000, type: 'INCOME' as const, category: 'Freelance', date: monthsAgo(0), notes: 'UI design project', userId: admin.id },
    { amount: 85000, type: 'INCOME' as const, category: 'Salary', date: monthsAgo(1), notes: 'Monthly salary - March', userId: admin.id },
    { amount: 5000,  type: 'INCOME' as const, category: 'Investment', date: monthsAgo(1), notes: 'Dividend payout', userId: analyst.id },
    { amount: 85000, type: 'INCOME' as const, category: 'Salary', date: monthsAgo(2), notes: 'Monthly salary - February', userId: admin.id },
    { amount: 85000, type: 'INCOME' as const, category: 'Salary', date: monthsAgo(3), notes: 'Monthly salary - January', userId: admin.id },
    { amount: 18000, type: 'INCOME' as const, category: 'Freelance', date: monthsAgo(3), notes: 'Backend contract', userId: analyst.id },
    { amount: 85000, type: 'INCOME' as const, category: 'Salary', date: monthsAgo(4), notes: 'Monthly salary - December', userId: admin.id },
    { amount: 85000, type: 'INCOME' as const, category: 'Salary', date: monthsAgo(5), notes: 'Monthly salary - November', userId: admin.id },

    // Expenses
    { amount: 22000, type: 'EXPENSE' as const, category: 'Rent', date: monthsAgo(0), notes: 'Office rent - April', userId: admin.id },
    { amount: 3500,  type: 'EXPENSE' as const, category: 'Utilities', date: monthsAgo(0), notes: 'Electricity + internet', userId: admin.id },
    { amount: 8000,  type: 'EXPENSE' as const, category: 'Software', date: monthsAgo(0), notes: 'SaaS subscriptions', userId: admin.id },
    { amount: 15000, type: 'EXPENSE' as const, category: 'Payroll', date: monthsAgo(0), notes: 'Contractor payments', userId: admin.id },
    { amount: 22000, type: 'EXPENSE' as const, category: 'Rent', date: monthsAgo(1), notes: 'Office rent - March', userId: admin.id },
    { amount: 4200,  type: 'EXPENSE' as const, category: 'Travel', date: monthsAgo(1), notes: 'Client visit - Mumbai', userId: analyst.id },
    { amount: 22000, type: 'EXPENSE' as const, category: 'Rent', date: monthsAgo(2), notes: 'Office rent - February', userId: admin.id },
    { amount: 6700,  type: 'EXPENSE' as const, category: 'Marketing', date: monthsAgo(2), notes: 'Social media ads', userId: admin.id },
    { amount: 22000, type: 'EXPENSE' as const, category: 'Rent', date: monthsAgo(3), notes: 'Office rent - January', userId: admin.id },
    { amount: 11000, type: 'EXPENSE' as const, category: 'Equipment', date: monthsAgo(3), notes: 'New laptops x2', userId: admin.id },
    { amount: 22000, type: 'EXPENSE' as const, category: 'Rent', date: monthsAgo(4), notes: 'Office rent - December', userId: admin.id },
    { amount: 22000, type: 'EXPENSE' as const, category: 'Rent', date: monthsAgo(5), notes: 'Office rent - November', userId: admin.id },
    { amount: 9500,  type: 'EXPENSE' as const, category: 'Software', date: monthsAgo(5), notes: 'Annual license renewal', userId: admin.id },
  ];

  await prisma.transaction.createMany({ data: transactions });
  console.log(`✅  Created ${transactions.length} transactions`);

  console.log('\n🎉  Seed complete! Test credentials:');
  console.log('   Admin:   admin@finance.dev   / admin1234');
  console.log('   Analyst: analyst@finance.dev / analyst1234');
  console.log('   Viewer:  viewer@finance.dev  / viewer1234\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
