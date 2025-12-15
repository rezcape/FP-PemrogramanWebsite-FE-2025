import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, Trash2, X, EyeIcon } from "lucide-react";
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

interface PairItem {
  leftContent: string;
  rightContent: string;
}

function CreatePairOrNoPair() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [items, setItems] = useState<PairItem[]>([
    { leftContent: "", rightContent: "" },
    { leftContent: "", rightContent: "" },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
  });

  const addItem = () => {
    setItems((prev) => [...prev, { leftContent: "", rightContent: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 2) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: "leftContent" | "rightContent",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail) return toast.error("Thumbnail is required");
    if (!title.trim()) return toast.error("Game title is required");
    if (items.length < 2) return toast.error("Minimum 2 pairs required");

    // Validate all items have content
    for (let i = 0; i < items.length; i++) {
      if (!items[i].leftContent.trim() || !items[i].rightContent.trim()) {
        return toast.error(
          `Pair ${i + 1} must have both left and right content`,
        );
      }
    }

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);
    formData.append("thumbnail_image", thumbnail);
    formData.append("is_publish_immediately", String(publish));
    formData.append(
      "items",
      JSON.stringify(
        items.map((item) => ({
          left_content: item.leftContent,
          right_content: item.rightContent,
        })),
      ),
    );

    try {
      await api.post("/api/game/game-type/pair-or-no-pair", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Game created successfully!");
      navigate("/create-projects");
    } catch (err) {
      console.error("Failed to create game:", err);
      toast.error("Failed to create game. Please try again.");
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
            <Typography variant="h3">Create Pair or No Pair Game</Typography>
            <Typography variant="p" className="mt-2">
              Build your matching game by adding pairs of related items
            </Typography>
          </div>

          {/* Game Info Section */}
          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <div>
              <FormField
                required
                label="Game Title"
                placeholder="Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <TextareaField
              label="Description"
              placeholder="Describe your matching game"
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
          </div>

          {/* Pairs Section */}
          <div className="flex justify-between items-center">
            <Typography variant="p">Pairs {`(${items.length})`}</Typography>
            <Button variant="outline" onClick={addItem}>
              <Plus /> Add Pair
            </Button>
          </div>

          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white w-full h-full p-6 space-y-4 rounded-xl border"
            >
              <div className="flex justify-between">
                <Typography variant="p">Pair {index + 1}</Typography>
                <Trash2
                  size={20}
                  className={`${
                    items.length <= 2
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-500 cursor-pointer"
                  }`}
                  onClick={() => removeItem(index)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">
                    Left Content <span className="text-red-500">*</span>
                  </Label>
                  <FormField
                    label=""
                    placeholder="e.g., Apple"
                    type="text"
                    value={item.leftContent}
                    onChange={(e) =>
                      handleItemChange(index, "leftContent", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="mb-2">
                    Right Content <span className="text-red-500">*</span>
                  </Label>
                  <FormField
                    label=""
                    placeholder="e.g., 🍎 or image URL"
                    type="text"
                    value={item.rightContent}
                    onChange={(e) =>
                      handleItemChange(index, "rightContent", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Settings Section */}
          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Publish Immediately</Label>
                <Typography variant="small">
                  Make the game publicly available right away
                </Typography>
              </div>
              <div>
                <Switch
                  checked={settings.isPublishImmediately}
                  onCheckedChange={(val) =>
                    setSettings((prev) => ({
                      ...prev,
                      isPublishImmediately: val,
                    }))
                  }
                />
              </div>
            </div>
          </div>

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
              disabled={items.length < 2}
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

export default CreatePairOrNoPair;
