import { Response, NextFunction } from 'express';
import { getDb } from '../db/firestore';
import { AuthRequest } from '../types/types';
import { generateRecommendations } from '../lib/ai';

/**
 * GET /api/analytics/overview
 */
export async function getOverview(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;

    // Fetch all sessions
    const sessionsSnap = await getDb().collection('sessions').where('userId', '==', userId).orderBy('createdAt', 'asc').get();
    const sessions = sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    // Fetch all evaluations
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).orderBy('createdAt', 'asc').get();
    const evaluations = evalsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;

    // Score history
    const scoreHistory = evaluations.map((e) => ({
      date: e.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      score: e.overallScore || 0,
      role: sessions.find((s) => s.id === e.sessionId)?.role || 'Unknown',
    }));

    const scores = evaluations.map((e) => e.overallScore || 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

    // Skills progress (arrays of scores over time)
    const skillsProgress = {
      communication: evaluations.map((e) => e.skillsAssessment?.communication || 0),
      technicalKnowledge: evaluations.map((e) => e.skillsAssessment?.technicalKnowledge || 0),
      problemSolving: evaluations.map((e) => e.skillsAssessment?.problemSolving || 0),
      confidence: evaluations.map((e) => e.skillsAssessment?.confidence || 0),
    };

    // Top roles
    const roleMap: Record<string, { count: number; totalScore: number }> = {};
    evaluations.forEach((e) => {
      const role = sessions.find((s) => s.id === e.sessionId)?.role || 'Unknown';
      if (!roleMap[role]) roleMap[role] = { count: 0, totalScore: 0 };
      roleMap[role].count++;
      roleMap[role].totalScore += e.overallScore || 0;
    });
    const topRoles = Object.entries(roleMap).map(([role, data]) => ({
      role,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    })).sort((a, b) => b.count - a.count);

    // Improvement rate (first 3 vs last 3)
    let improvementRate = 0;
    if (scores.length >= 3) {
      const first3Avg = scores.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
      const last3Avg = scores.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
      improvementRate = first3Avg > 0 ? Math.round(((last3Avg - first3Avg) / first3Avg) * 100) : 0;
    }

    // Streak (consecutive days with sessions)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = new Set(
      sessions.map((s) => {
        const d = s.createdAt?.toDate?.() || new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (sessionDates.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    res.json({
      data: {
        totalSessions, completedSessions, averageScore,
        scoreHistory, skillsProgress, topRoles,
        improvementRate, streak,
      },
    });
  } catch (error) { next(error); }
}

/**
 * GET /api/analytics/skills-radar
 */
export async function getSkillsRadar(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(1).get();

    if (evalsSnap.empty) {
      res.json({ data: { communication: 0, technicalKnowledge: 0, problemSolving: 0, confidence: 0 } });
      return;
    }

    const latest = evalsSnap.docs[0].data();
    res.json({ data: latest.skillsAssessment || { communication: 0, technicalKnowledge: 0, problemSolving: 0, confidence: 0 } });
  } catch (error) { next(error); }
}

/**
 * GET /api/analytics/recommendations
 */
export async function getRecommendations(
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(3).get();

    const summaries = evalsSnap.docs.map((d) => d.data().summary as string).filter(Boolean);

    if (summaries.length === 0) {
      res.json({ data: ['Complete your first interview to get personalized recommendations'] });
      return;
    }

    const recommendations = await generateRecommendations(summaries);
    res.json({ data: recommendations });
  } catch (error) { next(error); }
}
