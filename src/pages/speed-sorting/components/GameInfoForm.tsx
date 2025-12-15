import Dropzone from "@/components/ui/dropzone";
import { FormField } from "@/components/ui/form-field";

interface GameInfoFormProps {
  title: string;
  description: string;
  thumbnail: File | null;
  existingThumbnail?: string | null;
  formErrors: Record<string, string>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onThumbnailChange: (file: File | null) => void;
  onClearError: (key: string) => void;
}

export function GameInfoForm({
  title,
  description,
  thumbnail,
  existingThumbnail,
  formErrors,
  onTitleChange,
  onDescriptionChange,
  onThumbnailChange,
  onClearError,
}: GameInfoFormProps) {
  return (
    <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
      <div className="space-y-4">
        <div>
          <FormField
            required
            label="Game Title"
            placeholder="Title"
            type="text"
            value={title}
            onChange={(e) => {
              onTitleChange(e.target.value);
              onClearError("title");
            }}
            className={
              formErrors.title ? "border-red-500 bg-red-50" : "bg-[#F3F3F5]"
            }
          />
          {formErrors.title && (
            <div className="text-sm text-red-500 mt-1">{formErrors.title}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Description
          </label>
          <textarea
            placeholder="Describe your quiz game"
            value={description}
            onChange={(e) => {
              onDescriptionChange(e.target.value);
              onClearError("description");
            }}
            className={`w-full px-3 py-2 border rounded-md resize-none ${
              formErrors.description
                ? "border-red-500 bg-red-50"
                : "bg-[#F3F3F5] border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            rows={4}
          />
          {formErrors.description && (
            <div className="text-sm text-red-500 mt-1">
              {formErrors.description}
            </div>
          )}
        </div>

        <div>
          <Dropzone
            label="Thumbnail Image"
            required={!existingThumbnail}
            maxSize={5 * 1024 * 1024}
            allowedTypes={[
              "image/png",
              "image/jpeg",
              "image/jpg",
              "image/webp",
            ]}
            defaultValue={thumbnail || existingThumbnail || null}
            onChange={(file) => {
              onThumbnailChange(file);
              onClearError("thumbnail");
            }}
          />
          {formErrors.thumbnail && (
            <div className="text-sm text-red-500 mt-1">
              {formErrors.thumbnail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
