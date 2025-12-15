import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { typeTheAnswerSchema } from "@/validation/typeTheAnswerSchema";
import { TextareaField } from "@/components/ui/textarea-field";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, Trash2 } from "lucide-react";
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

interface Question {
  questionText: string;
  correctAnswer: string;
}

function CreateTypeTheAnswer() {
  const navigate = useNavigate();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    { questionText: "", correctAnswer: "" },
  ]);

  const [settings, setSettings] = useState({
    timeLimitSeconds: 180, // Default 3 minutes
    scorePerQuestion: 10,
  });

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { questionText: "", correctAnswer: "" }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("At least one question is required");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].questionText = value;
    setQuestions(newQuestions);
  };

  const handleAnswerChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail) {
      toast.error("Thumbnail is required");
      return;
    }

    const payload = {
      title,
      description,
      thumbnail,
      questions,
      settings: { ...settings, isPublishImmediately: publish },
    };

    const parseResult = typeTheAnswerSchema.safeParse(payload);
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
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", parseResult.data.title);
      if (parseResult.data.description) {
        formData.append("description", parseResult.data.description);
      }
      formData.append("thumbnail_image", parseResult.data.thumbnail);
      formData.append("is_publish_immediately", String(publish));
      formData.append(
        "time_limit_seconds",
        String(parseResult.data.settings.timeLimitSeconds),
      );
      formData.append(
        "score_per_question",
        String(parseResult.data.settings.scorePerQuestion),
      );

      // Add questions as JSON string (backend uses StringToObjectSchema)
      const questionsPayload = parseResult.data.questions.map((q) => ({
        question_text: q.questionText,
        correct_answer: q.correctAnswer,
      }));
      formData.append("questions", JSON.stringify(questionsPayload));

      console.log("Sending FormData to backend...");
      console.log("Endpoint: /api/game/game-type/type-the-answer");

      const response = await api.post(
        "/api/game/game-type/type-the-answer",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Success response:", response.data);
      toast.success("Type the Answer game created successfully!");
      navigate("/my-projects");
    } catch (err) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      console.error("=== ERROR DETAILS ===");
      console.error("Full error:", err);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);
      console.error("====================");

      let errorMessage = "Failed to create game. Please try again.";

      if (error.response?.status === 404) {
        errorMessage =
          "Backend API not found. Please make sure backend is running and endpoint exists.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/create-projects")}
            >
              <ArrowLeft className="mr-2" size={16} />
              Back
            </Button>
            <Typography variant="h3">Create Type the Answer Game</Typography>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              <SaveIcon className="mr-2" size={16} />
              Save as Draft
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isSubmitting}>Publish Now</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will make your game visible to everyone immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSubmit(true)}>
                    Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* Game Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <Typography variant="h4">Game Information</Typography>

          <div>
            <FormField
              label="Game Title"
              placeholder="Enter game title..."
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {formErrors.title && (
              <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <TextareaField
              label="Description"
              placeholder="Enter game description..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.description}
              </p>
            )}
          </div>

          <div>
            <Dropzone
              required
              label="Thumbnail Image"
              allowedTypes={["image/png", "image/jpeg", "image/jpg"]}
              maxSize={5 * 1024 * 1024}
              onChange={(file) => setThumbnail(file)}
            />
            {formErrors.thumbnail && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.thumbnail}
              </p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <Typography variant="h4">Game Settings</Typography>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormField
                label="Time Limit (seconds)"
                type="number"
                value={String(settings.timeLimitSeconds)}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    timeLimitSeconds: parseInt(e.target.value) || 30,
                  }))
                }
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Time: {formatTime(settings.timeLimitSeconds)} (30s - 10min)
              </p>
              {formErrors["settings.timeLimitSeconds"] && (
                <p className="text-sm text-red-500">
                  {formErrors["settings.timeLimitSeconds"]}
                </p>
              )}
            </div>

            <div>
              <FormField
                label="Points per Question"
                type="number"
                value={String(settings.scorePerQuestion)}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    scorePerQuestion: parseInt(e.target.value) || 1,
                  }))
                }
                required
              />
              {formErrors["settings.scorePerQuestion"] && (
                <p className="text-sm text-red-500">
                  {formErrors["settings.scorePerQuestion"]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h4">Questions ({questions.length})</Typography>
            <Button onClick={addQuestion} size="sm" variant="outline">
              <Plus className="mr-2" size={16} />
              Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="border border-slate-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Typography variant="p" className="font-semibold">
                    Question {qIndex + 1}
                  </Typography>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>

                <div>
                  <TextareaField
                    required
                    label="Question Text"
                    placeholder="Enter your question..."
                    rows={2}
                    value={question.questionText}
                    onChange={(e) =>
                      handleQuestionTextChange(qIndex, e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {question.questionText.length}/300 characters
                  </p>
                  {formErrors[`questions.${qIndex}.questionText`] && (
                    <p className="text-sm text-red-500">
                      {formErrors[`questions.${qIndex}.questionText`]}
                    </p>
                  )}
                </div>

                <div>
                  <FormField
                    required
                    label="Correct Answer"
                    placeholder="Enter the correct answer..."
                    type="text"
                    value={question.correctAnswer}
                    onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {question.correctAnswer.length}/50 characters
                  </p>
                  {formErrors[`questions.${qIndex}.correctAnswer`] && (
                    <p className="text-sm text-red-500">
                      {formErrors[`questions.${qIndex}.correctAnswer`]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-indigo-50 rounded-lg p-6 space-y-2">
          <Typography variant="h4" className="text-indigo-700">
            Summary
          </Typography>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Questions</p>
              <p className="text-xl font-semibold">{questions.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Time Limit</p>
              <p className="text-xl font-semibold">
                {formatTime(settings.timeLimitSeconds)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Max Score</p>
              <p className="text-xl font-semibold">
                {questions.length * settings.scorePerQuestion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTypeTheAnswer;
