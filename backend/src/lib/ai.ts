import OpenAI from 'openai';
import { EvaluationResult } from '../types/types';
import { getPersona } from './personas';
import logger from './logger';

// Groq uses OpenAI-compatible SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Clean up markdown markers and other noise from AI JSON responses.
 */
function cleanJsonResponse(raw: string): string {
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : raw;
}

/**
 * Generate 5 interview questions using Groq.
 */
export async function generateQuestions(
  role: string,
  company: string,
  difficulty: string,
  personaId?: string
): Promise<string[]> {
  const persona = getPersona(personaId);

  const prompt = `You are an expert interviewer at ${company}. Generate exactly 5 interview questions for a ${difficulty} level ${role} candidate. Return ONLY a valid JSON array of 5 question strings, no markdown, no explanation.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: persona.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      });

      const raw = response.choices[0].message.content || '';
      // Since some models return { "questions": [...] } even if asked for array, we handle it
      const cleaned = cleanJsonResponse(raw);
      const parsed = JSON.parse(cleaned);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

      if (!Array.isArray(questions) || questions.length !== 5) {
        throw new Error(`Expected 5 questions, got ${questions.length}`);
      }

      return questions;
    } catch (error) {
      if (attempt === 0) {
        logger.warn('Question generation failed, retrying...');
        continue;
      }
      throw new Error(`Failed to generate questions after 2 attempts: ${error}`);
    }
  }

  throw new Error('Failed to generate questions');
}

/**
 * Evaluate all Q&A pairs using Groq.
 */
export async function evaluateAnswers(
  questions: string[],
  answers: string[],
  role: string = 'Candidate',
  company: string = 'Company',
  difficulty: string = 'Medium',
  personaId?: string
): Promise<EvaluationResult> {
  const persona = getPersona(personaId);

  const qaPairs = questions
    .map((q, i) => `Question ${i + 1}: ${q}\nAnswer ${i + 1}: ${answers[i] || '(No answer provided)'}`)
    .join('\n\n');

  const prompt = `Evaluate the following interview responses.
Role: ${role}
Company: ${company}
Difficulty: ${difficulty}
Persona Style: ${persona.name}

Interview Transcript:
${qaPairs}

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "recommendation": "<Strong Hire | Hire | Consider | No Hire>",
  "executiveSummary": "<3-4 sentence overall assessment>",
  "skillsAssessment": {
    "communication": { "score": <0-100>, "observation": "<text>" },
    "technicalKnowledge": { "score": <0-100>, "observation": "<text>" },
    "problemSolving": { "score": <0-100>, "observation": "<text>" },
    "confidence": { "score": <0-100>, "observation": "<text>" },
    "structuredThinking": { "score": <0-100>, "observation": "<text>" },
    "relevantExperience": { "score": <0-100>, "observation": "<text>" }
  },
  "questionFeedback": [
    {
      "questionIndex": <number>,
      "question": "<text>",
      "answer": "<text>",
      "score": <number 0-10>,
      "grade": "<A | B | C | D | F>",
      "whatWentWell": ["<text>", "<text>"],
      "whatToImprove": ["<text>", "<text>"],
      "idealAnswerOutline": "<What a perfect answer would have covered in 2-3 sentences>",
      "detailedFeedback": "<3-4 sentences of specific, actionable coaching feedback>"
    }
  ],
  "overallStrengths": ["<text>", "<text>", "<text>"],
  "overallWeaknesses": ["<text>", "<text>", "<text>"],
  "improvementPlan": [
    {
      "priority": "<High | Medium | Low>",
      "area": "<skill area>",
      "action": "<actionable step>",
      "resource": "<suggested practice method>"
    }
  ],
  "interviewTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "hiringManagerNote": "<What a hiring manager would note about this candidate in 2 sentences>"
}

Make sure the questionFeedback array has exactly ${questions.length} items.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: persona.systemPrompt + ' You are an expert interview coach and hiring manager with 20 years experience. Analyze this complete interview and provide an extremely detailed, actionable evaluation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      });

      const raw = response.choices[0].message.content || '';
      const cleaned = cleanJsonResponse(raw);
      const result: EvaluationResult = JSON.parse(cleaned);

      if (
        typeof result.overallScore !== 'number' ||
        typeof result.executiveSummary !== 'string' ||
        !result.skillsAssessment ||
        !Array.isArray(result.questionFeedback)
      ) {
        throw new Error('AI evaluation response has invalid shape');
      }

      return result;
    } catch (error) {
      if (attempt < 2) {
        logger.warn(`Evaluation failed (attempt ${attempt + 1}), retrying...`, error);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      logger.error('Final evaluation attempt failed', error);
      throw new Error(`Failed to evaluate answers after 3 attempts: ${error}`);
    }
  }
  
  throw new Error('Failed to evaluate answers');
}

/**
 * Generate quick feedback for a single Q&A pair.
 */
export async function generateQuickFeedback(
  question: string,
  answer: string,
  personaId?: string
): Promise<{ score: number; oneLineFeedback: string; topTip: string }> {
  const persona = getPersona(personaId);

  const prompt = `Question: ${question}
Answer: ${answer}

Return ONLY a valid JSON object:
{ "score": <number 1-10>, "oneLineFeedback": "<sentence>", "topTip": "<actionable tip>" }`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: persona.systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 512,
    response_format: { type: 'json_object' }
  });

  const raw = response.choices[0].message.content || '';
  const cleaned = cleanJsonResponse(raw);
  return JSON.parse(cleaned);
}

/**
 * Generate AI coaching recommendations based on recent evaluations.
 */
export async function generateRecommendations(
  evaluationSummaries: string[]
): Promise<string[]> {
  const prompt = `Based on these recent evaluation summaries:
${evaluationSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Provide exactly 3 specific improvement tips. Return ONLY a valid JSON array of 3 strings.`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: 'json_object' }
    });

    const raw = response.choices[0].message.content || '';
    const cleaned = cleanJsonResponse(raw);
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : (parsed.tips || parsed.recommendations || []);
  } catch (err) {
    logger.error('Failed to generate recommendations', err);
    return [
      'Practice structuring answers with STAR method',
      'Focus on quantifying impact in responses',
      'Prepare specific examples for common behavioral questions'
    ];
  }
}
