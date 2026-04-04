import OpenAI from 'openai';
import fs from 'fs';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * @param filePath - Absolute path to the audio file on disk
 * @returns The transcribed text
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  const file = fs.createReadStream(filePath);

  const response = await getOpenAI().audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
  });

  return response.text;
}
