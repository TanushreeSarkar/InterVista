import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createSession,
  getSession,
  getSessions,
  getQuestions,
} from '../controllers/session.controller';

const router = Router();

router.use(authenticateToken);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:sessionId', getSession);
router.get('/:sessionId/questions', getQuestions);

export default router;