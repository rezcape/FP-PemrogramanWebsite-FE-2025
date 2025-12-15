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
import {
  ArrowLeft,
  Plus,
  SaveIcon,
  Trash2,
  X,
  EyeIcon,
  Sparkles,
} from "lucide-react";
import { createUnjumble } from "./useCreateUnjumble";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { generateSentences } from "@/pages/unjumble/sentenceGenerator";

interface Sentence {
  sentenceText: string;
  sentenceImage: File | null;
}

function CreateUnjumble() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([
    {
      sentenceText: "",
      sentenceImage: null,
    },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    isRandomized: false,
    scorePerSentence: 1,
  });

  // Magic Generate State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateCount, setGenerateCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (!thumbnail) {
      toast.error("Thumbnail is required");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (sentences.some((s) => !s.sentenceText.trim())) {
      toast.error("All sentences must have text");
      return;
    }

    const payload = {
      title,
      description,
      thumbnail,
      sentences,
      settings: { ...settings, isPublishImmediately: publish },
    };

    try {
      await createUnjumble(payload);
      toast.success("Unjumble game created successfully!");
      navigate("/my-projects");
    } catch (err) {
      console.error("Failed to create unjumble game:", err);
      toast.error("Failed to create unjumble game. Please try again.");
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
            <Typography variant="h3">Create Unjumble Game</Typography>
            <Typography variant="p" className="mt-2">
              Build your unjumble game by adding sentences that players will
              need to arrange
            </Typography>
          </div>
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
              <Dropzone
                required
                label="Thumbnail Image"
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
                    className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:text-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Magic Fill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Sentences with AI</DialogTitle>
                    <DialogDescription>
                      Enter a topic and we'll generate sentences for you to use.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Input
                        placeholder="e.g. History, Animals, Grammar..."
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
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isGenerating ? (
                        "Generating..."
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" /> Generate
                        </>
                      )}
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
                  className={`${
                    sentences.length === 1 && !s.sentenceText
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-500 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (sentences.length > 1) removeSentence(sIndex);
                    // If it's the last one but has text, allow clearing it?
                    // Or just strict "cannot delete last one"
                    // The standard UI usually prevents deleting the last item to avoid empty state issues,
                    // but we can allow it if we immediately add a blank one?
                    // For now, keep existing logic: cannot delete if length === 1
                  }}
                />
              </div>

              <div>
                <TextareaField
                  required
                  label="Sentence"
                  placeholder="Type the correct sentence here (e.g., 'Can she play the violin ?')"
                  rows={3}
                  value={s.sentenceText}
                  onChange={(e) =>
                    handleSentenceTextChange(sIndex, e.target.value)
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tip: Separate words with spaces. Players will need to arrange
                  them in the correct order.
                </p>
              </div>
            </div>
          ))}

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Sentences</Label>
                <Typography variant="small">
                  Randomize sentence order for each player
                </Typography>
              </div>
              <div>
                <Switch
                  checked={settings.isRandomized}
                  onCheckedChange={(val) =>
                    setSettings((prev) => ({
                      ...prev,
                      isRandomized: val,
                    }))
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
              disabled={sentences.length === 0}
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

export default CreateUnjumble;
