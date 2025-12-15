import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { FormField } from "@/components/ui/form-field";
import { TextareaField } from "@/components/ui/textarea-field";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, SaveIcon, X, EyeIcon } from "lucide-react";
import { useUpdateTypeSpeed } from "@/api/type-speed/useUpdateTypeSpeed";
import { useGetDetailTypeSpeed } from "@/api/type-speed/useGetDetailTypeSpeed";
import { typeSpeedSchema } from "@/validation/typeSpeedSchema";
import { z } from "zod";

export default function EditTypeSpeed() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: detail, isLoading, error } = useGetDetailTypeSpeed(id!);
  const updateTypeSpeed = useUpdateTypeSpeed;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setTitle(detail.name || "");
      setDescription(detail.description || "");

      if (detail.thumbnail_image) {
        setThumbnailPreview(
          `${import.meta.env.VITE_API_URL}/${detail.thumbnail_image}`,
        );
      }
      // Removed logic for setting timeLimit and texts
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

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
    clearFormError("thumbnail");
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail && !thumbnailPreview) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Thumbnail is required",
      }));
      return toast.error("Thumbnail is required");
    }

    const payload = {
      title,
      description,
      thumbnail: thumbnail || thumbnailPreview || "existing",
      // Omitted fields that are no longer in the UI for validation
      settings: { isPublishImmediately: publish },
    };

    let schemaToUse: z.ZodTypeAny = typeSpeedSchema;
    if (!thumbnail && thumbnailPreview) {
      schemaToUse = typeSpeedSchema.extend({
        thumbnail: z.union([z.string().url(), z.null()]),
        // Omit checking for timeLimit and texts in client-side schema extension
        timeLimit: z.any().optional(),
        texts: z.any().optional(),
      });
    }

    const parseResult = schemaToUse.safeParse(payload);
    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const errObj: Record<string, string> = {};
      issues.forEach((issue) => {
        const key = issue.path.join(".");
        errObj[key] = issue.message;
      });
      setFormErrors(errObj);
      toast.error(issues[0].message);
      return;
    }

    try {
      // Hanya kirim field yang diubah. time_limit dan texts dihilangkan (undefined)
      // agar backend (useUpdateTypeSpeed) mempertahankan nilai lama.
      await updateTypeSpeed(id!, {
        name: title,
        description,
        thumbnail_image: thumbnail || undefined,
        is_publish: publish,
      });
      toast.success("Type Speed game updated successfully!");
      navigate("/my-projects");
    } catch {
      toast.error("Failed to update Type Speed game");
    }
  };

  if (isLoading)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );

  if (error || !detail)
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">{error ?? "Game not found"}</Typography>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft /> Back
        </Button>
      </div>

      <div className="w-full h-full p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Edit Type Speed Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your typing speed challenge game (Content determined by
              player at start)
            </Typography>
          </div>

          {/* Game Info */}
          <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
            <FormField
              required
              label="Game Title"
              placeholder="Title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFormError("title");
              }}
            />
            {formErrors["title"] && (
              <p className="text-sm text-red-500">{formErrors["title"]}</p>
            )}

            <TextareaField
              label="Description"
              placeholder="Describe your Type Speed game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Dropzone
              required
              defaultValue={thumbnailPreview ?? undefined}
              label="Thumbnail Image"
              allowedTypes={["image/png", "image/jpeg"]}
              maxSize={5 * 1024 * 1024}
              onChange={handleThumbnailChange}
            />
            {formErrors["thumbnail"] && (
              <p className="text-sm text-red-500">{formErrors["thumbnail"]}</p>
            )}
          </div>

          {/* Texts Section Removed */}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <X /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel? All unsaved changes will be
                    lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                  <AlertDialogAction onClick={() => navigate("/my-projects")}>
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSubmit(false)}
            >
              <SaveIcon /> Save Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-black text-white"
              onClick={() => handleSubmit(true)}
            >
              <EyeIcon /> Update & Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
