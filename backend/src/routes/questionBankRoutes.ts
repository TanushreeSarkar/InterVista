import { Router } from 'express';
import { createQuestionBank, getQuestionBanks, getQuestionBank, updateQuestionBank, deleteQuestionBank } from '../controllers/questionBankController';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createQuestionBankSchema, updateQuestionBankSchema } from '../validators';

const router = Router();

router.post('/', authMiddleware, validateBody(createQuestionBankSchema), createQuestionBank);
router.get('/', authMiddleware, getQuestionBanks);
router.get('/:id', authMiddleware, getQuestionBank);
router.put('/:id', authMiddleware, validateBody(updateQuestionBankSchema), updateQuestionBank);
router.delete('/:id', authMiddleware, deleteQuestionBank);

export const questionBankRoutes = router;
