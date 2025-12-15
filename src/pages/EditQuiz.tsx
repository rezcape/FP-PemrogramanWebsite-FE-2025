import { useEffect, useState } from "react";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { quizSchema } from "@/validation/quizSchema";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface Answer {
  text: string;
  isCorrect: boolean;
}

type MaybeFileOrUrl = File | string | null;

interface Question {
  questionText: string;
  questionImages: MaybeFileOrUrl;
  answers: Answer[];
}

interface ApiAnswer {
  answer_text?: string;
  is_correct?: boolean;
}

interface ApiQuestion {
  question_text?: string;
  question_image?: string | null;
  answers?: ApiAnswer[];
}

/** Payload types for backend */
interface QuestionPayload {
  question_text: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
  // optional: either number (index in files_to_upload array) or string (existing path)
  question_image_array_index?: number | string;
}

function EditQuiz() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      questionImages: null,
      answers: Array(4).fill({ text: "", isCorrect: false }),
    },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    isQuestionRandomized: false,
    isAnswerRandomized: false,
    scorePerQuestion: 1,
  });

  useEffect(() => {
    if (!id) return setLoading(false);

    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/game/game-type/quiz/${id}`);
        const data = res.data.data;

        setTitle(data.name || "");
        setDescription(data.description || "");

        if (data.thumbnail_image) {
          setThumbnailPreview(
            `${import.meta.env.VITE_API_URL}/${data.thumbnail_image}`,
          );
        } else setThumbnailPreview(null);
        setThumbnail(null);

        const mappedQuestions: Question[] = (
          data.game_json?.questions || []
        ).map((q: ApiQuestion) => ({
          questionText: q.question_text || "",
          questionImages: q.question_image
            ? q.question_image.startsWith("http")
              ? q.question_image
              : `${import.meta.env.VITE_API_URL}/${q.question_image}`
            : null,
          answers: (q.answers || []).map((a: ApiAnswer) => ({
            text: a.answer_text ?? "",
            isCorrect: Boolean(a.is_correct),
          })),
        }));

        const normalized = mappedQuestions.map((q) => {
          const arr = q.answers.slice(0, 4);
          while (arr.length < 4) arr.push({ text: "", isCorrect: false });
          return { ...q, answers: arr };
        });

        setQuestions(
          normalized.length
            ? normalized
            : [
                {
                  questionText: "",
                  questionImages: null,
                  answers: Array(4).fill({ text: "", isCorrect: false }),
                },
              ],
        );

        setSettings({
          isPublishImmediately: !!data.is_published,
          isQuestionRandomized: !!data.game_json?.is_question_randomized,
          isAnswerRandomized: !!data.game_json?.is_answer_randomized,
          scorePerQuestion: Number(data.game_json?.score_per_question ?? 1),
        });
      } catch {
        toast.error("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        questionImages: null,
        answers: Array(4).fill({ text: "", isCorrect: false }),
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (qIndex: number, newData: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, ...newData } : q)),
    );
  };

  const clearFormError = (key: string) => {
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleAnswerChange = (
    qIndex: number,
    aIndex: number,
    value: string,
  ) => {
    const newAnswers = [...questions[qIndex].answers];
    newAnswers[aIndex] = { ...newAnswers[aIndex], text: value };
    updateQuestion(qIndex, { answers: newAnswers });
    clearFormError(`questions.${qIndex}.answers.${aIndex}.text`);
  };

  const handleCorrectAnswer = (qIndex: number, aIndex: number) => {
    const newAnswers = questions[qIndex].answers.map((a, i) => ({
      ...a,
      isCorrect: i === aIndex,
    }));
    updateQuestion(qIndex, { answers: newAnswers });

    setFormErrors((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach(
        (k) => k.startsWith(`questions.${qIndex}`) && delete copy[k],
      );
      return copy;
    });
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    updateQuestion(qIndex, { questionText: value });
    clearFormError(`questions.${qIndex}.questionText`);
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    if (file) setThumbnailPreview(URL.createObjectURL(file));
    clearFormError("thumbnail");
  };

  const handleQuestionImageChange = (qIndex: number, file: File | null) => {
    updateQuestion(qIndex, { questionImages: file });
  };

  const handleSubmit = async (publish = false) => {
    // quick thumbnail requirement
    if (!thumbnail && !thumbnailPreview) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Thumbnail is required",
      }));
      return toast.error("Thumbnail is required");
    }

    // build validation payload
    const validationPayload = {
      title,
      description,
      thumbnail: thumbnail ?? null,
      questions: questions.map((q) => ({
        questionText: q.questionText,
        questionImages:
          q.questionImages instanceof File ? q.questionImages : null,
        answers: q.answers.map((a) => ({
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      })),
      settings: {
        isPublishImmediately: publish || settings.isPublishImmediately,
        isQuestionRandomized: settings.isQuestionRandomized,
        isAnswerRandomized: settings.isAnswerRandomized,
        scorePerQuestion: settings.scorePerQuestion,
      },
    };

    let schemaToUse: z.ZodTypeAny = quizSchema;
    if (!thumbnail && thumbnailPreview) {
      schemaToUse = quizSchema.extend({
        thumbnail: z.union([z.string().url(), z.null()]),
      });
    }

    const result = schemaToUse.safeParse(validationPayload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      setFormErrors(fieldErrors);
      toast.error("Please fix the highlighted errors");
      return;
    }

    const formData = new FormData();
    formData.append("name", title);
    if (description) formData.append("description", description);

    if (thumbnail instanceof File) {
      formData.append("thumbnail_image", thumbnail);
    }

    formData.append(
      "is_publish",
      String(publish || settings.isPublishImmediately),
    );
    formData.append(
      "is_question_randomized",
      String(settings.isQuestionRandomized),
    );
    formData.append(
      "is_answer_randomized",
      String(settings.isAnswerRandomized),
    );
    formData.append("score_per_question", String(settings.scorePerQuestion));

    const filesToUpload: File[] = [];
    const questionImageFileIndex: (number | string | undefined)[] = new Array(
      questions.length,
    );

    questions.forEach((q, qi) => {
      if (q.questionImages instanceof File) {
        questionImageFileIndex[qi] = filesToUpload.length;
        filesToUpload.push(q.questionImages);
      } else if (typeof q.questionImages === "string") {
        const base = import.meta.env.VITE_API_URL ?? "";
        const relative = q.questionImages.replace(base + "/", "");
        questionImageFileIndex[qi] = relative;
      } else {
        questionImageFileIndex[qi] = undefined;
      }
    });

    filesToUpload.forEach((f) => {
      formData.append("files_to_upload[]", f);
    });

    const questionsPayload: QuestionPayload[] = questions.map((q, qi) => {
      const payload: QuestionPayload = {
        question_text: q.questionText,
        answers: q.answers.map((a) => ({
          answer_text: a.text,
          is_correct: a.isCorrect,
        })),
      };
      const idx = questionImageFileIndex[qi];
      if (idx !== undefined) {
        payload.question_image_array_index = idx as number | string;
      }
      return payload;
    });

    formData.append("questions", JSON.stringify(questionsPayload));

    try {
      setLoading(true);
      await api.patch(`/api/game/game-type/quiz/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Quiz updated successfully!");
      navigate("/my-projects");
    } catch {
      toast.error("Failed to update quiz");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );

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

      <div className="w-full h-full p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full space-y-6">
          <div>
            <Typography variant="h3">Edit Quiz Game</Typography>
            <Typography variant="p" className="mt-2">
              Update your quiz. Changes will be saved when you click Save or
              Publish.
            </Typography>
          </div>

          <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
            <FormField
              required
              label="Game Title"
              placeholder="Title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFormError("title");
              }}
            />
            {formErrors["title"] && (
              <p className="text-sm text-red-500">{formErrors["title"]}</p>
            )}

            <TextareaField
              label="Description"
              placeholder="Describe your quiz game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Dropzone
              required
              defaultValue={thumbnailPreview ?? undefined}
              label="Thumbnail Image"
              allowedTypes={["image/png", "image/jpeg"]}
              maxSize={2 * 1024 * 1024}
              onChange={handleThumbnailChange}
            />
            {formErrors["thumbnail"] && (
              <p className="text-sm text-red-500">{formErrors["thumbnail"]}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Typography variant="p">Questions ({questions.length})</Typography>
            <Button variant="outline" onClick={addQuestion}>
              <Plus /> Add Question
            </Button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white w-full p-6 space-y-6 rounded-xl border"
            >
              <div className="flex justify-between items-center">
                <Typography variant="p">Question {qIndex + 1}</Typography>
                <Trash2
                  size={20}
                  className={`${questions.length === 1 ? "text-gray-300 cursor-not-allowed" : "text-red-500 cursor-pointer"}`}
                  onClick={() => removeQuestion(qIndex)}
                />
              </div>

              <TextareaField
                required
                label="Question"
                placeholder="Type your question here"
                rows={4}
                value={q.questionText}
                onChange={(e) =>
                  handleQuestionTextChange(qIndex, e.target.value)
                }
              />
              {formErrors[`questions.${qIndex}.questionText`] && (
                <p className="text-sm text-red-500">
                  {formErrors[`questions.${qIndex}.questionText`]}
                </p>
              )}

              <Dropzone
                defaultValue={
                  typeof q.questionImages === "string"
                    ? q.questionImages
                    : undefined
                }
                label="Question Image"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => handleQuestionImageChange(qIndex, file)}
              />

              <div className="grid gap-1.5">
                <Label className="mb-2">
                  Answer Options <span className="text-red-500">*</span>
                </Label>
                <div className="flex space-x-4">
                  <div className="space-y-3 mt-3 w-full">
                    {q.answers.map((a, aIndex) => {
                      const errorKey = `questions.${qIndex}.answers.${aIndex}.text`;
                      return (
                        <div key={aIndex} className="flex flex-col">
                          <Input
                            placeholder={`${aIndex + 1}`}
                            className="bg-[#F3F3F5]"
                            value={a.text}
                            onChange={(e) =>
                              handleAnswerChange(qIndex, aIndex, e.target.value)
                            }
                          />
                          {formErrors[errorKey] && (
                            <p className="text-sm text-red-500 mt-1">
                              {formErrors[errorKey]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <RadioGroup
                    value={String(q.answers.findIndex((a) => a.isCorrect))}
                    onValueChange={(val) =>
                      handleCorrectAnswer(qIndex, Number(val))
                    }
                  >
                    {q.answers.map((_, aIndex) => (
                      <div key={aIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={aIndex.toString()} />
                        <Label className="font-normal">Correct</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white w-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Questions</Label>
                <Typography variant="small">
                  Randomize questions order for each player
                </Typography>
              </div>
              <Switch
                checked={settings.isQuestionRandomized}
                onCheckedChange={(val) =>
                  setSettings((prev) => ({
                    ...prev,
                    isQuestionRandomized: val,
                  }))
                }
              />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Answers</Label>
                <Typography variant="small">
                  Randomize answer options for each question
                </Typography>
              </div>
              <Switch
                checked={settings.isAnswerRandomized}
                onCheckedChange={(val) =>
                  setSettings((prev) => ({ ...prev, isAnswerRandomized: val }))
                }
              />
            </div>
            <FormField
              label="Score Per Question"
              placeholder="1"
              type="number"
              value={String(settings.scorePerQuestion)}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  scorePerQuestion: Number(e.target.value),
                }))
              }
            />
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
              disabled={questions.length === 1}
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

export default EditQuiz;
