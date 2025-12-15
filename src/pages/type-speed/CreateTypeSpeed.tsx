import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCreateTypeSpeed } from "@/api/type-speed/useCreateTypeSpeed";
import { typeSpeedSchema } from "@/validation/typeSpeedSchema";

interface TextItem {
  content: string;
  difficulty: "easy" | "medium" | "hard";
}

export default function CreateTypeSpeed() {
  const navigate = useNavigate();
  const createTypeSpeed = useCreateTypeSpeed;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const clearFormError = (key: string) => {
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Thumbnail is required",
      }));
      return toast.error("Thumbnail is required");
    }

    // Default payload for API to satisfy backend schema requirements (min 3 texts, time limit)
    const DUMMY_TEXTS: TextItem[] = [
      {
        content: "The quick brown fox jumps over the lazy dog.",
        difficulty: "easy",
      },
      {
        content: "The quick brown fox jumps over the lazy dog.",
        difficulty: "medium",
      },
      {
        content: "The quick brown fox jumps over the lazy dog.",
        difficulty: "hard",
      },
    ];

    const DUMMY_TIME_LIMIT = 60;

    const payload = {
      title,
      description,
      thumbnail,
      timeLimit: DUMMY_TIME_LIMIT,
      texts: DUMMY_TEXTS,
      settings: { isPublishImmediately: publish },
    };

    const parseResult = typeSpeedSchema.safeParse(payload);
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
      await createTypeSpeed({
        name: title,
        description,
        thumbnail_image: thumbnail,
        is_publish_immediately: publish,
        time_limit: DUMMY_TIME_LIMIT,
        texts: DUMMY_TEXTS.map((t) => ({
          content: t.content,
          difficulty: t.difficulty,
        })),
      });
      toast.success("Type Speed game created successfully!");
      navigate("/my-projects");
    } catch {
      toast.error("Failed to create Type Speed game");
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
            <Typography variant="h3">Create Type Speed Game</Typography>
            <Typography variant="p" className="mt-2">
              Build your typing speed challenge game
            </Typography>
          </div>

          {/* Game Info */}
          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <div>
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
            </div>

            <TextareaField
              label="Description"
              placeholder="Describe your Type Speed game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <Dropzone
                required
                label="Thumbnail Image"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={5 * 1024 * 1024}
                onChange={(file) => {
                  setThumbnail(file);
                  clearFormError("thumbnail");
                }}
              />
              {formErrors["thumbnail"] && (
                <p className="text-sm text-red-500">
                  {formErrors["thumbnail"]}
                </p>
              )}
            </div>
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
                  <AlertDialogAction
                    onClick={() => navigate("/create-projects")}
                  >
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
              <EyeIcon /> Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
