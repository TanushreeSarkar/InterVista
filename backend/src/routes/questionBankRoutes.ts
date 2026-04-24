import { Router } from 'express';
import { createQuestionBank, getQuestionBanks, getQuestionBank, updateQuestionBank, deleteQuestionBank } from '../controllers/questionBankController';
import { authMiddleware } from '../middleware/auth';
import { requirePremium } from '../middleware/subscription';
import { validateBody } from '../middleware/validate';
import { createQuestionBankSchema, updateQuestionBankSchema } from '../validators';

const router = Router();

router.post('/', authMiddleware, requirePremium, validateBody(createQuestionBankSchema), createQuestionBank);
router.get('/', authMiddleware, getQuestionBanks);
router.get('/:id', authMiddleware, getQuestionBank);
router.put('/:id', authMiddleware, requirePremium, validateBody(updateQuestionBankSchema), updateQuestionBank);
router.delete('/:id', authMiddleware, requirePremium, deleteQuestionBank);

export const questionBankRoutes = router;

