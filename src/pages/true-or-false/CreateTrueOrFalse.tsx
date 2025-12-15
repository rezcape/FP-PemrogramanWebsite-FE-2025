import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/api/axios";

import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea-field";
import { Typography } from "@/components/ui/typography";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import { ArrowLeft, Plus, Trash2, SaveIcon } from "lucide-react";

/* =====================
   TYPES
===================== */
interface Question {
  questionText: string;
  correctAnswer: "A" | "B";
}

/* =====================
   COMPONENT
===================== */
function CreateTrueOrFalse() {
  const navigate = useNavigate();

  /* =====================
     STATE
  ===================== */
  const [nameGame, setNameGame] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isPublishImmediately, setIsPublishImmediately] = useState(false);

  const [choices, setChoices] = useState({
    A: "",
    B: "",
  });

  const [questions, setQuestions] = useState<Question[]>([
    { questionText: "", correctAnswer: "A" },
  ]);

  /* =====================
     QUESTION HANDLER
  ===================== */
  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error("Maximum 10 questions allowed");
      return;
    }
    setQuestions((prev) => [...prev, { questionText: "", correctAnswer: "A" }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  /* =====================
     SUBMIT
  ===================== */
  const handleSubmit = async () => {
    if (!nameGame || !description || !thumbnail) {
      toast.error("Game name, description, and thumbnail are required");
      return;
    }

    if (!choices.A || !choices.B) {
      toast.error("Both choices are required");
      return;
    }

    if (countdown <= 0) {
      toast.error("Countdown must be greater than 0");
      return;
    }

    for (const q of questions) {
      if (!q.questionText.trim()) {
        toast.error("All questions must be filled");
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", nameGame);
    formData.append("description", description);
    formData.append("thumbnail_image", thumbnail);
    formData.append("is_publish_immediately", String(isPublishImmediately));

    const gameJson = {
      countdown,
      choices,
      questions,
    };

    formData.append("game_json", JSON.stringify(gameJson));

    try {
      await api.post("/api/game/game-type/true-or-false", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("TrueOrFalse game created successfully!");
      navigate("/my-projects");
    } catch (error) {
      console.error("Failed to create game:", error);
      toast.error("Failed to create game");
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="w-full min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 via-emerald-50 to-green-100">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-800 to-emerald-600 px-8 py-4 shadow-lg border-b-4 border-green-900">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 hover:text-white font-bold tracking-wide"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> BACK
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-8 space-y-8">
        {/* TITLE */}
        <div className="text-center space-y-2">
          <Typography
            variant="h2"
            className="bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-transparent font-extrabold tracking-tight drop-shadow-sm"
          >
            CREATE TRUE OR FALSE GAME
          </Typography>
          <Typography
            variant="p"
            className="text-green-700 font-medium text-lg"
          >
            Players decide whether each question belongs to Choice A or Choice B
          </Typography>
        </div>

        {/* BASIC INFO */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-green-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-2 border-b border-green-100 pb-4 mb-4">
            <div className="h-8 w-2 bg-green-600 rounded-full"></div>
            <Typography variant="h4" className="text-green-800 font-bold">
              Game Details
            </Typography>
          </div>

          <FormField
            required
            label="Game Name"
            placeholder="Example: Logic Classification"
            value={nameGame}
            onChange={(e) => setNameGame(e.target.value)}
            className="bg-white"
          />

          <TextareaField
            required
            label="Description"
            placeholder="Describe your True or False game"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-white"
          />

          <Dropzone
            required
            label="Thumbnail Image"
            allowedTypes={["image/png", "image/jpeg"]}
            maxSize={2 * 1024 * 1024}
            onChange={(file) => setThumbnail(file)}
          />

          <FormField
            required
            label="Countdown (seconds)"
            type="number"
            placeholder="30"
            value={countdown}
            onChange={(e) => setCountdown(Number(e.target.value))}
            className="bg-white"
          />

          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold text-green-900">
                Publish Immediately
              </Label>
              <Typography variant="p" className="text-sm text-gray-500">
                Make this game visible to everyone right after saving
              </Typography>
            </div>
            <Switch
              checked={isPublishImmediately}
              onCheckedChange={setIsPublishImmediately}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>

        {/* CHOICES */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-2 border-green-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-2 border-b border-green-100 pb-4 mb-4">
            <div className="h-8 w-2 bg-emerald-500 rounded-full"></div>
            <Typography variant="h4" className="text-green-800 font-bold">
              Answer Choices
            </Typography>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <FormField
                required
                label="Choice A"
                placeholder="Example: Fakta"
                value={choices.A}
                onChange={(e) =>
                  setChoices((prev) => ({ ...prev, A: e.target.value }))
                }
                className="bg-white border-green-300 focus:border-green-500"
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <FormField
                required
                label="Choice B"
                placeholder="Example: Opini"
                value={choices.B}
                onChange={(e) =>
                  setChoices((prev) => ({ ...prev, B: e.target.value }))
                }
                className="bg-white border-emerald-300 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* QUESTIONS HEADER */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Typography variant="h4" className="font-bold text-green-900">
                Questions
              </Typography>
            </div>
            <span className="bg-green-800 text-white px-3 py-1 rounded-full text-sm font-bold">
              {questions.length}/10
            </span>
          </div>
          <Button
            variant="outline"
            className="border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white font-bold transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={addQuestion}
          >
            <Plus className="mr-2 h-5 w-5" /> ADD QUESTION
          </Button>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-2xl border-2 shadow-sm space-y-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
                index % 2 === 0
                  ? "border-green-200 hover:border-green-400"
                  : "border-emerald-200 hover:border-emerald-400"
              }`}
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                      index % 2 === 0 ? "bg-green-600" : "bg-emerald-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <Typography className="font-bold text-gray-700">
                    Question {index + 1}
                  </Typography>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:bg-red-50 transition-colors ${
                    questions.length === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-400 hover:text-red-600"
                  }`}
                  onClick={() => removeQuestion(index)}
                  disabled={questions.length === 1}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              <TextareaField
                required
                label="Question Text"
                placeholder="Example: Matahari terbit dari timur"
                rows={3}
                value={q.questionText}
                onChange={(e) => {
                  const newQ = [...questions];
                  newQ[index].questionText = e.target.value;
                  setQuestions(newQ);
                }}
                className="bg-gray-50 focus:bg-white transition-colors"
              />

              <div className="bg-gray-50 p-4 rounded-xl">
                <Label className="font-bold text-gray-700 mb-3 block">
                  Correct Answer
                </Label>
                <RadioGroup
                  value={q.correctAnswer}
                  onValueChange={(val) => {
                    const newQ = [...questions];
                    newQ[index].correctAnswer = val as "A" | "B";
                    setQuestions(newQ);
                  }}
                  className="flex gap-4 mt-2"
                >
                  <div
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      q.correctAnswer === "A"
                        ? "border-green-600 bg-green-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-green-300"
                    }`}
                  >
                    <RadioGroupItem
                      value="A"
                      id={`q${index}-a`}
                      className="text-green-700 border-green-700"
                    />
                    <Label
                      htmlFor={`q${index}-a`}
                      className="text-green-800 font-bold cursor-pointer flex-1"
                    >
                      {choices.A || "Choice A"}
                    </Label>
                  </div>

                  <div
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      q.correctAnswer === "B"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <RadioGroupItem
                      value="B"
                      id={`q${index}-b`}
                      className="text-emerald-600 border-emerald-600"
                    />
                    <Label
                      htmlFor={`q${index}-b`}
                      className="text-emerald-800 font-bold cursor-pointer flex-1"
                    >
                      {choices.B || "Choice B"}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          ))}
        </div>

        {/* ACTION */}
        <div className="flex justify-end pt-6 pb-12">
          <Button
            className="bg-gradient-to-r from-green-700 to-emerald-600 text-white hover:opacity-90 shadow-lg hover:shadow-green-200/50 transition-all transform hover:-translate-y-1 px-8 py-6 text-lg font-bold rounded-xl"
            onClick={handleSubmit}
          >
            <SaveIcon className="mr-2 h-6 w-6" /> SAVE GAME
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateTrueOrFalse;
