import { Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../types/types';
import { getDb } from '../db/firestore';
import { getPersona } from '../lib/personas';
import logger from '../lib/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * POST /api/tts/speak
 * Text-to-speech using OpenAI TTS API.
 * Accepts { text, sessionId? } — if sessionId provided, uses persona voice.
 * Returns audio/mpeg stream.
 */
export async function speak(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { text, sessionId } = req.body;

    // Determine voice from session persona
    let voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'onyx';

    if (sessionId) {
      const sessionDoc = await getDb().collection('sessions').doc(sessionId).get();
      if (sessionDoc.exists) {
        const personaId = sessionDoc.data()?.personaId;
        const persona = getPersona(personaId);
        voice = persona.voice;
      }
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}
