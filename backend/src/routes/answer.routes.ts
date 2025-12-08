import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { submitAnswer, getEvaluation } from '../controllers/answer.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticateToken);

router.post('/', upload.single('audio'), submitAnswer);
router.get('/evaluation/:sessionId', getEvaluation);

export default router;