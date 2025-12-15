import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import Dropzone from "@/components/ui/dropzone";
import { ArrowLeft, EyeIcon, Plus, SaveIcon, Trash2, X } from "lucide-react";
import { createHangmanTemplate, updateHangmanTemplate } from "@/api/hangman";
import api from "@/api/axios";

interface QuestionItem {
  question: string;
  answer: string;
}

function CreateHangmanTemplate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<
    string | null
  >(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [isQuestionShuffled, setIsQuestionShuffled] = useState(false);
  const [scorePerQuestion, setScorePerQuestion] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .get(`/api/game/game-type/hangman/${id}`)
        .then((res) => {
          const data = res.data.data;
          setTitle(data.name || "");
          setDescription(data.description || "");
          setQuestions(
            data.game_json?.questions?.map(
              (q: { question: string; answer: string }) => ({
                question: q.question,
                answer: q.answer,
              }),
            ) || [],
          );
          setIsQuestionShuffled(!!data.game_json?.is_question_shuffled);
          setScorePerQuestion(data.game_json?.score_per_question || 10);
          setExistingThumbnailUrl(
            data.thumbnail_image
              ? `${import.meta.env.VITE_API_URL}/${data.thumbnail_image}`
              : null,
          );
        })
        .catch(() => {
          toast.error("Failed to fetch game data");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { question: "", answer: "" }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 2) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const validateAnswerFormat = (answer: string): boolean => {
    // Only allow letters (A-Z, a-z) and spaces
    return /^[a-zA-Z\s]+$/.test(answer.trim());
  };

  const handleSubmit = async (publish = false) => {
    if (!id && !thumbnail) return toast.error("Thumbnail is required");
    if (!title.trim()) return toast.error("Game title is required");
    if (questions.length < 2)
      return toast.error("Minimum 2 questions required");

    // Validate all questions have content
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        return toast.error(`Question ${i + 1} cannot be empty`);
      }
      if (!questions[i].answer.trim()) {
        return toast.error(`Answer ${i + 1} cannot be empty`);
      }
      if (!validateAnswerFormat(questions[i].answer)) {
        return toast.error(
          `Answer ${i + 1} must contain only letters and spaces`,
        );
      }
    }

    try {
      if (id) {
        // Update existing game
        await updateHangmanTemplate(id, {
          name: title,
          description,
          is_question_shuffled: isQuestionShuffled,
          score_per_question: scorePerQuestion,
          questions: questions.map((q) => ({
            question: q.question,
            answer: q.answer.toUpperCase().trim(),
          })),
          is_publish_immediately: publish,
          ...(thumbnail && { thumbnail }),
        });
      } else {
        // Create new game
        await createHangmanTemplate({
          name: title,
          description,
          is_question_shuffled: isQuestionShuffled,
          score_per_question: scorePerQuestion,
          questions: questions.map((q) => ({
            question: q.question,
            answer: q.answer.toUpperCase().trim(),
          })),
          thumbnail: thumbnail!,
          is_publish_immediately: publish,
        });
      }
      toast.success(
        id ? "Game updated successfully!" : "Game created successfully!",
      );
      navigate("/my-projects", { state: { refresh: true } });
    } catch (err) {
      console.error("Error saving game:", err);
      toast.error(id ? "Failed to update game" : "Failed to create game");
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4 shadow-sm">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="text-xl font-bold text-slate-900">
          {id ? "Edit" : "Create"} Hangman Game
        </h1>
        <div className="w-20"></div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="flex-1 px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Form Card */}
            <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 border border-slate-200">
              {/* Title & Description */}
              <div className="space-y-4">
                <FormField
                  label="Game Title"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <TextareaField
                  label="Description (Optional)"
                  placeholder="Describe your game..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold mb-2 block">
                  Thumbnail Image *
                </Label>
                {thumbnail ? (
                  <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-slate-600">
                    <img
                      src={URL.createObjectURL(thumbnail)}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setThumbnail(null)}
                      className="absolute top-2 right-2 bg-red-500 p-1 rounded text-white hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : existingThumbnailUrl ? (
                  <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-slate-600">
                    <img
                      src={existingThumbnailUrl}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setExistingThumbnailUrl(null);
                        setThumbnail(null);
                      }}
                      className="absolute top-2 right-2 bg-slate-900/80 p-1 rounded text-white hover:bg-slate-800"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <Dropzone
                    onChange={(file: File | null) => setThumbnail(file)}
                  />
                )}
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Questions & Answers
                  </h3>
                  <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {questions.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-slate-700 font-medium">
                          Question {index + 1}
                        </span>
                        {questions.length > 2 && (
                          <button
                            onClick={() => removeQuestion(index)}
                            className="p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="e.g., What is the largest animal?"
                          value={item.question}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "question",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white text-slate-900 rounded border border-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Answer (letters & spaces only, will be uppercase)"
                          value={item.answer}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "answer",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white text-slate-900 rounded border border-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Min Questions Warning */}
                {questions.length < 2 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
                    Minimum 2 questions required
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-slate-900 font-semibold">Game Settings</h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isQuestionShuffled}
                    onChange={(e) => setIsQuestionShuffled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">
                    Shuffle questions order
                  </span>
                </label>

                <div className="space-y-2">
                  <label className="text-slate-700 font-medium text-sm">
                    Score per correct answer
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={scorePerQuestion}
                    onChange={(e) =>
                      setScorePerQuestion(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => navigate("/my-projects")}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  className="flex-1"
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>

                <Button onClick={() => handleSubmit(true)} className="flex-1">
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateHangmanTemplate;
