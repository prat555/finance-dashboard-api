import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '../utils/types';
import { prisma } from '../utils/prisma';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../utils/errors';

const SALT_ROUNDS = 12;

const signToken = (userId: string, email: string, role: Role): string => {
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign({ userId, email, role }, secret, { expiresIn } as jwt.SignOptions);
};

const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
}) => {
  const { passwordHash: _, ...safe } = user;
  return safe;
};

export const authService = {
  async register(data: { name: string; email: string; password: string; role?: Role }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('A user with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? 'VIEWER',
      },
    });

    const token = signToken(user.id, user.email, user.role);
    return { token, user: sanitizeUser(user) };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');

    if (user.status === 'INACTIVE') {
      throw new ForbiddenError('Your account has been deactivated. Contact an administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const token = signToken(user.id, user.email, user.role);
    return { token, user: sanitizeUser(user) };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');
    return sanitizeUser(user);
  },
};
