import fs from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(filePath: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY missing, skipping STT");
        return "";
    }

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: process.env.STT_MODEL || "whisper-1",
        });

        // The type for response_format: "text" brings back a string directly? 
        // Actually, with the official SDK it usually returns an object or string depending on params.
        // Let's force it to text for simplicity.
        // If it returns an object: return transcription.text;

        // Checking SDK types, create return type depends on options. 
        // If we don't specify response_format, it defaults to json -> { text: string }

        return transcription.text;
    } catch (error) {
        console.error("Whisper STT failed:", error);
        return "";
    }
}
