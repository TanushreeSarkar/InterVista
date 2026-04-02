import { Router } from 'express';
import { speak } from '../controllers/ttsController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { ttsSchema } from '../validators';

const router = Router();

router.post('/speak', authMiddleware, validateBody(ttsSchema), speak);

export const ttsRoutes = router;
