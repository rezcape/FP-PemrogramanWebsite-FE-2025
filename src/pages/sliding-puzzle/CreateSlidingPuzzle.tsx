import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, SaveIcon, X, EyeIcon } from "lucide-react";
import api from "@/api/axios";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CreateSlidingPuzzle() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [puzzleImage, setPuzzleImage] = useState<File | null>(null);
  const [gridSize, setGridSize] = useState("4");
  const [timeLimit, setTimeLimit] = useState("");
  const [maxHintPercent, setMaxHintPercent] = useState("30");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (publish = false) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!thumbnail) {
      toast.error("Thumbnail is required");
      return;
    }

    if (!puzzleImage) {
      toast.error("Puzzle image is required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", title);
      if (description) formData.append("description", description);
      formData.append("thumbnail_image", thumbnail);
      formData.append("puzzle_image", puzzleImage);
      formData.append("grid_size", gridSize);
      if (timeLimit) formData.append("time_limit", timeLimit);
      formData.append("max_hint_percent", maxHintPercent);
      formData.append("is_publish_immediately", publish.toString());

      await api.post("/api/game/game-type/sliding-puzzle", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Sliding Puzzle created successfully!");
      navigate("/create-projects");
    } catch (err: unknown) {
      console.error("Failed to create sliding puzzle:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to create sliding puzzle";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
            <Typography variant="h3">Create Sliding Puzzle Game</Typography>
            <Typography variant="p" className="mt-2">
              Upload an image and configure the puzzle settings
            </Typography>
          </div>

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <div>
              <FormField
                required
                label="Game Title"
                placeholder="My Awesome Puzzle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <TextareaField
              label="Description"
              placeholder="Describe your puzzle game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <Dropzone
                required
                label="Thumbnail Image"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => setThumbnail(file)}
              />
            </div>

            <div>
              <Dropzone
                required
                label="Puzzle Image"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={5 * 1024 * 1024}
                onChange={(file) => setPuzzleImage(file)}
              />
              <Typography variant="small" className="text-gray-500 mt-2">
                This image will be split into tiles for the puzzle
              </Typography>
            </div>
          </div>

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Puzzle Settings</Typography>

            <div className="grid w-full items-center gap-1.5">
              <Label>
                Grid Size <span className="text-red-500">*</span>
              </Label>
              <Select value={gridSize} onValueChange={setGridSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grid size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3x3 (Easy)</SelectItem>
                  <SelectItem value="4">4x4 (Medium)</SelectItem>
                  <SelectItem value="5">5x5 (Hard)</SelectItem>
                  <SelectItem value="6">6x6 (Expert)</SelectItem>
                </SelectContent>
              </Select>
              <Typography variant="small" className="text-gray-500">
                Larger grids are more challenging
              </Typography>
            </div>

            <div>
              <FormField
                label="Time Limit (seconds)"
                placeholder="300"
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
              <Typography variant="small" className="text-gray-500 mt-1">
                Optional. Leave empty for no time limit.
              </Typography>
            </div>

            <div>
              <FormField
                label="Max Hints (%)"
                placeholder="30"
                type="number"
                min={0}
                max={100}
                value={maxHintPercent}
                onChange={(e) => setMaxHintPercent(e.target.value)}
              />
              <Typography variant="small" className="text-gray-500 mt-1">
                Percentage of estimated max steps given as hints (0-100).
                Default is 30%.
              </Typography>
            </div>
          </div>

          {/* Preview Section */}
          {puzzleImage && (
            <div className="bg-white w-full h-full p-6 space-y-4 rounded-xl border">
              <Typography variant="p">Preview</Typography>
              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(puzzleImage)}
                  alt="Puzzle Preview"
                  className="max-w-md rounded-lg shadow-lg border"
                />
              </div>
              <Typography variant="small" className="text-center text-gray-500">
                This image will be divided into {gridSize}x{gridSize} tiles
              </Typography>
            </div>
          )}

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
              disabled={loading}
            >
              <SaveIcon /> {loading ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-black text-white"
              onClick={() => handleSubmit(true)}
              disabled={loading}
            >
              <EyeIcon /> {loading ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateSlidingPuzzle;
