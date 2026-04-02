import { Router } from 'express';
import { submitAnswer, getEvaluation, upload } from '../controllers/answerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Note: submitAnswer validation is handled after multer parses the multipart form
// The submitAnswerSchema is applied inside the controller since multer runs first
router.post('/', authMiddleware, upload.single('audio'), submitAnswer);
router.get('/evaluation/:sessionId', authMiddleware, getEvaluation);

export const answerRoutes = router;
