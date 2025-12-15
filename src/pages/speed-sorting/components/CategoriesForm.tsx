import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Plus, Trash2 } from "lucide-react";

interface CategoriesFormProps {
  categories: string[];
  formErrors: Record<string, string>;
  onAddCategory: () => void;
  onRemoveCategory: (index: number) => void;
  onUpdateCategory: (index: number, value: string) => void;
}

export function CategoriesForm({
  categories,
  formErrors,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
}: CategoriesFormProps) {
  return (
    <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
      <div className="flex items-center justify-between">
        <Typography variant="p">Categories ({categories.length})</Typography>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCategory}
          disabled={categories.length >= 5}
          type="button"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <Typography variant="p" className="font-medium">
                Category {index + 1}
              </Typography>
              {categories.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                  onClick={() => onRemoveCategory(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <input
              required
              placeholder="Type your category here"
              type="text"
              value={category}
              onChange={(e) => onUpdateCategory(index, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                formErrors[`categories.${index}`]
                  ? "border-red-500 bg-red-50"
                  : "bg-[#F3F3F5] border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {formErrors[`categories.${index}`] && (
              <div className="text-sm text-red-500 mt-1">
                {formErrors[`categories.${index}`]}
              </div>
            )}
          </div>
        ))}
        {formErrors.categories && (
          <div className="text-sm text-red-500 mt-1">
            {formErrors.categories}
          </div>
        )}
      </div>
    </div>
  );
}
