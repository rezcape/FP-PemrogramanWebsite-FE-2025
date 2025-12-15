import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { speedSortingSchema } from "@/validation/speedSortingSchema";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ActionButtons } from "./components/ActionButtons";
import { CategoriesForm } from "./components/CategoriesForm";
import { GameInfoForm } from "./components/GameInfoForm";
import { WordsForm } from "./components/WordsForm";
import { useCreateSpeedSorting } from "../../api/speed-sorting/useCreateSpeedSorting";
import { type WordItem } from "./types";

export default function CreateSpeedSorting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [categories, setCategories] = useState<string[]>([""]);
  const [words, setWords] = useState<WordItem[]>([
    { text: "", categoryIndex: 0, image: null, type: "text" },
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateForm = () => {
    const allErrors: Record<string, string> = {};
    let isValid = true;

    if (!thumbnail) {
      allErrors.thumbnail = "Thumbnail is required";
      isValid = false;
    }

    const filteredCategories = categories.filter((cat) => cat.trim() !== "");

    const filteredWords = words.filter((word) => {
      if (word.type === "text") {
        return word.text.trim() !== "";
      } else if (word.type === "image") {
        return word.image !== null;
      }
      return false;
    });

    const validationPayload = {
      title: title.trim(),
      description: description.trim(),
      thumbnail: thumbnail,
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
        if (!word.image) {
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

    console.log(allErrors);

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

  const create = useCreateSpeedSorting;

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
          return word.image !== null;
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

      await create({
        name: gameData.title,
        description: gameData.description,
        thumbnail_image: gameData.thumbnail!,
        is_published: isPublished,
        categories: gameData.categories.map((name) => ({ name })),
        items: await Promise.all(
          gameData.words.map(async (word) => ({
            type: word.image ? "image" : "text",
            value: word.image ? await toBase64(word.image) : word.text,
            category_index: word.categoryIndex,
          })),
        ),
      });
      toast.success(
        `Speed sorting game ${isPublished ? "published" : "saved as draft"} successfully`,
      );
      setTitle("");
      setDescription("");
      setThumbnail(null);
      setCategories([""]);
      setWords([{ text: "", categoryIndex: 0, image: null, type: "text" }]);
      setFormErrors({});
      navigate("/create-projects");
    } catch (error) {
      console.error("Error creating speed sorting game:", error);
      toast.error("Failed to create speed sorting game");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          className="hidden md:flex"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft /> Back
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="block md:hidden"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft />
        </Button>
      </div>
      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Create Speed Sorting Game</Typography>
            <Typography variant="p" className="mt-2">
              This is where you can create a new Speed Sorting game.
            </Typography>
          </div>
          <GameInfoForm
            title={title}
            description={description}
            thumbnail={thumbnail}
            formErrors={formErrors}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onThumbnailChange={setThumbnail}
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
            onCancel={() => navigate("/create-projects")}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
