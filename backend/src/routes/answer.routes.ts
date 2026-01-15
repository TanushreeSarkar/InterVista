import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { submitAnswer, getEvaluation } from '../controllers/answer.controller';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(authenticateToken);

router.post('/', upload.single('audio'), submitAnswer);
router.get('/evaluation/:sessionId', getEvaluation);

export default router;