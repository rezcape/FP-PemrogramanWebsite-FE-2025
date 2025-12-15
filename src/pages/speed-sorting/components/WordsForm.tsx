import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Plus, Trash2 } from "lucide-react";
import { type WordItem } from "../types";

interface WordsFormProps {
  words: WordItem[];
  categories: string[];
  formErrors: Record<string, string>;
  onAddWord: () => void;
  onRemoveWord: (index: number) => void;
  onUpdateWord: (
    index: number,
    field: keyof WordItem,
    value: string | number | File | null | "text" | "image",
  ) => void;
  onClearError: (key: string) => void;
}

export function WordsForm({
  words,
  categories,
  formErrors,
  onAddWord,
  onRemoveWord,
  onUpdateWord,
  onClearError,
}: WordsFormProps) {
  return (
    <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
      <div className="flex items-center justify-between">
        <Typography variant="p">Words ({words.length})</Typography>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddWord}
          disabled={words.length >= 20}
          type="button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Word
        </Button>
      </div>
      <div className="space-y-4">
        {words.map((word, index) => (
          <div key={`word-${index}-${word.type}`} className="space-y-2">
            <div className="flex items-center gap-2">
              <Typography variant="p" className="font-medium">
                Word {index + 1}
              </Typography>
              {words.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                  onClick={() => onRemoveWord(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content Type Selection */}
            <div className="mb-4">
              <Label className="flex items-center gap-1 mb-3">
                Content Type
                <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={word.type}
                onValueChange={(value) => {
                  const newType = value as "text" | "image";
                  onUpdateWord(index, "type", newType);
                  if (newType === "text") {
                    onUpdateWord(index, "image", null);
                    onClearError(`words.${index}.image`);
                  } else {
                    onUpdateWord(index, "text", "");
                    onClearError(`words.${index}.text`);
                  }
                }}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id={`text-${index}`} />
                  <Label htmlFor={`text-${index}`} className="cursor-pointer">
                    Text
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id={`image-${index}`} />
                  <Label htmlFor={`image-${index}`} className="cursor-pointer">
                    Image
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {word.type === "image" ? (
              <div className="space-y-4">
                <div>
                  <Dropzone
                    label="Word Image"
                    required={!word.existingImageUrl}
                    maxSize={5 * 1024 * 1024}
                    allowedTypes={[
                      "image/png",
                      "image/jpeg",
                      "image/jpg",
                      "image/webp",
                    ]}
                    defaultValue={
                      word.image ||
                      (word.existingImageUrl
                        ? `${import.meta.env.VITE_API_URL}/${word.existingImageUrl}`
                        : null)
                    }
                    onChange={(file) => {
                      onUpdateWord(index, "image", file);
                      onClearError(`words.${index}.image`);
                    }}
                  />
                  {formErrors[`words.${index}.image`] && (
                    <div className="text-sm text-red-500 mt-1">
                      {formErrors[`words.${index}.image`]}
                    </div>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label className="flex items-center gap-1">
                    Category
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={word.categoryIndex.toString()}
                    onValueChange={(value) =>
                      onUpdateWord(index, "categoryIndex", parseInt(value))
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        formErrors[`words.${index}.categoryIndex`]
                          ? "border-red-500 bg-red-50"
                          : "bg-[#F3F3F5]"
                      }`}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category, categoryIndex) => (
                        <SelectItem
                          key={categoryIndex}
                          value={categoryIndex.toString()}
                          disabled={category.trim() === ""}
                        >
                          {category.trim() ||
                            `Category ${categoryIndex + 1} (empty)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors[`words.${index}.categoryIndex`] && (
                    <div className="text-sm text-red-500 mt-1">
                      {formErrors[`words.${index}.categoryIndex`]}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Grid layout for text type */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    required
                    label="Word"
                    placeholder="Enter word"
                    type="text"
                    value={word.text}
                    onChange={(e) =>
                      onUpdateWord(index, "text", e.target.value)
                    }
                    className={
                      formErrors[`words.${index}.text`]
                        ? "border-red-500 bg-red-50"
                        : "bg-[#F3F3F5]"
                    }
                  />
                  {formErrors[`words.${index}.text`] && (
                    <div className="text-sm text-red-500 mt-1">
                      {formErrors[`words.${index}.text`]}
                    </div>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label className="flex items-center gap-1">
                    Category
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={word.categoryIndex.toString()}
                    onValueChange={(value) =>
                      onUpdateWord(index, "categoryIndex", parseInt(value))
                    }
                  >
                    <SelectTrigger
                      className={`w-full ${
                        formErrors[`words.${index}.categoryIndex`]
                          ? "border-red-500 bg-red-50"
                          : "bg-[#F3F3F5]"
                      }`}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category, categoryIndex) => (
                        <SelectItem
                          key={categoryIndex}
                          value={categoryIndex.toString()}
                          disabled={category.trim() === ""}
                        >
                          {category.trim() ||
                            `Category ${categoryIndex + 1} (empty)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors[`words.${index}.categoryIndex`] && (
                    <div className="text-sm text-red-500 mt-1">
                      {formErrors[`words.${index}.categoryIndex`]}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {formErrors.words && (
          <div className="text-sm text-red-500 mt-1">{formErrors.words}</div>
        )}

        {Object.entries(formErrors).map(([key, error]) => {
          if (key.startsWith("category.") && key.endsWith(".words")) {
            return (
              <div key={key} className="text-sm text-red-500 mt-1">
                {error}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
