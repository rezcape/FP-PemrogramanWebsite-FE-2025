import { z } from "zod";

export const answerSchema = z.object({
  answer_id: z.string().uuid(),
  text: z.string().min(1, "Answer cannot be empty"),
  isCorrect: z.boolean(),
});

export const imageQuestionSchema = z.object({
  question_id: z.string().uuid(),
  questionText: z.string().min(1, "Category is required"),
  questionImages: z.instanceof(File, {
    message: "Image is required for Image Quiz",
  }),
  correct_answer_id: z.string().uuid(),
  answers: z
    .array(answerSchema)
    .length(3, "Each question must have 3 answers")
    .refine(
      (answers) => answers.some((a) => a.isCorrect),
      "At least one answer must be correct on each question",
    ),
});

export const imageQuizSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().optional(),
  thumbnail: z.instanceof(File, { message: "Thumbnail is required" }),
  questions: z.array(imageQuestionSchema).min(1, "At least one round required"),
  settings: z.object({
    isPublishImmediately: z.boolean(),
    isQuestionRandomized: z.boolean(),
    isAnswerRandomized: z.boolean(),
    theme: z.enum(["adventure", "family100", "cyberpunk"]).default("family100"),
    // scorePerQuestion dihapus karena backend yang mengatur
  }),
});

export type ImageQuizForm = z.infer<typeof imageQuizSchema>;
