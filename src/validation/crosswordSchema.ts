// src/validation/crosswordSchema.ts
import { z } from "zod";

export const crosswordItemSchema = z.object({
  word: z
    .string()
    .min(2, "Word must be at least 2 characters")
    .regex(/^[a-zA-Z]+$/, "Only letters allowed"),
  clue: z.string().min(3, "Clue must be at least 3 characters"),
});

export const crosswordSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thumbnail: z
    .union([z.instanceof(File), z.string(), z.null()])
    .refine((val) => val !== null, {
      message: "Thumbnail is required",
    }),
  items: z
    .array(crosswordItemSchema)
    .min(5, "Minimum 5 words required for a good crossword"),
  settings: z.object({
    isPublishImmediately: z.boolean(),
    timeLimit: z.number().min(60, "Minimum 60 seconds").optional(), // Opsional jika ada timer mundur
  }),
});

export type CrosswordForm = z.infer<typeof crosswordSchema>;
