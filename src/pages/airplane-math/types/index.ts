export type GameStatus = 'playing' | 'paused' | 'gameover';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  // Player specific properties can be added here
  // Currently just inherits position and size
}

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
  score: number;
  lives: number;
  currentQuestion: MathQuestion | null;
  player: Player;
  clouds: Cloud[];
}
