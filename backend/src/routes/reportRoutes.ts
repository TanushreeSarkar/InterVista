import { Router } from 'express';
import { getReports, getReportById } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getReports);
router.get('/:id', authMiddleware, getReportById);

export const reportRoutes = router;
