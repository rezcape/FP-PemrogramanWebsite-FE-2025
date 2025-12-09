import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

function CreateWhackAMole() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleSubmit = async (publish = false) => {
    if (!thumbnail) return toast.error("Thumbnail is required");
    if (!title.trim()) return toast.error("Game title is required");

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);
    formData.append("thumbnail_image", thumbnail);
    formData.append("is_publish_immediately", String(publish));

    try {
      await api.post("/api/game/game-type/whack-a-mole", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Whack-a-Mole game created successfully!");
      navigate("/create-projects");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(
        error.response?.data?.error ||
          "Failed to create game. Please try again.",
      );
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/create-projects")}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Button>

      <Typography variant="h1" className="mb-2">
        Create Whack-a-Mole Game
      </Typography>
      <Typography variant="muted" className="mb-8">
        Create a fun whack-a-mole style game. Players will eliminate rogue
        robots and avoid traps!
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
              Thumbnail Image <span className="text-destructive">*</span>
            </label>
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
          <Button
            variant="outline"
            onClick={() => navigate("/create-projects")}
          >
            Cancel
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="flex items-center gap-2">
                <SaveIcon className="w-4 h-4" />
                Save as Draft
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save as Draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your game will be saved but not published. You can publish it
                  later from My Projects.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSubmit(false)}>
                  Save Draft
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex items-center gap-2">Publish Game</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Publish Game?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your game will be published immediately and visible to all
                  users.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleSubmit(true)}>
                  Publish Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default CreateWhackAMole;
