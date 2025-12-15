import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

interface ApiItem {
  id?: string;
  left_content?: string;
  right_content?: string;
}

function EditPairOrNoPair() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [items, setItems] = useState<PairItem[]>([
    { leftContent: "", rightContent: "" },
    { leftContent: "", rightContent: "" },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
  });

  // Fetch existing game data
  useEffect(() => {
    if (!id) return setLoading(false);

    const fetchGame = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/game/game-type/pair-or-no-pair/${id}`);
        const data = res.data.data;

        setTitle(data.name || "");
        setDescription(data.description || "");

        if (data.thumbnail_image) {
          setThumbnailPreview(
            `${import.meta.env.VITE_API_URL}/${data.thumbnail_image}`,
          );
        } else {
          setThumbnailPreview(null);
        }
        setThumbnail(null);

        // Map API items to component state
        const mappedItems: PairItem[] = (data.items || []).map(
          (item: ApiItem) => ({
            leftContent: item.left_content || "",
            rightContent: item.right_content || "",
          }),
        );

        setItems(
          mappedItems.length >= 2
            ? mappedItems
            : [
                { leftContent: "", rightContent: "" },
                { leftContent: "", rightContent: "" },
              ],
        );

        setSettings({
          isPublishImmediately: !!data.is_published,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load game data");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

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

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail && !thumbnailPreview) {
      return toast.error("Thumbnail is required");
    }
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

    if (thumbnail instanceof File) {
      formData.append("thumbnail_image", thumbnail);
    }

    formData.append(
      "is_publish",
      String(publish || settings.isPublishImmediately),
    );
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
      setLoading(true);
      await api.patch(`/api/game/game-type/pair-or-no-pair/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Game updated successfully!");
      navigate("/my-projects");
    } catch (err) {
      console.error("Failed to update game:", err);
      toast.error("Failed to update game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

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

      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Edit Pair or No Pair Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your matching game. Changes will be saved when you click
              Save or Publish.
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
                defaultValue={thumbnailPreview ?? undefined}
                label="Thumbnail Image"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={handleThumbnailChange}
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
                    placeholder="e.g., https://example.com/apple.jpg"
                    type="text"
                    value={item.rightContent}
                    onChange={(e) =>
                      handleItemChange(index, "rightContent", e.target.value)
                    }
                  />
                  <Typography variant="small" className="mt-1 text-gray-500">
                    Enter text or image URL
                  </Typography>
                </div>
              </div>
            </div>
          ))}

          {/* Settings Section */}
          <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Publish Immediately</Label>
                <Typography variant="small">
                  Make the game public right away
                </Typography>
              </div>
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
              <EyeIcon /> Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPairOrNoPair;
