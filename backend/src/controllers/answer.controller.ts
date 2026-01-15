import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, collections } from '../db/firestore';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error-handler';

import { evaluateAnswer } from '../services/ai.service';
import { transcribeAudio } from '../services/stt.service';
import { uploadFileToStorage } from '../services/storage.service';

export async function submitAnswer(req: AuthRequest, res: Response) {
  try {
    const { sessionId, questionId, transcript } = req.body;
    const audioFile = req.file;

    if (!sessionId || !questionId || (!audioFile && !transcript)) {
      throw new AppError('Session ID, question ID, and either audio file or transcript are required', 400);
    }

    const db = getFirestore();
    const answerId = uuidv4();

    // 1. Get Question Text
    let questionText = "General Interview Question";
    try {
      const qDoc = await db.collection(collections.questions).doc(questionId).get();
      if (qDoc.exists) {
        questionText = qDoc.data()?.text || questionText;
      } else if (global.mockQuestions && global.mockQuestions[sessionId]) {
        const mockQ = global.mockQuestions[sessionId].find((q: any) => q.id === questionId);
        if (mockQ) questionText = mockQ.text;
      }
    } catch (e) {
      console.warn("Failed to fetch question text", e);
    }

    // Upload Audio to Firebase Storage
    let publicAudioUrl = null;
    if (audioFile) {
      try {
        publicAudioUrl = await uploadFileToStorage(audioFile, 'answers');
      } catch (uploadError) {
        console.error("Failed to upload audio to storage", uploadError);
      }
    }

    // 2. AI Evaluation
    let textToEvaluate = transcript;

    // Server-side STT with Whisper (fallback)
    if (!textToEvaluate && audioFile) {
      console.log("Transcript missing. Using Whisper to transcribe server-side...");
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tempFilePath = path.join(os.tmpdir(), `audio-${uuidv4()}.webm`);

      try {
        fs.writeFileSync(tempFilePath, audioFile.buffer);
        textToEvaluate = await transcribeAudio(tempFilePath);

        // Cleanup temp file
        fs.unlinkSync(tempFilePath);
      } catch (sttError) {
        console.error("Server-side STT failed", sttError);
        // Ensure cleanup
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }
    }

    // Fallback
    textToEvaluate = textToEvaluate || "Audio transcript not available. Evaluating based on audio metadata.";

    const aiEvaluation = await evaluateAnswer(questionText, textToEvaluate);

    const answer = {
      id: answerId,
      sessionId,
      questionId,
      audioUrl: publicAudioUrl,
      transcript: textToEvaluate,
      createdAt: new Date(),
    };

    await db.collection(collections.answers).doc(answerId).set(answer);

    // Update session status
    await db.collection(collections.sessions).doc(sessionId).update({
      status: 'in_progress',
      updatedAt: new Date(),
    });

    // Store AI evaluation
    const evaluation = {
      id: uuidv4(),
      sessionId,
      questionId,
      score: aiEvaluation.score,
      feedback: aiEvaluation.feedback,
      strengths: aiEvaluation.strengths,
      improvements: aiEvaluation.improvements,
      createdAt: new Date(),
    };

    await db.collection(collections.evaluations).doc(evaluation.id).set(evaluation);

    res.status(201).json({ answer, evaluation });
  } catch (error) {
    throw error;
  }
}

export async function getEvaluation(req: AuthRequest, res: Response) {
  try {
    const { sessionId } = req.params;
    const db = getFirestore();

    const evaluationsSnapshot = await db
      .collection(collections.evaluations)
      .where('sessionId', '==', sessionId)
      .get();

    const evaluations = evaluationsSnapshot.docs.map((doc) => doc.data());

    // Calculate overall score
    const overallScore = evaluations.length > 0
      ? Math.round(
        evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
      )
      : 0;

    // Update session
    await db.collection(collections.sessions).doc(sessionId).update({
      status: 'completed',
      completedAt: new Date(),
      score: overallScore,
      updatedAt: new Date(),
    });

    res.json(evaluations);
  } catch (error) {
    throw error;
  }
}