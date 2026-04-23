import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface Question {
  question: string;
  passage?: string;
  topic: string;
  options: string[];
  answer: string;
  explanation: string;
}

export async function generateFootballQuestion(subject: 'maths' | 'english', level: 'easy' | 'medium' | 'hard'): Promise<Question> {
  const levelDesc = {
    easy: 'Beginner (basic arithmetic for maths, simple comprehension for English)',
    medium: 'Intermediate (percentages/fractions for maths, vocabulary/inference for English)',
    hard: 'Advanced (complex word problems/budgeting for maths, deep inference/tone for English)'
  }[level];

  const subjectPrompt = subject === 'maths' 
    ? "Generate a football-themed Maths question. Focus on scores, stats, player transfers, or pitch dimensions."
    : "Generate a football-themed English question. Provide a short match report passage (2-3 sentences) then a reading comprehension or vocabulary question based on it.";

  const prompt = `You are an educational AI. ${subjectPrompt}
  Difficulty level: ${levelDesc}.
  The target audience is school students.
  
  Return a JSON object conforming to the schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          passage: { type: Type.STRING, description: "Only for English, a short text context." },
          topic: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Exactly 4 options."
          },
          answer: { type: Type.STRING, description: "Must match one of the options exactly." },
          explanation: { type: Type.STRING }
        },
        required: ["question", "topic", "options", "answer", "explanation"]
      }
    }
  });

  const question = JSON.parse(response.text) as Question;
  return question;
}
