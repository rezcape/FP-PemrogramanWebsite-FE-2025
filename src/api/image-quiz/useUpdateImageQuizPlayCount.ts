import api from "@/api/axios";
import toast from "react-hot-toast";

export const updateImageQuizPlayCount = async (game_id: string) => {
  try {
    const res = await api.post("/api/game/play-count", { game_id });
    return res.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Failed to update image quiz play count:", err);
    toast.error(err.response?.data?.message || "Failed to update play count.");
    throw err;
  }
};
