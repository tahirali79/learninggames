export interface GameState {
  xp: number;
  soloStats: {
    correct: number;
    total: number;
    streak: number;
    bestStreak: number;
  };
  players: {
    p1: { name: string; xp: number; wins: number; correct: number };
    p2: { name: string; xp: number; wins: number; correct: number };
  };
  totalMatches: number;
  totalQuestions: number;
}

export type Subject = "maths" | "english";
export type Difficulty = "easy" | "medium" | "hard";
export type Screen = "home" | "solo" | "versus" | "stats";

export interface Question {
  question: string;
  passage?: string;
  topic: string;
  options: string[];
  answer: string;
  explanation: string;
}
