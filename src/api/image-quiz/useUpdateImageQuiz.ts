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
  questionImages: File | string | null; // File for new upload, string for existing URL
  answers: Answer[];
  correct_answer_id: string;
}

interface Settings {
  isPublishImmediately: boolean; // For update, this becomes is_publish
  isQuestionRandomized: boolean;
  isAnswerRandomized: boolean;
}

export interface ImageQuizUpdatePayload {
  game_id: string;
  title?: string;
  description?: string;
  thumbnail?: File;
  questions?: Question[];
  settings?: Settings;
  is_publish?: boolean; // Directly set publish status
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

    if (payload.thumbnail) {
      formData.append("thumbnail_image", payload.thumbnail);
    }
    if (payload.title) {
      formData.append("name", payload.title);
    }
    if (payload.description) {
      formData.append("description", payload.description);
    }

    // Use is_publish directly, if provided, otherwise check settings
    const isPublish =
      payload.is_publish ?? payload.settings?.isPublishImmediately;
    if (isPublish !== undefined) {
      formData.append("is_publish", String(isPublish));
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

    if (payload.questions) {
      const filesToUpload: File[] = [];
      const questionImageFileIndex: (number | string | undefined)[] = new Array(
        payload.questions.length,
      );

      payload.questions.forEach((q, qi) => {
        if (q.questionImages instanceof File) {
          questionImageFileIndex[qi] = filesToUpload.length;
          filesToUpload.push(q.questionImages);
        } else if (typeof q.questionImages === "string") {
          const base = import.meta.env.VITE_API_URL ?? "";
          let relative = q.questionImages;
          if (base && relative.startsWith(base)) {
            relative = relative.replace(base + "/", "");
            if (relative.startsWith("/")) relative = relative.substring(1);
          }
          questionImageFileIndex[qi] = relative;
        } else {
          questionImageFileIndex[qi] = undefined;
        }
      });

      filesToUpload.forEach((f) => {
        formData.append("files_to_upload", f);
      });

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
          const idx = questionImageFileIndex[qi];
          if (idx !== undefined) {
            qPayload.question_image_array_index = idx as number | string;
          }
          return qPayload;
        },
      );

      formData.append("questions", JSON.stringify(questionsPayload));
    }

    const res = await api.patch(
      `/api/game/game-type/image-quiz/${payload.game_id}`,
      formData,
      {
        // Changed endpoint
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return res.data;
  } catch (err: unknown) {
    console.error("Failed to update image quiz:", err);
    toast.error("Failed to update image quiz. Please try again.");
    throw err;
  }
};
