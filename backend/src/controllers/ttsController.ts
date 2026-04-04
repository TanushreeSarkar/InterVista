import { Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../types/types';
import { getDb } from '../db/firestore';
import { getPersona } from '../lib/personas';
import logger from '../lib/logger';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

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

    const mp3 = await getOpenAI().audio.speech.create({
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
