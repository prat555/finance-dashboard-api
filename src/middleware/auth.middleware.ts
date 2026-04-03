import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../utils/types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET ?? 'fallback-secret';
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};

/**
 * Factory: returns middleware that allows only the specified roles.
 * Usage: authorize('ADMIN')  |  authorize('ANALYST', 'ADMIN')
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        ),
      );
    }
    return next();
  };
};
