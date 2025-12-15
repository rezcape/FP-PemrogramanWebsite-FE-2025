import { z } from "zod";

export const trueOrFalseQuestionSchema = z.object({
  questionText: z.string().min(3, "Question text too short"),
  questionImage: z.union([z.instanceof(File), z.string(), z.null()]),
  correctAnswer: z.string().min(1, "Correct answer is required"),
});

export const trueOrFalseSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().min(3, "Description too short"),
  thumbnail: z.union([z.instanceof(File), z.string(), z.null()]).optional(),
  choices: z
    .array(z.string().min(1, "Choice cannot be empty"))
    .length(2, "Must have exactly 2 choices"),
  questions: z
    .array(trueOrFalseQuestionSchema)
    .min(1, "At least one question required")
    .max(10, "Maximum 10 questions allowed"),
  countdown: z.coerce.number().min(5, "Countdown must be at least 5 seconds"),
});

export type TrueOrFalseForm = z.infer<typeof trueOrFalseSchema>;
