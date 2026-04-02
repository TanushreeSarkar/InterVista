import { Router } from 'express';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../validators';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), updateProfile);
router.put('/password', authMiddleware, validateBody(changePasswordSchema), changePassword);
router.delete('/account', authMiddleware, deleteAccount);

export const userRoutes = router;
