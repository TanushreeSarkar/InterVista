import { Router } from 'express';
import { signUp, signIn, resetPassword } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/reset-password', resetPassword);

export default router;