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
    const sessionsSnap = await getDb().collection('sessions').where('userId', '==', userId).get();
    const sessions = sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
    sessions.sort((a, b) => (new Date(a.createdAt?.toDate?.() || a.createdAt).getTime() || 0) - (new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() || 0));

    // Fetch all evaluations
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).get();
    const evaluations = evalsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
    evaluations.sort((a, b) => (new Date(a.createdAt?.toDate?.() || a.createdAt).getTime() || 0) - (new Date(b.createdAt?.toDate?.() || b.createdAt).getTime() || 0));

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
      communication: evaluations.map((e) => e.skillsAssessment?.communication?.score || 0),
      technicalKnowledge: evaluations.map((e) => e.skillsAssessment?.technicalKnowledge?.score || 0),
      problemSolving: evaluations.map((e) => e.skillsAssessment?.problemSolving?.score || 0),
      confidence: evaluations.map((e) => e.skillsAssessment?.confidence?.score || 0),
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

    // Streak — only count days with COMPLETED interviews
    const STREAK_BADGE_MILESTONES: Record<number, string> = {
      3: '3-Day Streak 🔥',
      7: '7-Day Streak 🔥🔥',
      14: '14-Day Streak 🔥🔥🔥',
      30: '30-Day Streak 🏆',
    };

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedSessionDates = new Set(
      sessions
        .filter((s) => s.status === 'completed')
        .map((s) => {
          const d = s.createdAt?.toDate?.() || new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })
    );
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (completedSessionDates.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Badges based on streak milestones
    const badges: string[] = [];
    for (const [milestone, badge] of Object.entries(STREAK_BADGE_MILESTONES)) {
      if (streak >= parseInt(milestone)) {
        badges.push(badge);
      }
    }

    res.json({
      data: {
        totalSessions, completedSessions, averageScore,
        scoreHistory, skillsProgress, topRoles,
        improvementRate, streak, badges,
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
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).get();

    if (evalsSnap.empty) {
      res.json({ data: { communication: 0, technicalKnowledge: 0, problemSolving: 0, confidence: 0 } });
      return;
    }

    const evalsDocs = evalsSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    const latest = evalsDocs[0].data();
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
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).get();
    const evalsDocs = evalsSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    }).slice(0, 3);

    const summaries = evalsDocs.map((d) => d.data().executiveSummary as string).filter(Boolean);

    if (summaries.length === 0) {
      res.json({ data: ['Complete your first interview to get personalized recommendations'] });
      return;
    }

    const recommendations = await generateRecommendations(summaries);
    res.json({ data: recommendations });
  } catch (error) { next(error); }
}

import { successResponse, errorResponse } from '../lib/apiResponse';

/**
 * GET /api/analytics/trend
 * Returns real score trend from Firestore evaluations.
 */
export async function getTrend(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).get();
    const evalsDocs = evalsSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    });
    const sessionsSnap = await getDb().collection('sessions').where('userId', '==', userId).get();
    const sessionsMap = new Map(sessionsSnap.docs.map(d => [d.id, d.data()]));

    const trend = evalsDocs.map(d => {
      const data = d.data();
      const session = sessionsMap.get(data.sessionId);
      return {
        date: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        score: data.overallScore || 0,
        role: session?.role || 'Unknown',
      };
    });

    const scores = trend.map(t => t.score);
    let improvement = 0;
    if (scores.length >= 2) {
      improvement = scores[scores.length - 1] - scores[0];
    }

    res.status(200).json(successResponse({ trend, improvement }));
  } catch (error: any) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch trend', error.message));
  }
}

/**
 * GET /api/analytics/weaknesses
 * Identifies weakest skill areas from the most recent evaluation.
 */
export async function getWeaknesses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).get();

    if (evalsSnap.empty) {
      res.status(200).json(successResponse({ weaknesses: [] }));
      return;
    }

    const evalsDocs = evalsSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    }).slice(0, 3);

    // Aggregate skill scores across recent evaluations
    const skillTotals: Record<string, { total: number; count: number }> = {};
    for (const doc of evalsDocs) {
      const skills = doc.data().skillsAssessment;
      if (!skills) continue;
      for (const [key, val] of Object.entries(skills)) {
        const score = (val as any)?.score;
        if (typeof score === 'number') {
          if (!skillTotals[key]) skillTotals[key] = { total: 0, count: 0 };
          skillTotals[key].total += score;
          skillTotals[key].count++;
        }
      }
    }

    const weaknesses = Object.entries(skillTotals)
      .map(([topic, data]) => ({
        topic: topic.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
        score: Math.round(data.total / data.count),
        severity: Math.round(data.total / data.count) < 50 ? 'High' : Math.round(data.total / data.count) < 70 ? 'Medium' : 'Low',
      }))
      .filter(w => w.severity !== 'Low')
      .sort((a, b) => a.score - b.score);

    res.status(200).json(successResponse({ weaknesses }));
  } catch (error: any) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch weaknesses', error.message));
  }
}

/**
 * GET /api/analytics/improvement
 * Extracts concrete improvement suggestions from recent evaluations.
 */
export async function getImprovement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const evalsSnap = await getDb().collection('evaluations').where('userId', '==', userId).get();
    const evalsDocs = evalsSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    }).slice(0, 3);

    const areas: string[] = [];
    for (const doc of evalsDocs) {
      const data = doc.data();
      // Collect concrete tips from interviewTips and improvementPlan
      if (data.interviewTips && Array.isArray(data.interviewTips)) {
        areas.push(...data.interviewTips);
      }
      if (data.improvementPlan && Array.isArray(data.improvementPlan)) {
        for (const plan of data.improvementPlan) {
          if (plan.action) areas.push(plan.action);
        }
      }
    }

    // Deduplicate and limit
    const unique = [...new Set(areas)].slice(0, 6);
    res.status(200).json(successResponse({ areas: unique.length > 0 ? unique : ['Complete your first interview to get improvement areas'] }));
  } catch (error: any) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch improvement', error.message));
  }
}
