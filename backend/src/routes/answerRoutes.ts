import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { submitAnswer, getEvaluation, retryEvaluation, upload } from '../controllers/answerController';
import { authMiddleware } from '../middleware/auth';
import { submitAnswerSchema } from '../validators';

const router = Router();

const validateMultipart = (req: Request, res: Response, next: NextFunction): void => {
  const result = submitAnswerSchema.safeParse(req.body);
  if (!result.success) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    const flattened = result.error.flatten();
    res.status(400).json({ error: 'Validation failed', details: { fieldErrors: flattened.fieldErrors, formErrors: flattened.formErrors } });
    return;
  }
  req.body = result.data;
  next();
};

// submitAnswer validation is handled after multer parses the multipart form
router.post('/', authMiddleware, upload.single('audio'), validateMultipart, submitAnswer);
router.get('/evaluation/:sessionId', authMiddleware, getEvaluation);
router.post('/evaluation/:sessionId/retry', authMiddleware, retryEvaluation);

export const answerRoutes = router;
