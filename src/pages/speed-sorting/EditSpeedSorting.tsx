import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { speedSortingSchema } from "@/validation/speedSortingSchema";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ActionButtons } from "./components/ActionButtons";
import { CategoriesForm } from "./components/CategoriesForm";
import { GameInfoForm } from "./components/GameInfoForm";
import { WordsForm } from "./components/WordsForm";
import { useGetDetailSpeedSorting } from "../../api/speed-sorting/useGetDetailSpeedSorting";
import { useUpdateSpeedSorting } from "../../api/speed-sorting/useUpdateSpeedSorting";
import { type WordItem } from "./types";

export default function EditSpeedSorting() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: detail, isLoading, error } = useGetDetailSpeedSorting(id!);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([""]);
  const [words, setWords] = useState<WordItem[]>([
    { text: "", categoryIndex: 0, image: null, type: "text" },
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (detail) {
      setTitle(detail.name || "");
      setDescription(detail.description || "");

      if (detail.thumbnail_image) {
        setThumbnailPreview(
          `${import.meta.env.VITE_API_URL}/${detail.thumbnail_image}`,
        );
      } else {
        setThumbnailPreview(null);
      }
      setThumbnail(null);

      setCategories(detail.categories.map((cat) => cat.name) || [""]);

      const loadedWords: WordItem[] = detail.items.map((item) => ({
        text: item.type === "text" ? item.value : "",
        categoryIndex:
          (item.category_index ?? item.category_id)
            ? detail.categories.findIndex((cat) => cat.id === item.category_id)
            : 0,
        image: null,
        type: item.type === "image" ? "image" : "text",
        existingImageUrl: item.type === "image" ? item.value : undefined,
      }));

      setWords(
        loadedWords.length > 0
          ? loadedWords
          : [{ text: "", categoryIndex: 0, image: null, type: "text" }],
      );
    }
  }, [detail]);

  const clearFormError = (key: string) => {
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const addCategory = () => {
    if (categories.length >= 5) {
      toast.error("You can only add up to 5 categories.");
      return;
    }
    setCategories([...categories, ""]);
    clearFormError("categories");
  };

  const removeCategory = (index: number) => {
    if (categories.length === 1) {
      toast.error("At least one category is required.");
      return;
    }

    const updatedWords = words.map((word) => {
      if (word.categoryIndex === index) {
        return { ...word, categoryIndex: 0 };
      } else if (word.categoryIndex > index) {
        return { ...word, categoryIndex: word.categoryIndex - 1 };
      }
      return word;
    });

    setWords(updatedWords);
    setCategories(categories.filter((_, i) => i !== index));
    clearFormError("categories");
    clearFormError(`categories.${index}`);

    const affectedWords = words.filter(
      (word) => word.categoryIndex === index && word.text.trim() !== "",
    );
    if (affectedWords.length > 0) {
      toast.error(
        `${affectedWords.length} word(s) were reset due to category deletion.`,
      );
    }
  };

  const updateCategory = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
    clearFormError(`categories.${index}`);
    clearFormError("categories");
  };

  const addWord = () => {
    if (words.length >= 20) {
      toast.error("You can only add up to 20 words.");
      return;
    }
    setWords([
      ...words,
      { text: "", categoryIndex: 0, image: null, type: "text" },
    ]);
    clearFormError("words");
  };

  const removeWord = (index: number) => {
    if (words.length === 1) {
      toast.error("At least one word is required.");
      return;
    }
    setWords(words.filter((_, i) => i !== index));
    clearFormError("words");
    clearFormError(`words.${index}`);
  };

  const updateWord = (
    index: number,
    field: keyof WordItem,
    value: string | number | File | null | "text" | "image",
  ) => {
    setWords((prevWords) => {
      const newWords = [...prevWords];
      const updates: Partial<WordItem> = { [field]: value };
      if (field === "type") {
        if (value === "text") {
          updates.image = null;
          updates.existingImageUrl = undefined;
        } else if (value === "image") {
          updates.text = "";
        }
      }
      newWords[index] = { ...newWords[index], ...updates };
      return newWords;
    });
    clearFormError(`words.${index}.${field}`);
    clearFormError("words");
    if (field === "type") {
      clearFormError(`words.${index}.text`);
      clearFormError(`words.${index}.image`);
    }
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    }
    clearFormError("thumbnail");
  };

  const validateForm = () => {
    const allErrors: Record<string, string> = {};
    let isValid = true;
    const filteredCategories = categories.filter((cat) => cat.trim() !== "");

    const filteredWords = words.filter((word) => {
      if (word.type === "text") {
        return word.text.trim() !== "";
      } else if (word.type === "image") {
        return word.image !== null || word.existingImageUrl;
      }
      return false;
    });

    const validationPayload = {
      title: title.trim(),
      description: description.trim(),
      thumbnail: thumbnail || thumbnailPreview || "existing",
      categories: filteredCategories,
      words: filteredWords,
    };

    try {
      speedSortingSchema.parse(validationPayload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          allErrors[path] = issue.message;
        });
        isValid = false;
      }
    }

    categories.forEach((category, index) => {
      if (category.trim() === "") {
        allErrors[`categories.${index}`] = "Category name is required";
        isValid = false;
      }
    });

    words.forEach((word, index) => {
      if (word.type === "text") {
        if (word.text.trim() === "") {
          allErrors[`words.${index}.text`] = "Word is required";
          isValid = false;
        } else if (word.text.trim().length < 2) {
          allErrors[`words.${index}.text`] =
            "Word must be at least 2 characters";
          isValid = false;
        }
      } else if (word.type === "image") {
        if (!word.image && !word.existingImageUrl) {
          allErrors[`words.${index}.image`] = "Image is required";
          isValid = false;
        }
      }

      if (
        word.categoryIndex >= categories.length ||
        categories[word.categoryIndex].trim() === ""
      ) {
        allErrors[`words.${index}.categoryIndex`] =
          "Please select a valid category";
        isValid = false;
      }
    });

    const validCategories = categories.filter((cat) => cat.trim() !== "");
    const wordsByCategory = validCategories.map((_, categoryIndex) =>
      filteredWords.filter((word) => word.categoryIndex === categoryIndex),
    );

    wordsByCategory.forEach((categoryWords, categoryIndex) => {
      if (categoryWords.length === 0 && validCategories[categoryIndex]) {
        allErrors[`category.${categoryIndex}.words`] =
          `Category "${validCategories[categoryIndex]}" needs at least one word`;
        isValid = false;
      }
    });

    const filteredErrors: Record<string, string> = {};
    Object.entries(allErrors).forEach(([key, value]) => {
      const wordMatch = key.match(/^words\.(\d+)\.(text|image)$/);
      if (wordMatch) {
        const wordIndex = parseInt(wordMatch[1]);
        const fieldType = wordMatch[2] as "text" | "image";
        if (words[wordIndex] && words[wordIndex].type === fieldType) {
          filteredErrors[key] = value;
        }
      } else {
        filteredErrors[key] = value;
      }
    });

    setFormErrors(filteredErrors);
    return isValid;
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const update = useUpdateSpeedSorting;

  const handleSubmit = async (isPublished: boolean) => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    setIsSubmitting(true);
    try {
      const filteredCategories = categories.filter((cat) => cat.trim() !== "");
      const filteredWords = words.filter((word) => {
        if (word.type === "text") {
          return word.text.trim() !== "";
        } else if (word.type === "image") {
          return word.image !== null || word.existingImageUrl;
        }
        return false;
      });

      const gameData = {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail,
        categories: filteredCategories,
        words: filteredWords,
      };

      await update(id!, {
        name: gameData.title,
        description: gameData.description,
        thumbnail_image: thumbnail || undefined,
        is_published: isPublished,
        categories: gameData.categories.map((name) => ({ name })),
        items: await Promise.all(
          gameData.words.map(async (word) => {
            if (word.type === "image" && word.image) {
              return {
                type: "image" as const,
                value: await toBase64(word.image),
                category_index: word.categoryIndex,
              };
            } else if (word.type === "image" && word.existingImageUrl) {
              return {
                type: "image" as const,
                value: word.existingImageUrl,
                category_index: word.categoryIndex,
              };
            } else {
              return {
                type: "text" as const,
                value: word.text,
                category_index: word.categoryIndex,
              };
            }
          }),
        ),
      });

      toast.success(
        `Speed sorting game ${isPublished ? "updated and published" : "saved as draft"} successfully`,
      );
      navigate("/my-projects");
    } catch (error) {
      console.error("Error updating speed sorting game:", error);
      toast.error("Failed to update speed sorting game");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {error || "Game not found"}
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          className="hidden md:flex"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft /> Back
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="block md:hidden"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft />
        </Button>
      </div>
      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Edit Speed Sorting Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your Speed Sorting game.
            </Typography>
          </div>
          <GameInfoForm
            title={title}
            description={description}
            thumbnail={thumbnail}
            existingThumbnail={thumbnailPreview}
            formErrors={formErrors}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onThumbnailChange={handleThumbnailChange}
            onClearError={clearFormError}
          />

          <CategoriesForm
            categories={categories}
            formErrors={formErrors}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
            onUpdateCategory={updateCategory}
          />

          <WordsForm
            words={words}
            categories={categories}
            formErrors={formErrors}
            onAddWord={addWord}
            onRemoveWord={removeWord}
            onUpdateWord={updateWord}
            onClearError={clearFormError}
          />

          <ActionButtons
            isSubmitting={isSubmitting}
            onCancel={() => navigate("/my-projects")}
            onSubmit={handleSubmit}
            submitLabel="Update Game"
          />
        </div>
      </div>
    </div>
  );
}
