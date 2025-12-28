import api from "@/api/axios";

// Interface Definitions
interface Answer {
  answer_id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  question_id: string;
  questionText?: string;
  questionImages?: File | null;
  answers: Answer[];
  correct_answer_id: string;
}

// Interface Settings (Pastikan ada theme)
interface Settings {
  isPublishImmediately: boolean;
  isQuestionRandomized: boolean;
  isAnswerRandomized: boolean;
  theme?: string;
}

export interface ImageQuizPayload {
  title: string;
  description?: string;
  thumbnail: File;
  questions: Question[];
  settings: Settings;
}

export const createImageQuiz = async (payload: ImageQuizPayload) => {
  try {
    const formData = new FormData();

    // 1. Append Data Utama
    formData.append("thumbnail_image", payload.thumbnail);
    formData.append("name", payload.title);
    if (payload.description) {
      formData.append("description", payload.description);
    }

    // 2. Append Settings
    formData.append(
      "is_publish_immediately",
      String(payload.settings.isPublishImmediately),
    );
    formData.append(
      "is_question_randomized",
      String(payload.settings.isQuestionRandomized),
    );
    formData.append(
      "is_answer_randomized",
      String(payload.settings.isAnswerRandomized),
    );

    // [PENTING] Kirim theme di root (bukan di dalam settings JSON)
    formData.append("theme", payload.settings.theme || "family100");

    // 3. Append Files Gambar Pertanyaan
    const allFiles: File[] = [];
    payload.questions.forEach((q) => {
      if (q.questionImages) {
        allFiles.push(q.questionImages);
      }
    });

    // Masukkan semua file gambar soal ke formData
    allFiles.forEach((file) => formData.append("files_to_upload", file));

    // 4. Append Data JSON Pertanyaan
    const questionsPayload = payload.questions.map((q) => ({
      question_id: q.question_id,
      question_text: q.questionText,
      correct_answer_id: q.correct_answer_id,
      answers: q.answers.map((a) => ({
        answer_id: a.answer_id,
        answer_text: a.text,
      })),
      // Logic untuk menentukan index gambar di array files_to_upload
      question_image_array_index: q.questionImages
        ? allFiles.indexOf(q.questionImages)
        : undefined,
    }));

    formData.append("questions", JSON.stringify(questionsPayload));

    // [KUNCI PERBAIKAN DISINI]
    // JANGAN ADA 'headers: { ... }'. Biarkan kosong.
    // Axios akan otomatis membuat boundary multipart yang benar.
    const res = await api.post("/api/game/game-type/image-quiz", formData);

    return res.data;
  } catch (err: unknown) {
    console.error("Failed to create image quiz:", err);
    // Kita lempar error agar toast di komponen UI bisa menangkapnya (opsional, karena di sini sudah ada toast juga)
    throw err;
  }
};
