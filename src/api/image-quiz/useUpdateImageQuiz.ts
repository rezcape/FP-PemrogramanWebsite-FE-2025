import api from "@/api/axios";
import toast from "react-hot-toast";

interface Answer {
  answer_id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  question_id: string;
  questionText?: string;
  questionImages: File | string | null;
  answers: Answer[];
  correct_answer_id: string;
}

interface Settings {
  isPublishImmediately: boolean;
  isQuestionRandomized: boolean;
  isAnswerRandomized: boolean;
  theme?: string; // [PENTING] Pastikan ini ada
}

export interface ImageQuizUpdatePayload {
  game_id: string;
  title?: string;
  description?: string;
  thumbnail?: File;
  questions?: Question[];
  settings?: Settings;
  is_publish?: boolean;
}

interface QuestionPayload {
  question_id: string;
  question_text?: string;
  answers: {
    answer_id: string;
    answer_text: string;
  }[];
  correct_answer_id: string;
  question_image_array_index?: number | string;
}

export const updateImageQuiz = async (payload: ImageQuizUpdatePayload) => {
  try {
    const formData = new FormData();

    // 1. Append Data Dasar
    if (payload.thumbnail instanceof File) {
      formData.append("thumbnail_image", payload.thumbnail);
    }
    if (payload.title) {
      formData.append("name", payload.title);
    }
    if (payload.description) {
      formData.append("description", payload.description);
    }

    // 2. Append Settings
    // Menangani logika publish dari parameter langsung atau settings
    const isPublish =
      payload.is_publish ?? payload.settings?.isPublishImmediately;

    if (isPublish !== undefined) {
      formData.append("is_publish_immediately", String(isPublish));
    }

    if (payload.settings?.isQuestionRandomized !== undefined) {
      formData.append(
        "is_question_randomized",
        String(payload.settings.isQuestionRandomized),
      );
    }

    if (payload.settings?.isAnswerRandomized !== undefined) {
      formData.append(
        "is_answer_randomized",
        String(payload.settings.isAnswerRandomized),
      );
    }

    // [PENTING] Kirim Theme ke Backend
    // Menggunakan payload.settings.theme, jika kosong fallback ke 'family100'
    const themeToSend = payload.settings?.theme || "family100";
    formData.append("theme", themeToSend);

    // 3. Handle Questions & Images
    if (payload.questions) {
      const filesToUpload: File[] = [];
      const questionImageFileIndex: (number | string | undefined)[] = new Array(
        payload.questions.length,
      );

      payload.questions.forEach((q, qi) => {
        if (q.questionImages instanceof File) {
          // Kasus A: User upload gambar baru -> Simpan ke array filesToUpload
          questionImageFileIndex[qi] = filesToUpload.length;
          filesToUpload.push(q.questionImages);
        } else if (typeof q.questionImages === "string") {
          // Kasus B: User pakai gambar lama -> Bersihkan URL agar relatif
          const base = import.meta.env.VITE_API_URL ?? "";
          let relative = q.questionImages;
          // Hapus base URL jika ada, agar yang dikirim hanya path relatif (misal: uploads/img.jpg)
          if (base && relative.startsWith(base)) {
            relative = relative.replace(base + "/", "");
            if (relative.startsWith("/")) relative = relative.substring(1);
          }
          questionImageFileIndex[qi] = relative;
        } else {
          // Kasus C: Tidak ada gambar
          questionImageFileIndex[qi] = undefined;
        }
      });

      // Masukkan semua file baru ke FormData
      filesToUpload.forEach((f) => {
        formData.append("files_to_upload", f);
      });

      // Susun JSON Questions
      const questionsPayload: QuestionPayload[] = payload.questions.map(
        (q, qi) => {
          const qPayload: QuestionPayload = {
            question_id: q.question_id,
            question_text: q.questionText,
            answers: q.answers.map((a) => ({
              answer_id: a.answer_id,
              answer_text: a.text,
            })),
            correct_answer_id: q.correct_answer_id,
          };

          // Masukkan referensi gambar (bisa berupa index angka atau string path)
          const idx = questionImageFileIndex[qi];
          if (idx !== undefined) {
            qPayload.question_image_array_index = idx as number | string;
          }
          return qPayload;
        },
      );

      formData.append("questions", JSON.stringify(questionsPayload));
    }

    // [FIX UTAMA]
    // 1. Gunakan 'api.patch' (bukan put) agar sesuai route backend Anda.
    // 2. JANGAN pakai headers manual 'Content-Type'. Biarkan Axios mengaturnya.
    const res = await api.patch(
      `/api/game/game-type/image-quiz/${payload.game_id}`,
      formData,
    );

    return res.data;
  } catch (err: unknown) {
    console.error("Failed to update image quiz:", err);
    toast.error("Failed to update image quiz. Please try again.");
    throw err;
  }
};
