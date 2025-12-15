import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, SaveIcon, X } from "lucide-react";
import api from "@/api/axios";
import { Switch } from "@/components/ui/switch";
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

interface PuzzleData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  is_published: boolean;
  game_json: {
    puzzle_image: string;
    grid_size: number;
    time_limit?: number;
    max_hint_percent?: number;
  };
}

function EditSlidingPuzzle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [puzzleImage, setPuzzleImage] = useState<File | null>(null);
  const [gridSize, setGridSize] = useState("4");
  const [timeLimit, setTimeLimit] = useState("");
  const [maxHintPercent, setMaxHintPercent] = useState("30");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setFetchLoading(true);
        const response = await api.get(
          `/api/game/game-type/sliding-puzzle/${id}`,
        );
        const data = response.data.data;
        setPuzzle(data);
        setTitle(data.name);
        setDescription(data.description || "");
        setGridSize(data.game_json.grid_size.toString());
        setTimeLimit(data.game_json.time_limit?.toString() || "");
        setMaxHintPercent(data.game_json.max_hint_percent?.toString() || "30");
        setIsPublished(data.is_published);
      } catch (err) {
        console.error("Failed to fetch puzzle:", err);
        toast.error("Failed to load puzzle");
        navigate("/create-projects");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) fetchPuzzle();
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", title);
      if (description) formData.append("description", description);
      if (thumbnail) formData.append("thumbnail_image", thumbnail);
      if (puzzleImage) formData.append("puzzle_image", puzzleImage);
      formData.append("grid_size", gridSize);
      if (timeLimit) formData.append("time_limit", timeLimit);
      formData.append("max_hint_percent", maxHintPercent);
      formData.append("is_published", isPublished.toString());

      await api.patch(`/api/game/game-type/sliding-puzzle/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Sliding Puzzle updated successfully!");
      navigate("/create-projects");
    } catch (err: unknown) {
      console.error("Failed to update sliding puzzle:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to update sliding puzzle";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">Puzzle not found</Typography>
        <Button onClick={() => navigate("/create-projects")}>Go Back</Button>
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
            <Typography variant="h3">Edit Sliding Puzzle Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your puzzle settings and images
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
                label="Thumbnail Image (Leave empty to keep current)"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => setThumbnail(file)}
              />
              {!thumbnail && puzzle.thumbnail_image && (
                <div className="mt-2">
                  <Typography variant="small" className="text-gray-500">
                    Current thumbnail:
                  </Typography>
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${puzzle.thumbnail_image}`}
                    alt="Current thumbnail"
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div>
              <Dropzone
                label="Puzzle Image (Leave empty to keep current)"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={5 * 1024 * 1024}
                onChange={(file) => setPuzzleImage(file)}
              />
              {!puzzleImage && puzzle.game_json.puzzle_image && (
                <div className="mt-2">
                  <Typography variant="small" className="text-gray-500">
                    Current puzzle image:
                  </Typography>
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${puzzle.game_json.puzzle_image}`}
                    alt="Current puzzle"
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                </div>
              )}
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

            <div className="flex justify-between items-center">
              <div>
                <Label>Published</Label>
                <Typography variant="small">
                  Make this puzzle visible to everyone
                </Typography>
              </div>
              <div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </div>
          </div>

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
              className="bg-black text-white"
              onClick={handleSubmit}
              disabled={loading}
            >
              <SaveIcon /> {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditSlidingPuzzle;
