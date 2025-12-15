import z from "zod";

export const speedSortingCategorySchema = z
  .array(
    z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(50, "Category name must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9\s\-_]+$/,
        "Category name can only contain letters, numbers, spaces, hyphens, and underscores",
      ),
  )
  .min(1, "At least one category is required")
  .max(5, "No more than five categories are allowed")
  .refine(
    (categories) => {
      const uniqueCategories = new Set(
        categories.map((cat) => cat.toLowerCase()),
      );
      return uniqueCategories.size === categories.length;
    },
    { message: "Categories must be unique" },
  );

const textWordSchema = z.object({
  type: z.literal("text"),
  text: z
    .string()
    .min(2, "Word must be at least 2 characters")
    .max(30, "Word must be less than 30 characters"),
  categoryIndex: z.number().min(0, "Invalid category selection"),
  image: z.null().optional(),
});

const imageWordSchema = z.object({
  type: z.literal("image"),
  text: z.string().optional().default(""),
  categoryIndex: z.number().min(0, "Invalid category selection"),
  image: z.union([z.instanceof(File), z.null()]).optional(),
  existingImageUrl: z.string().optional(),
});

const wordSchema = z.discriminatedUnion("type", [
  textWordSchema,
  imageWordSchema,
]);

export const speedSortingSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  thumbnail: z
    .union([
      z.instanceof(File, { message: "Thumbnail is required" }),
      z.string(), // Allow string for existing thumbnail URLs
    ])
    .optional(),
  categories: speedSortingCategorySchema,
  words: z
    .array(wordSchema)
    .min(1, "At least one word is required")
    .max(20, "No more than twenty words are allowed"),
});
