import api from "@/api/axios";
import toast from "react-hot-toast";

// ==================== TYPES ====================

export interface MazeChaseAnswer {
  answerText: string;
  isCorrect: boolean;
}

export interface MazeChaseQuestion {
  questionText: string;
  answers: MazeChaseAnswer[];
}

export interface MazeChasePayload {
  name: string;
  description: string;
  thumbnailImage: File;
  mapId: string;
  countdown: number;
  scorePerQuestion: number;
  isPublishImmediately?: boolean;
  isQuestionRandomized?: boolean;
  isAnswerRandomized?: boolean;
  questions: MazeChaseQuestion[];
}

interface CreateMazeChaseQuestion {
  question_text: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
}

interface CreateMazeChaseResponse {
  success: boolean;
  statusCode: number;
  data: {
    id: string;
  };
}

export interface GameAnswer {
  answerText: string;
  answerIndex: number;
}

export interface GameQuestion {
  questionIndex: number;
  questionText: string;
  answers: GameAnswer[];
}

export interface MazeChaseGameData {
  id: string;
  name: string;
  description: string;
  thumbnailImage: string;
  mapId: string;
  countdown: number;
  scorePerQuestion: number;
  isPublishImmediately: boolean;
  isQuestionRandomized: boolean;
  isAnswerRandomized: boolean;
  questions: GameQuestion[];
}

interface GetMazeChaseResponse {
  success: boolean;
  statusCode: number;
  data: MazeChaseGameData;
}

export interface UserAnswer {
  questionIndex: number;
  selectedAnswerIndex: number;
}

export interface AnswerResult {
  questionIndex: number;
  questionText: string;
  selectedAnswerIndex: number;
  selectedAnswerText: string;
  correctAnswerIndex: number;
  correctAnswerText: string;
  isCorrect: boolean;
}

export interface CheckAnswerResponse {
  success: boolean;
  statusCode: number;
  data: {
    gameId: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    percentage: number;
    results: AnswerResult[];
  };
}

export interface CheckAnswerPayload {
  gameId: string;
  answers: UserAnswer[];
}

// ==================== CREATE MAZE CHASE ====================

/**
 * Create a new Maze Chase game
 * Handles multipart/form-data with file upload for thumbnail
 * Parses questions JSON and validates structure
 */
export const useCreateMazeChase = async (
  payload: MazeChasePayload,
): Promise<CreateMazeChaseResponse> => {
  try {
    // Validate required fields
    if (!payload.name || payload.name.length > 128) {
      throw new Error("Name is required and must be max 128 characters");
    }
    if (!payload.description || payload.description.length > 256) {
      throw new Error("Description is required and must be max 256 characters");
    }
    if (!payload.mapId || payload.mapId.length > 128) {
      throw new Error("Map ID is required and must be max 128 characters");
    }
    if (payload.countdown < 0 || payload.countdown > 60) {
      throw new Error("Countdown must be between 0 and 60 minutes");
    }
    if (payload.scorePerQuestion < 1 || payload.scorePerQuestion > 1000) {
      throw new Error("Score per question must be between 1 and 1000");
    }
    if (payload.questions.length < 1 || payload.questions.length > 20) {
      throw new Error("Questions must have between 1 and 20 items");
    }

    // Validate questions structure
    payload.questions.forEach((q, idx) => {
      if (!q.questionText) {
        throw new Error(`Question ${idx + 1}: question_text is required`);
      }
      if (!q.answers || !Array.isArray(q.answers) || q.answers.length === 0) {
        throw new Error(`Question ${idx + 1}: answers array is required`);
      }
      if (!q.answers.some((a) => a.isCorrect)) {
        throw new Error(
          `Question ${idx + 1}: at least one answer must be correct`,
        );
      }
      q.answers.forEach((a, aIdx) => {
        if (!a.answerText) {
          throw new Error(
            `Question ${idx + 1}, Answer ${aIdx + 1}: answer_text is required`,
          );
        }
      });
    });

    // Prepare FormData
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("description", payload.description);
    formData.append("thumbnail_image", payload.thumbnailImage);
    formData.append("map_id", payload.mapId);
    formData.append("countdown", String(payload.countdown));
    formData.append("score_per_question", String(payload.scorePerQuestion));
    formData.append(
      "is_publish_immediately",
      String(payload.isPublishImmediately ?? false),
    );
    formData.append(
      "is_question_randomized",
      String(payload.isQuestionRandomized ?? false),
    );
    formData.append(
      "is_answer_randomized",
      String(payload.isAnswerRandomized ?? false),
    );

    // Prepare and validate questions
    const questionsPayload: CreateMazeChaseQuestion[] = payload.questions.map(
      (q) => ({
        question_text: q.questionText,
        answers: q.answers.map((a) => ({
          answer_text: a.answerText,
          is_correct: a.isCorrect,
        })),
      }),
    );

    formData.append("questions", JSON.stringify(questionsPayload));

    const res = await api.post<CreateMazeChaseResponse>(
      "/api/game/game-type/maze-chase",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return res.data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to create Maze Chase game";
    console.error("Gagal membuat Maze Chase:", err);
    toast.error(errorMessage);
    throw err;
  }
};

// ==================== DELETE MAZE CHASE ====================

/**
 * Delete a Maze Chase game by ID
 * Only admin can delete
 */
export const useDeleteMazeChase = async (
  gameId: string,
): Promise<{ id: string }> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const res = await api.delete<{
      success: boolean;
      statusCode: number;
      data: { id: string };
    }>(`/api/game/game-type/maze-chase/${gameId}`);

    return res.data.data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to delete Maze Chase game";
    console.error("Gagal menghapus Maze Chase:", err);
    toast.error(errorMessage);
    throw err;
  }
};

