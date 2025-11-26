export type GameStatus = 'menu' | 'loading' | 'playing' | 'paused' | 'gameover' | 'victory';
export type GameMode = 'math' | 'general';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {}

export interface Cloud extends Entity {
  id: string;
  text: string;
  isCorrect: boolean;
  speed: number;
}

export interface GeneralQuestion {
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

export interface GameDataResponse {
  questions: GeneralQuestion[];
  gameSettings?: { speed: string };
}