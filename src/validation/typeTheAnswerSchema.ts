import { z } from "zod";

// Validasi untuk setiap question
export const typeTheAnswerQuestionSchema = z.object({
  questionText: z
    .string()
    .min(3, "Question text must be at least 3 characters")
    .max(300, "Question text cannot exceed 300 characters"),
  correctAnswer: z
    .string()
    .min(1, "Answer cannot be empty")
    .max(50, "Answer cannot exceed 50 characters"),
});

// Validasi untuk keseluruhan form
export const typeTheAnswerSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thumbnail: z.instanceof(File, { message: "Thumbnail image is required" }),
  backgroundImage: z.instanceof(File).optional().nullable(),
  questions: z
    .array(typeTheAnswerQuestionSchema)
    .min(1, "At least one question is required"),
  settings: z.object({
    isPublishImmediately: z.boolean(),
    timeLimitSeconds: z
      .number()
      .min(30, "Time limit must be at least 30 seconds")
      .max(600, "Time limit cannot exceed 10 minutes"),
    scorePerQuestion: z.number().min(1, "Score must be at least 1"),
  }),
});

export type TypeTheAnswerForm = z.infer<typeof typeTheAnswerSchema>;
