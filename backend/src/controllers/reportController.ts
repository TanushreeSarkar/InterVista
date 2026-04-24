import { Response } from 'express';
import { getDb } from '../db/firestore';
import { successResponse, errorResponse } from '../lib/apiResponse';
import { AuthRequest } from '../types/types';

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const reportsSnapshot = await getDb().collection('reports')
      .where('userId', '==', userId)
      .get();

    const reports: any[] = [];
    reportsSnapshot.forEach((doc: any) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    reports.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    res.status(200).json(successResponse(reports));
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch reports', error.message));
  }
};

export const getReportById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const reportDoc = await getDb().collection('reports').doc(id as string).get();

    if (!reportDoc.exists) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Report not found'));
      return;
    }

    const reportData = reportDoc.data();
    if (reportData?.userId !== userId) {
      res.status(403).json(errorResponse('FORBIDDEN', 'Access denied to this report'));
      return;
    }

    res.status(200).json(successResponse({ id: reportDoc.id, ...reportData }));
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch report', error.message));
  }
};
