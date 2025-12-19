// File: src/store/useCrosswordProgress.ts
import { create } from "zustand";

interface CrosswordProgressState {
  puzzleId: string | null;
  startTime: number | null;
  endTime: number | null;
  correctAnswers: number;
  wrongAttempts: number;
  hintUsed: number;
  // FIX 1: Ganti any jadi unknown
  meta: Record<string, unknown> | null;

  // FIX 2: Ganti any jadi unknown
  startGame: (puzzleId: string, meta?: Record<string, unknown>) => void;
  submitCorrect: () => void;
  submitWrong: () => void;
  useHint: () => void;
  finishGame: () => void;
  reset: () => void;
  getDurationMs: () => number;

  toPayload: (userId: string | null) => {
    userId: string | null;
    puzzleId: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    correctAnswers: number;
    wrongAttempts: number;
    hintUsed: number;
    // FIX 3: Ganti any jadi unknown
    meta: Record<string, unknown> | null;
  } | null;
}

export const useCrosswordProgress = create<CrosswordProgressState>(
  (set, get) => ({
    puzzleId: null,
    startTime: null,
    endTime: null,
    correctAnswers: 0,
    wrongAttempts: 0,
    hintUsed: 0,
    meta: null,

    startGame: (puzzleId, meta = undefined) => {
      set({
        puzzleId,
        startTime: Date.now(),
        endTime: null,
        correctAnswers: 0,
        wrongAttempts: 0,
        hintUsed: 0,
        meta,
      });
    },

    submitCorrect: () =>
      set((state) => ({ correctAnswers: state.correctAnswers + 1 })),
    submitWrong: () =>
      set((state) => ({ wrongAttempts: state.wrongAttempts + 1 })),
    useHint: () => set((state) => ({ hintUsed: state.hintUsed + 1 })),

    finishGame: () => {
      if (get().endTime === null) {
        set({ endTime: Date.now() });
      }
    },

    reset: () => {
      set({
        puzzleId: null,
        startTime: null,
        endTime: null,
        correctAnswers: 0,
        wrongAttempts: 0,
        hintUsed: 0,
        meta: null,
      });
    },

    getDurationMs: () => {
      const { startTime, endTime } = get();
      if (!startTime) return 0;
      const end = endTime || Date.now();
      return end - startTime;
    },

    toPayload: (userId) => {
      const state = get();
      if (!state.puzzleId || !state.startTime) return null;

      const endTime = state.endTime || Date.now();

      return {
        userId: userId || null,
        puzzleId: state.puzzleId,
        startTime: state.startTime,
        endTime: endTime,
        durationMs: endTime - state.startTime,
        correctAnswers: state.correctAnswers,
        wrongAttempts: state.wrongAttempts,
        hintUsed: state.hintUsed,
        meta: state.meta,
      };
    },
  }),
);
