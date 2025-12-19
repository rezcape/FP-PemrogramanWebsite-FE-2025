export type GameStatus = "menu" | "playing" | "paused" | "gameover";

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Player = Entity;

export interface Cloud extends Entity {
  id: string;
  value: number;
  isCorrect: boolean;
  speed: number;
}

export interface MathQuestion {
  question: string;
  answer: number;
}

export interface GameState {
  status: GameStatus;
  gameMode?: "math" | "general";
  score: number;
  lives: number;
  currentQuestion: MathQuestion | null;
  player: Player;
  clouds: Cloud[];
}
