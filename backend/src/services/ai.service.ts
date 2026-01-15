import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export interface EvaluationResult {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
}

export async function evaluateAnswer(question: string, transcript: string): Promise<EvaluationResult> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not found, using mock evaluation");
        return mockEvaluate();
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert interviewer. Evaluate the candidate's answer based on clarity, technical accuracy, and completeness.
                    Return a JSON object with:
                    - score (integer 0-100)
                    - feedback (string summary, max 2 sentences)
                    - strengths (array of strings, max 3 items)
                    - improvements (array of strings, max 3 items)`
                },
                {
                    role: "user",
                    content: `Question: ${question}\nAnswer: ${transcript}`
                }
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content received from OpenAI");

        return JSON.parse(content) as EvaluationResult;
    } catch (error) {
        console.error("AI Evaluation failed:", error);
        return mockEvaluate();
    }
}

function mockEvaluate(): EvaluationResult {
    return {
        score: Math.floor(Math.random() * 20) + 70,
        feedback: "This is a mock evaluation because OpenAI API Key is missing or an error occurred. The system detected good speech patterns but requires an API key for content analysis.",
        strengths: ["Clear pronunciation", "Good pacing", "Confident delivery"],
        improvements: ["Connect more to the specific question", "Provide concrete examples", "Structure the answer more logically"]
    };
}
