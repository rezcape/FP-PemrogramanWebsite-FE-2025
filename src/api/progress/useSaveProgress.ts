// File: src/api/progress/useSaveProgress.ts
import { useState } from "react";
import api from "@/api/axios";

export type SaveProgressRequest = {
  userId?: string | null;
  puzzleId: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  correctAnswers: number;
  wrongAttempts: number;
  hintUsed: number;
  // FIX: Ganti 'any' menjadi 'unknown'
  meta?: Record<string, unknown> | null;
};

export const useSaveProgress = () => {
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  const mutateAsync = async (payload: SaveProgressRequest) => {
    setStatus("pending");
    try {
      // Pastikan endpoint ini nanti dibuat di backend, atau sesuaikan jika sudah ada
      const res = await api.post("/api/game/progress", payload);
      setStatus("success");
      return res.data;
    } catch (error) {
      console.error("Failed to save progress:", error);
      setStatus("error");
      throw error;
    }
  };

  return {
    mutateAsync,
    isPending: status === "pending",
    isError: status === "error",
    isSuccess: status === "success",
  };
};
