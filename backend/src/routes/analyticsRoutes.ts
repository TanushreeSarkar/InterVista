import { Router } from 'express';
import { getOverview, getSkillsRadar, getRecommendations, getTrend, getWeaknesses, getImprovement } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';
import { requirePremium } from '../middleware/subscription';

const router = Router();

router.get('/overview', authMiddleware, getOverview);
router.get('/skills-radar', authMiddleware, getSkillsRadar);
router.get('/recommendations', authMiddleware, requirePremium, getRecommendations);
router.get('/trend', authMiddleware, getTrend);
router.get('/weaknesses', authMiddleware, getWeaknesses);
router.get('/improvement', authMiddleware, getImprovement);

export const analyticsRoutes = router;

