import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, SaveIcon } from "lucide-react";
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
import api from "@/api/axios";

function EditWhackAMole() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/whack-a-mole/${id}`,
        );
        const gameData = response.data.data;

        setTitle(gameData.name || "");
        setDescription(gameData.description || "");
        setIsPublished(gameData.is_published || false);

        // Set thumbnail preview if exists
        if (gameData.thumbnail_image) {
          setThumbnailPreview(gameData.thumbnail_image);
        }
      } catch (err) {
        console.error("Failed to fetch game data:", err);
        toast.error("Failed to load game data");
        navigate("/my-projects");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGameData();
    }
  }, [id, navigate]);

  const handleSubmit = async (publish = false) => {
    if (!title.trim()) return toast.error("Game title is required");

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);

    // Only append thumbnail if a new file is selected
    if (thumbnail) {
      formData.append("thumbnail_image", thumbnail);
    }

    formData.append("is_published", String(publish));

    try {
      await api.patch(`/api/game/game-type/whack-a-mole/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (publish) {
        toast.success("Game updated and published successfully!");
      } else {
        toast.success("Game saved as draft (unpublished)!");
      }

      navigate("/my-projects");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(
        error.response?.data?.error ||
          "Failed to update game. Please try again.",
      );
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl px-4">
        <div className="flex justify-center items-center h-64">
          <Typography variant="muted">Loading game data...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/my-projects")}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Projects
      </Button>

      <Typography variant="h1" className="mb-2">
        Edit Whack-a-Mole Game
      </Typography>
      <Typography variant="muted" className="mb-8">
        Update your whack-a-mole game information. Changes will replace the old
        data.
      </Typography>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <Typography variant="h3">Game Information</Typography>

          <FormField
            label="Game Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Robot Defense System"
          />

          <TextareaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your game..."
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Thumbnail Image
              {!thumbnailPreview && !thumbnail && (
                <span className="text-destructive"> *</span>
              )}
            </label>
            {thumbnailPreview && !thumbnail && (
              <div className="mb-2">
                <Typography variant="muted" className="text-xs mb-1">
                  Current thumbnail:
                </Typography>
                <img
                  src={thumbnailPreview}
                  alt="Current thumbnail"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
            <Typography variant="muted" className="text-xs mb-2">
              Upload a new thumbnail to replace the current one (optional)
            </Typography>
            <Dropzone defaultValue={thumbnail} onChange={setThumbnail} />
          </div>
        </div>

        {/* Game Info */}
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <Typography variant="h3">Game Rules</Typography>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              🤖 <strong>Robot:</strong> +1 point
            </p>
            <p>
              👺 <strong>King Ransomware:</strong> +5 points + 5 seconds bonus
              time
            </p>
            <p>
              🛡️ <strong>Shield (Trap):</strong> -3 points
            </p>
            <p>
              💥 <strong>Combo System:</strong> Build combo by hitting targets.
              5+ combo = RAMPAGE MODE (2x score!)
            </p>
            <p>
              ⚠️ <strong>Miss Penalty:</strong> Missing a target resets your
              combo
            </p>
            <p>
              ⏱️ <strong>Time Limit:</strong> 30 seconds
            </p>
            <p>
              ⚡ <strong>Speed:</strong> Game speed increases as you score more
              points
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/my-projects")}>
            Cancel
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="flex items-center gap-2">
                <SaveIcon className="w-4 h-4" />
                {isPublished ? "Save as Draft (Unpublish)" : "Save Changes"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isPublished ? "Unpublish Game?" : "Save Changes?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isPublished
                    ? "Your changes will be saved and the game will be unpublished. Players will no longer see this game."
                    : "Your changes will be saved. The game will remain unpublished."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSubmit(false)}>
                  {isPublished ? "Unpublish" : "Save Changes"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {isPublished && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  Update & Keep Published
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update Published Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your changes will be saved and the game will remain
                    published.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSubmit(true)}>
                    Update
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!isPublished && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  Update & Publish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update & Publish Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your changes will be saved and the game will be published
                    immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSubmit(true)}>
                    Update & Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditWhackAMole;
