import { Router } from 'express';
import { signup, signin, signout, getMe, resetPassword, verifyReset } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { signupSchema, signinSchema, resetPasswordSchema, verifyResetSchema } from '../validators';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/signin', validateBody(signinSchema), signin);
router.post('/signout', signout);
router.get('/me', authMiddleware, getMe);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.post('/verify-reset', validateBody(verifyResetSchema), verifyReset);

export const authRoutes = router;
