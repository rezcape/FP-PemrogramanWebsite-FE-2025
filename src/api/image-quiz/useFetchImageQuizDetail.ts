import api from "@/api/axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

interface Answer {
  answer_id: string;
  text: string;
  isCorrect: boolean;
}

type MaybeFileOrUrl = File | string | null;

export interface Question {
  question_id: string;
  questionText: string;
  questionImages: MaybeFileOrUrl;
  answers: Answer[];
  correct_answer_id: string;
}

export interface ImageQuizDetail {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  is_published: boolean;
  game_json?: {
    is_question_randomized: boolean;
    is_answer_randomized: boolean;
    questions: Question[];
  };
}

export const useFetchImageQuizDetail = (game_id: string | undefined) => {
  const [data, setData] = useState<ImageQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!game_id) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/image-quiz/${game_id}`,
        );
        const apiData = response.data.data;

        // Map API response to frontend Question interface

        const mappedQuestions = (apiData.game_json?.questions || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => ({
            question_id: q.question_id || uuidv4(),
            questionText: q.question_text || "",
            questionImages: q.question_image_url
              ? q.question_image_url.startsWith("http")
                ? q.question_image_url
                : `${import.meta.env.VITE_API_URL}/${q.question_image_url}`
              : null,
            correct_answer_id: q.correct_answer_id || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            answers: (q.answers || []).map((a: any) => ({
              answer_id: a.answer_id || uuidv4(),
              text: a.answer_text ?? "",
              isCorrect: a.answer_id === q.correct_answer_id,
            })),
          }),
        );

        // Normalize answers to 3
        const normalizedQuestions = mappedQuestions.map((q: Question) => {
          const arr = q.answers.slice(0, 3);
          while (arr.length < 3)
            arr.push({ answer_id: uuidv4(), text: "", isCorrect: false });
          return { ...q, answers: arr };
        });

        setData({
          ...apiData,
          game_json: {
            ...apiData.game_json,
            questions: normalizedQuestions,
          },
        });
      } catch (err) {
        setError("Failed to load image quiz details.");
        toast.error("Failed to load image quiz details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [game_id]);

  return { data, loading, error };
};
