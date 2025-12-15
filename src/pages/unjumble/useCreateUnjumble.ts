import api from "@/api/axios";
import toast from "react-hot-toast";

export interface Sentence {
  sentenceText: string;
  sentenceImage?: File | null;
}

export interface UnjumbleSettings {
  isPublishImmediately: boolean;
  isRandomized: boolean;
  scorePerSentence: number;
}

export interface UnjumblePayload {
  title: string;
  description?: string;
  thumbnail: File;
  sentences: Sentence[];
  settings: UnjumbleSettings;
}

interface UnjumbleSentence {
  sentence_text: string;
  sentence_image_array_index?: number;
}

export const createUnjumble = async (payload: UnjumblePayload) => {
  try {
    const formData = new FormData();

    formData.append("thumbnail_image", payload.thumbnail);
    formData.append("name", payload.title);
    if (payload.description)
      formData.append("description", payload.description);

    formData.append(
      "is_publish_immediately",
      String(payload.settings.isPublishImmediately),
    );
    formData.append("is_randomized", String(payload.settings.isRandomized));
    formData.append(
      "score_per_sentence",
      String(payload.settings.scorePerSentence),
    );

    const sentencesPayload: UnjumbleSentence[] = payload.sentences.map((s) => ({
      sentence_text: s.sentenceText,
    }));

    formData.append("sentences", JSON.stringify(sentencesPayload));

    const res = await api.post("/api/game/game-type/unjumble", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (err: unknown) {
    console.error("Gagal membuat unjumble game:", err);
    // Log detailed error response
    if (err && typeof err === "object" && "response" in err) {
      const axiosError = err as {
        response?: { data?: unknown; status?: number };
      };
      console.error("Error Response:", axiosError.response?.data);
      console.error("Error Status:", axiosError.response?.status);
    }
    toast.error("Gagal membuat unjumble game. Silakan coba lagi.");
    throw err;
  }
};
