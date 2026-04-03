import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate, updateUserSchema, userIdParamSchema } from '../validators/schemas';

const router = Router();

// All user management routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/users
router.get('/', userController.list);

// GET /api/users/:id
router.get('/:id', validate(userIdParamSchema), userController.getById);

// PATCH /api/users/:id
router.patch('/:id', validate(updateUserSchema), userController.update);

// DELETE /api/users/:id  (soft deactivation)
router.delete('/:id', validate(userIdParamSchema), userController.deactivate);

export default router;