// ==================== GET ADMIN DETAIL ====================

/**
 * Get full Maze Chase game data for admin
 * Includes correct answers for editing purposes
 */
export const useGetMazeChaseAdmin = async (
  gameId: string,
): Promise<MazeChaseGameData> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const res = await api.get<GetMazeChaseResponse>(
      `/api/game/game-type/maze-chase/${gameId}`,
    );

    return res.data.data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch Maze Chase game";
    console.error("Failed to fetch Maze Chase game:", err);
    toast.error(errorMessage);
    throw err;
  }
};

// ==================== UPDATE MAZE CHASE ====================

/**
 * Update a Maze Chase game
 * All fields are optional - only provided fields will be updated
 */
export const useUpdateMazeChase = async (
  gameId: string,
  updates: Partial<MazeChasePayload>,
): Promise<MazeChaseGameData> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    // Validate provided fields
    if (
      updates.name !== undefined &&
      (typeof updates.name !== "string" || updates.name.length > 128)
    ) {
      throw new Error("Name must be max 128 characters");
    }
    if (
      updates.description !== undefined &&
      (typeof updates.description !== "string" ||
        updates.description.length > 256)
    ) {
      throw new Error("Description must be max 256 characters");
    }
    if (
      updates.mapId !== undefined &&
      (typeof updates.mapId !== "string" || updates.mapId.length > 128)
    ) {
      throw new Error("Map ID must be max 128 characters");
    }
    if (
      updates.countdown !== undefined &&
      (updates.countdown < 0 || updates.countdown > 60)
    ) {
      throw new Error("Countdown must be between 0 and 60 minutes");
    }
    if (
      updates.scorePerQuestion !== undefined &&
      (updates.scorePerQuestion < 1 || updates.scorePerQuestion > 1000)
    ) {
      throw new Error("Score per question must be between 1 and 1000");
    }
    if (updates.questions) {
      if (updates.questions.length < 1 || updates.questions.length > 20) {
        throw new Error("Questions must have between 1 and 20 items");
      }
      updates.questions.forEach((q, idx) => {
        if (!q.questionText) {
          throw new Error(`Question ${idx + 1}: question_text is required`);
        }
        if (!q.answers || !Array.isArray(q.answers) || q.answers.length === 0) {
          throw new Error(`Question ${idx + 1}: answers array is required`);
        }
        if (!q.answers.some((a) => a.isCorrect)) {
          throw new Error(
            `Question ${idx + 1}: at least one answer must be correct`,
          );
        }
      });
    }

    // Prepare FormData
    const formData = new FormData();

    if (updates.name) formData.append("name", updates.name);
    if (updates.description)
      formData.append("description", updates.description);
    if (updates.thumbnailImage)
      formData.append("thumbnail_image", updates.thumbnailImage);
    if (updates.mapId) formData.append("map_id", updates.mapId);
    if (updates.countdown !== undefined)
      formData.append("countdown", String(updates.countdown));
    if (updates.scorePerQuestion !== undefined)
      formData.append("score_per_question", String(updates.scorePerQuestion));
    if (updates.isPublishImmediately !== undefined)
      formData.append(
        "is_publish_immediately",
        String(updates.isPublishImmediately),
      );
    if (updates.isQuestionRandomized !== undefined)
      formData.append(
        "is_question_randomized",
        String(updates.isQuestionRandomized),
      );
    if (updates.isAnswerRandomized !== undefined)
      formData.append(
        "is_answer_randomized",
        String(updates.isAnswerRandomized),
      );

    // Prepare questions if provided
    if (updates.questions) {
      const questionsPayload: CreateMazeChaseQuestion[] = updates.questions.map(
        (q) => ({
          question_text: q.questionText,
          answers: q.answers.map((a) => ({
            answer_text: a.answerText,
            is_correct: a.isCorrect,
          })),
        }),
      );
      formData.append("questions", JSON.stringify(questionsPayload));
    }

    const res = await api.patch<GetMazeChaseResponse>(
      `/api/game/game-type/maze-chase/${gameId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return res.data.data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update Maze Chase game";
    console.error("Gagal memperbarui Maze Chase:", err);
    toast.error(errorMessage);
    throw err;
  }
};

// ==================== GET MAZE CHASE (PUBLIC & PRIVATE) ====================

/**
 * Get Maze Chase game data for public play
 * Removes is_correct field from answers to prevent cheating
 * Adds question_index and answer_index for client-side tracking
 */
export const useGetMazeChasePublic = async (
  gameId: string,
): Promise<GetMazeChaseResponse> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const res = await api.get<GetMazeChaseResponse>(
      `/api/game/game-type/maze-chase/${gameId}`,
    );

    return res.data;
  } catch (err: unknown) {
    console.error("Failed to fetch Maze Chase game:", err);
    throw err;
  }
};

/**
 * Get Maze Chase game data for private/authenticated play
 * Same as public version but requires authentication
 * Removes is_correct field from answers to prevent cheating
 * Adds question_index and answer_index for client-side tracking
 */
export const useGetMazeChasePrivate = async (
  gameId: string,
): Promise<GetMazeChaseResponse> => {
  try {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const res = await api.get<GetMazeChaseResponse>(
      `/api/game/game-type/maze-chase/private/${gameId}`,
    );

    return res.data;
  } catch (err: unknown) {
    console.error("Failed to fetch Maze Chase game:", err);
    throw err;
  }
};

// ==================== CHECK ANSWER ====================

/**
 * Submit and check Maze Chase game answers
 * Compares user answers with correct answers from database
 * Calculates score, percentage, and detailed results
 */
export const useCheckMazeChaseAnswer = async (
  payload: CheckAnswerPayload,
): Promise<CheckAnswerResponse> => {
  try {
    // Validate input
    if (!payload.gameId) {
      throw new Error("Game ID is required");
    }
    if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
      throw new Error("Answers array is required and must not be empty");
    }

    // Validate each answer
    payload.answers.forEach((answer, idx) => {
      if (answer.questionIndex === undefined || answer.questionIndex === null) {
        throw new Error(`Answer ${idx + 1}: questionIndex is required`);
      }
      if (
        answer.selectedAnswerIndex === undefined ||
        answer.selectedAnswerIndex === null
      ) {
        throw new Error(`Answer ${idx + 1}: selectedAnswerIndex is required`);
      }
    });

    const res = await api.post<CheckAnswerResponse>(
      `/api/game/game-type/maze-chase/${payload.gameId}/check-answer`,
      { answers: payload.answers },
    );

    return res.data;
  } catch (err: unknown) {
    console.error("Failed to check Maze Chase answers:", err);
    throw err;
  }
};
