import { Router } from 'express';
import { getReports, getReportById } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';
import { requirePremium } from '../middleware/subscription';

const router = Router();

router.get('/', authMiddleware, requirePremium, getReports);
router.get('/:id', authMiddleware, requirePremium, getReportById);

export const reportRoutes = router;

