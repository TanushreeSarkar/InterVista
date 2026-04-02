import { Router } from 'express';
import { getOverview, getSkillsRadar, getRecommendations } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/overview', authMiddleware, getOverview);
router.get('/skills-radar', authMiddleware, getSkillsRadar);
router.get('/recommendations', authMiddleware, getRecommendations);

export const analyticsRoutes = router;
