import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * @param filePath - Absolute path to the audio file on disk
 * @returns The transcribed text
 */
export async function transcribeAudio(filePath: string): Promise<string> {
  const file = fs.createReadStream(filePath);

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
  });

  return response.text;
}
