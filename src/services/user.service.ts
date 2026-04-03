import { Role, UserStatus } from '../utils/types';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

const sanitize = (user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
}) => {
  const { passwordHash: _, ...safe } = user;
  return safe;
};

export const userService = {
  async list(filters: { role?: Role; status?: UserStatus; page: number; limit: number }) {
    const { role, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(role && { role }),
      ...(status && { status }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(sanitize),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');
    return sanitize(user);
  },

  async update(id: string, data: { name?: string; role?: Role; status?: UserStatus }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({ where: { id }, data });
    return sanitize(updated);
  },

  /** Soft deactivation — preserves audit trail */
  async deactivate(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return sanitize(updated);
  },
};
