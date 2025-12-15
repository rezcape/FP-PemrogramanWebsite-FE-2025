import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, Trash2, X, Sparkles } from "lucide-react";
import api from "@/api/axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateSentences } from "./sentenceGenerator";

interface Sentence {
  sentenceText: string;
  sentenceImage: File | null;
}

function EditUnjumble() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([
    {
      sentenceText: "",
      sentenceImage: null,
    },
  ]);

  const [settings, setSettings] = useState({
    isRandomized: false,
    scorePerSentence: 1,
  });

  // Magic Generate State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateCount, setGenerateCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await api.get(
          `/api/game/game-type/unjumble/${id}/edit `,
        );
        const data = response.data.data;

        setTitle(data.name);
        setDescription(data.description);
        setThumbnailPreview(
          data.thumbnail_image
            ? `${api.defaults.baseURL}/${data.thumbnail_image}`
            : null,
        );

        // Map existing sentences
        if (data.sentences) {
          setSentences(
            data.sentences.map((s: { sentence_text: string }) => ({
              sentenceText: s.sentence_text,
              sentenceImage: null, // Images not yet handled in edit
            })),
          );
        }

        setSettings({
          isRandomized: data.is_randomized,
          scorePerSentence: data.score_per_sentence,
        });
      } catch (error) {
        console.error("Failed to fetch game:", error);
        toast.error("Failed to load game data");
        navigate("/my-projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchGame();
    }
  }, [id, navigate]);

  const addSentence = () => {
    setSentences((prev) => [
      ...prev,
      {
        sentenceText: "",
        sentenceImage: null,
      },
    ]);
  };

  const removeSentence = (index: number) => {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSentenceTextChange = (sIndex: number, value: string) => {
    const newSentences = [...sentences];
    newSentences[sIndex].sentenceText = value;
    setSentences(newSentences);
  };

  const handleMagicGenerate = async () => {
    if (!generateTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    try {
      setIsGenerating(true);
      const newSentencesText = await generateSentences(
        generateTopic,
        generateCount,
      );

      const newSentences: Sentence[] = newSentencesText.map((text) => ({
        sentenceText: text,
        sentenceImage: null,
      }));

      // Append to existing, removing empty default if it's the only one and empty
      setSentences((prev) => {
        const filtered = prev.filter((s) => s.sentenceText.trim() !== "");
        return [...filtered, ...newSentences];
      });

      toast.success(`Generated ${newSentences.length} sentences!`);
      setIsGenerateOpen(false);
      setGenerateTopic("");
    } catch (error) {
      console.error("Generation failed", error);
      toast.error("Failed to generate sentences");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (sentences.some((s) => !s.sentenceText.trim())) {
      toast.error("All sentences must have text");
      return;
    }

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);

    if (thumbnail) {
      formData.append("thumbnail_image", thumbnail);
    }

    const sentencesData = sentences.map((s) => ({
      sentence_text: s.sentenceText,
    }));

    formData.append("sentences", JSON.stringify(sentencesData));
    formData.append("score_per_sentence", String(settings.scorePerSentence));
    formData.append("is_randomized", String(settings.isRandomized));
    formData.append("is_publish_immediately", String(publish));

    try {
      await api.put(`/api/game/game-type/unjumble/${id}`, formData);
      toast.success("Game updated successfully!");
      navigate("/my-projects");
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update game");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          className="hidden md:flex"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft /> Back
        </Button>
      </div>
      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Edit Unjumble Game</Typography>
          </div>
          {/* ... (Reuse form fields here or refactor CreateUnjumble to be reusable) ... */}
          {/* For brevity, I'll copy the form structure but populate with state */}
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
              placeholder="Describe your unjumble game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div>
              {thumbnailPreview && (
                <div className="mb-2">
                  <img
                    src={thumbnailPreview}
                    alt="Current Thumbnail"
                    className="h-32 w-auto rounded object-cover"
                  />
                </div>
              )}
              <Dropzone
                required={!thumbnailPreview}
                label="Thumbnail Image (Upload to change)"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => setThumbnail(file)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Typography variant="p">
              Sentences {`(${sentences.length})`}
            </Typography>
            <div className="flex gap-2">
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-purple-50 text-purple-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Magic Fill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Sentences with AI</DialogTitle>
                    <DialogDescription>
                      Enter a topic to generate sentences.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Input
                        placeholder="e.g. History"
                        value={generateTopic}
                        onChange={(e) => setGenerateTopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Count</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={generateCount}
                        onChange={(e) =>
                          setGenerateCount(Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsGenerateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMagicGenerate}
                      disabled={isGenerating || !generateTopic}
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={addSentence}>
                <Plus /> Add Sentence
              </Button>
            </div>
          </div>

          {sentences.map((s, sIndex) => (
            <div
              key={sIndex}
              className="bg-white w-full h-full p-6 space-y-6 rounded-xl border"
            >
              <div className="flex justify-between">
                <Typography variant="p">Sentence {sIndex + 1}</Typography>
                <Trash2
                  size={20}
                  className="text-red-500 cursor-pointer"
                  onClick={() => removeSentence(sIndex)}
                />
              </div>
              <TextareaField
                required
                label="Sentence"
                placeholder="Type the sentence"
                rows={3}
                value={s.sentenceText}
                onChange={(e) =>
                  handleSentenceTextChange(sIndex, e.target.value)
                }
              />
            </div>
          ))}

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Sentences</Label>
              </div>
              <div>
                <Switch
                  checked={settings.isRandomized}
                  onCheckedChange={(val) =>
                    setSettings((prev) => ({ ...prev, isRandomized: val }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <FormField
                label="Score Per Sentence"
                placeholder="1"
                type="string"
                value={settings.scorePerSentence}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    scorePerSentence: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end w-full">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => navigate("/my-projects")}
            >
              <X /> Cancel
            </Button>
            <Button
              size="sm" // Added size property
              variant="outline"
              onClick={() => handleSubmit(false)}
            >
              <SaveIcon /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditUnjumble;
