// PATH: src/api/open-the-box/useCreateOpenTheBox.ts

import axios from "axios";
import toast from "react-hot-toast";

// Type definitions
export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  questionText: string;
  answers: Answer[];
}

export interface Settings {
  isPublishImmediately: boolean;
  scorePerQuestion: number;
}

export interface CreateOpenTheBoxPayload {
  title: string;
  description: string;
  thumbnail: File;
  questions: Question[];
  settings: Settings;
}

// API base URL - sesuaikan dengan backend Anda
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Hook untuk membuat Open The Box game
 * Mengirim data menggunakan FormData untuk support file upload
 */
export const CreateOpenTheBoxApi = async (payload: CreateOpenTheBoxPayload) => {
  try {
    const formData = new FormData();

    // Append thumbnail file
    formData.append("thumbnail", payload.thumbnail);

    // Append game data sebagai JSON string
    const gameData = {
      title: payload.title,
      description: payload.description,
      questions: payload.questions,
      settings: payload.settings,
    };

    formData.append("gameData", JSON.stringify(gameData));

    // Debug log - hapus di production
    console.log("Sending FormData:");
    console.log("- Thumbnail:", payload.thumbnail.name, payload.thumbnail.type);
    console.log("- Game Data:", gameData);

    // Kirim request ke backend
    const response = await axios.post(
      `${API_BASE_URL}/api/open-the-box`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 second timeout
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error creating Open The Box:", error);

    if (axios.isAxiosError(error)) {
      // Handle specific error responses
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 422:
            toast.error(
              data.error || "Invalid data format. Please check all fields.",
            );
            break;
          case 413:
            toast.error("File too large. Please use a smaller image.");
            break;
          case 400:
            toast.error(data.error || "Bad request. Please check your input.");
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          default:
            toast.error(`Error: ${data.error || "Failed to create game"}`);
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to create game. Please try again.");
      }
    } else {
      toast.error("An unexpected error occurred.");
    }

    throw error;
  }
};

// Alternative: Jika ingin gunakan React Hook pattern
// export const useCreateOpenTheBoxMutation = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//
//   const createGame = async (payload: CreateOpenTheBoxPayload) => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const result = await useCreateOpenTheBox(payload);
//       return result;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unknown error");
//       throw err;
//     } finally {
//       setIsLoading(false);
//     }
//   };
//
//   return { createGame, isLoading, error };
// };
