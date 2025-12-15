import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import {
  ArrowLeft,
  Plus,
  SaveIcon,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
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

function EditTypeTheAnswer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    { questionText: "", correctAnswer: "" },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    timeLimitSeconds: 180,
    scorePerQuestion: 10,
  });

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        console.log("Fetching game with ID:", id);
        const response = await api.get(
          `/api/game/game-type/type-the-answer/${id}`,
        );
        console.log("Game data response:", response.data);
        const data = response.data.data;

        if (!data) {
          throw new Error("No data received from server");
        }

        console.log("Setting form values:", {
          name: data.name,
          description: data.description,
          thumbnail: data.thumbnail_image,
          questions: data.questions,
          settings: {
            isPublished: data.is_published,
            timeLimitSeconds: data.time_limit_seconds,
            scorePerQuestion: data.score_per_question,
          },
        });

        setTitle(data.name || "");
        setDescription(data.description || "");
        setThumbnailUrl(data.thumbnail_image || null);
        setSettings({
          isPublishImmediately: data.is_published || false,
          timeLimitSeconds: data.time_limit_seconds || 180,
          scorePerQuestion: data.score_per_question || 10,
        });

        if (data.questions && data.questions.length > 0) {
          setQuestions(
            data.questions.map(
              (q: { question_text: string; correct_answer: string }) => ({
                questionText: q.question_text || "",
                correctAnswer: q.correct_answer || "",
              }),
            ),
          );
        }

        console.log("Game data loaded successfully");
        console.log(
          "Final state - Title:",
          data.name,
          "Questions:",
          data.questions?.length,
        );
      } catch (err: unknown) {
        console.error("Failed to fetch game:", err);
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        console.error("Error response:", axiosError.response);
        const errorMsg =
          axiosError.response?.data?.message || "Failed to load game data";
        toast.error(errorMsg);
        setError(`Error: ${errorMsg}`);
        // Don't navigate away immediately, let user see the error
        // navigate("/my-projects");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      console.log("Starting to fetch game with ID:", id);
      fetchGame();
    } else {
      console.error("No ID provided");
      setError("No game ID provided");
      setLoading(false);
    }
  }, [id]);

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
    console.log("=== Submit Validation ===");
    console.log("Title:", title);
    console.log("ThumbnailUrl (existing):", thumbnailUrl);
    console.log("Thumbnail (new file):", thumbnail);

    // Manual validation
    if (!title || title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    // Check if thumbnail is required (no existing thumbnail and no new upload)
    if (!thumbnailUrl && !thumbnail) {
      console.log("Validation failed: No thumbnail provided");
      toast.error("Please upload a thumbnail image");
      return;
    }

    console.log("Validation passed: Thumbnail OK");

    if (questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }

    for (const q of questions) {
      if (!q.questionText || q.questionText.length < 3) {
        toast.error("All questions must have text (min 3 characters)");
        return;
      }
      if (!q.correctAnswer || q.correctAnswer.length === 0) {
        toast.error("All questions must have an answer");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", title);
      if (description) {
        formData.append("description", description);
      }

      // Always append thumbnail if user uploaded a new one
      if (thumbnail) {
        console.log(
          "Uploading new thumbnail:",
          thumbnail.name,
          thumbnail.size,
          "bytes",
        );
        formData.append("thumbnail_image", thumbnail);
      } else {
        console.log("No new thumbnail, keeping existing:", thumbnailUrl);
      }

      formData.append("is_publish", String(publish));
      formData.append("time_limit_seconds", String(settings.timeLimitSeconds));
      formData.append("score_per_question", String(settings.scorePerQuestion));

      // Add questions as JSON string (backend uses StringToObjectSchema)
      const questionsPayload = questions.map((q) => ({
        question_text: q.questionText,
        correct_answer: q.correctAnswer,
      }));
      formData.append("questions", JSON.stringify(questionsPayload));

      await api.put(`/api/game/game-type/type-the-answer/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Game updated successfully!");
      navigate("/my-projects");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Failed to update game:", err);
      toast.error(error.response?.data?.message || "Failed to update game");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="h3" className="text-red-500">
          {error}
        </Typography>
        <Button onClick={() => navigate("/my-projects")} variant="outline">
          <ArrowLeft className="mr-2" size={16} />
          Back to My Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/my-projects")}
            >
              <ArrowLeft className="mr-2" size={16} />
              Back
            </Button>
            <Typography variant="h3">Edit Type the Answer Game</Typography>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              <SaveIcon className="mr-2" size={16} />
              Save Changes
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isSubmitting}>
                  {settings.isPublishImmediately
                    ? "Update & Keep Published"
                    : "Publish Now"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will make your game visible to everyone.
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
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <Typography variant="h4">Game Information</Typography>

          <FormField label="Game Title" error={formErrors.title} required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter game title..."
            />
          </FormField>

          <FormField label="Description" error={formErrors.description}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter game description..."
              rows={3}
            />
          </FormField>

          <FormField label="Thumbnail Image" error={formErrors.thumbnail}>
            {thumbnailUrl && !thumbnail ? (
              <div className="mb-3 space-y-2">
                <div className="relative inline-block">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${thumbnailUrl}`}
                    alt="Current thumbnail"
                    className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">Current thumbnail</p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setThumbnailUrl(null);
                      toast.success(
                        "Thumbnail removed. You can now upload a new one.",
                      );
                    }}
                    className="flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Remove
                  </Button>
                </div>
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ Click "Remove" to delete current thumbnail before uploading
                  a new one
                </p>
              </div>
            ) : (
              <>
                <Dropzone
                  label="Upload Thumbnail"
                  onChange={(file) => {
                    console.log("New thumbnail file selected:", file);
                    setThumbnail(file);
                  }}
                  allowedTypes={[
                    "image/png",
                    "image/jpeg",
                    "image/jpg",
                    "image/webp",
                  ]}
                  maxSize={5 * 1024 * 1024}
                />
                {thumbnail && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600 font-medium">
                    <ImageIcon size={16} />
                    {thumbnail.name} (New image selected -{" "}
                    {Math.round(thumbnail.size / 1024)}KB)
                  </div>
                )}
              </>
            )}
          </FormField>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <Typography variant="h4">Game Settings</Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormField
                label="Time Limit (seconds)"
                error={formErrors["settings.timeLimitSeconds"]}
              >
                <Input
                  type="number"
                  min={30}
                  max={600}
                  value={settings.timeLimitSeconds}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      timeLimitSeconds: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </FormField>
              <p className="text-sm text-gray-500 pl-1">
                ⏱️ {formatTime(settings.timeLimitSeconds)} (Range: 30s - 10min)
              </p>
            </div>

            <div className="space-y-2">
              <FormField
                label="Points per Question"
                error={formErrors["settings.scorePerQuestion"]}
              >
                <Input
                  type="number"
                  min={1}
                  value={settings.scorePerQuestion}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      scorePerQuestion: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </FormField>
              <p className="text-sm text-gray-500 pl-1">
                🎯 Each correct answer awards this many points
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Typography variant="h4">Questions</Typography>
            <Button onClick={addQuestion} size="sm">
              <Plus className="mr-2" size={16} />
              Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="border border-slate-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Typography variant="h4">Question {qIndex + 1}</Typography>
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

                <FormField
                  label="Question Text"
                  error={formErrors[`questions.${qIndex}.questionText`]}
                  required
                >
                  <Textarea
                    value={question.questionText}
                    onChange={(e) =>
                      handleQuestionTextChange(qIndex, e.target.value)
                    }
                    placeholder="Enter your question..."
                    rows={2}
                    maxLength={300}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {question.questionText.length}/300 characters
                  </p>
                </FormField>

                <FormField
                  label="Correct Answer"
                  error={formErrors[`questions.${qIndex}.correctAnswer`]}
                  required
                >
                  <Input
                    value={question.correctAnswer}
                    onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                    placeholder="Enter the correct answer..."
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {question.correctAnswer.length}/50 characters
                  </p>
                </FormField>
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

export default EditTypeTheAnswer;
