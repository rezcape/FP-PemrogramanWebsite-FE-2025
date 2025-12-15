import { z } from "zod";

export const typeSpeedTextSchema = z.object({
  content: z
    .string()
    .min(10, "Text must be at least 10 characters")
    .max(8000, "Text must be at most 8000 characters")
    .trim(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const typeSpeedSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(128, "Title must be at most 128 characters")
    .trim(),
  description: z
    .string()
    .max(256, "Description must be at most 256 characters")
    .trim()
    .optional(),
  thumbnail: z
    .instanceof(File, { message: "Thumbnail is required" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Thumbnail must be less than 5MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type,
        ),
      {
        message: "Only .jpg, .jpeg, .png and .webp formats are supported",
      },
    ),
  timeLimit: z
    .number()
    .min(30, "Time limit must be at least 30 seconds")
    .max(300, "Time limit must be at most 300 seconds"),
  texts: z
    .array(typeSpeedTextSchema)
    .min(3, "At least 3 texts are required")
    .max(20, "Maximum 20 texts allowed"),
  settings: z.object({
    isPublishImmediately: z.boolean(),
  }),
});

export type ITypeSpeedText = z.infer<typeof typeSpeedTextSchema>;
export type ITypeSpeed = z.infer<typeof typeSpeedSchema>;
