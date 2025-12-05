import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, Trash2, EyeIcon } from "lucide-react";
import { useFetchImageQuizDetail } from "@/api/image-quiz/useFetchImageQuizDetail";
import { updateImageQuiz } from "@/api/image-quiz/useUpdateImageQuiz";
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
  answer_id: string;
  text: string;
  isCorrect: boolean;
}

type MaybeFileOrUrl = File | string | null;

interface Question {
  question_id: string;
  questionText: string;
  questionImages: MaybeFileOrUrl;
  answers: Answer[];
  correct_answer_id: string;
}

function EditImageQuiz() {
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
      question_id: uuidv4(),
      questionText: "",
      questionImages: null,
      answers: Array(3).fill({
        answer_id: uuidv4(),
        text: "",
        isCorrect: false,
      }),
      correct_answer_id: "",
    },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    isQuestionRandomized: false,
    isAnswerRandomized: false,
  });

  const {
    data: fetchedQuizData,
    loading: fetchingQuiz,
    error: fetchError,
  } = useFetchImageQuizDetail(id);

  useEffect(() => {
    if (fetchingQuiz) {
      setLoading(true);
      return;
    }
    setLoading(false);

    if (fetchError) {
      toast.error(fetchError);
      return;
    }

    if (!fetchedQuizData) return;

    setTitle(fetchedQuizData.name || "");
    setDescription(fetchedQuizData.description || "");

    if (fetchedQuizData.thumbnail_image) {
      setThumbnailPreview(
        `${import.meta.env.VITE_API_URL}/${fetchedQuizData.thumbnail_image}`,
      );
    } else setThumbnailPreview(null);
    setThumbnail(null);

    const mappedQuestions: Question[] = (
      fetchedQuizData.game_json?.questions || []
    ).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: any) => ({
        question_id: q.question_id || uuidv4(),
        questionText: q.questionText || "",
        questionImages: q.questionImages, // Already formatted by hook
        correct_answer_id: q.correct_answer_id || "",
        answers: (q.answers || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any) => ({
            answer_id: a.answer_id || uuidv4(),
            text: a.text ?? "",
            isCorrect: a.isCorrect,
          }),
        ),
      }),
    );

    const normalized = mappedQuestions.map((q) => {
      const arr = q.answers.slice(0, 3);
      while (arr.length < 3)
        arr.push({ answer_id: uuidv4(), text: "", isCorrect: false });
      return { ...q, answers: arr };
    });

    setQuestions(
      normalized.length
        ? normalized
        : [
            {
              question_id: uuidv4(),
              questionText: "",
              questionImages: null,
              answers: Array(3).fill({
                answer_id: uuidv4(),
                text: "",
                isCorrect: false,
              }),
              correct_answer_id: "",
            },
          ],
    );

    setSettings({
      isPublishImmediately: !!fetchedQuizData.is_published,
      isQuestionRandomized: !!fetchedQuizData.game_json?.is_question_randomized,
      isAnswerRandomized: !!fetchedQuizData.game_json?.is_answer_randomized,
    });
  }, [id, fetchedQuizData, fetchingQuiz, fetchError]);

  const addRound = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_id: uuidv4(),
        questionText: "",
        questionImages: null,
        answers: Array(3).fill({
          answer_id: uuidv4(),
          text: "",
          isCorrect: false,
        }),
        correct_answer_id: "",
      },
    ]);
  };

  const removeRound = (index: number) => {
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
    updateQuestion(qIndex, {
      answers: newAnswers,
      correct_answer_id: newAnswers[aIndex].answer_id,
    });
    // Clear related errors
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy[`questions.${qIndex}.answers`];
      delete copy[`questions.${qIndex}.correct_answer_id`];
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
    clearFormError(`questions.${qIndex}.questionImages`);
  };

  const handleSubmit = async (publish = false) => {
    // 1. Validate Thumbnail
    if (!thumbnail && !thumbnailPreview) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Thumbnail is required",
      }));
      return toast.error("Thumbnail is required");
    }

    // 2. Manual Validation based on new schema
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors["title"] = "Title is required";
      hasError = true;
    }

    questions.forEach((q, i) => {
      if (!q.questionImages) {
        newErrors[`questions.${i}.questionImages`] =
          "Image is required for this round";
        hasError = true;
      }

      if (!q.questionText.trim()) {
        newErrors[`questions.${i}.questionText`] = "Category is required";
        hasError = true;
      }

      if (!q.correct_answer_id) {
        newErrors[`questions.${i}.correct_answer_id`] =
          "One correct answer must be selected";
        hasError = true;
      }

      q.answers.forEach((a, ai) => {
        if (!a.text.trim()) {
          newErrors[`questions.${i}.answers.${ai}.text`] =
            "Answer text required";
          hasError = true;
        }
      });
    });

    if (hasError) {
      setFormErrors(newErrors);
      return toast.error("Please fix the highlighted errors");
    }

    try {
      setLoading(true);
      // Panggil hook updateImageQuiz
      await updateImageQuiz({
        game_id: id!,
        title,
        description,
        thumbnail: thumbnail ?? undefined,
        questions: questions.map((q) => ({
          question_id: q.question_id,
          questionText: q.questionText,
          questionImages: q.questionImages,
          answers: q.answers,
          correct_answer_id: q.correct_answer_id,
        })),
        settings: {
          isPublishImmediately: publish || settings.isPublishImmediately,
          isQuestionRandomized: settings.isQuestionRandomized,
          isAnswerRandomized: settings.isAnswerRandomized,
        },
      });
      toast.success("Image Quiz updated successfully!");
      navigate("/my-projects");
    } catch (err) {
      console.error(err);
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
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4 border-b">
        <Button
          size="sm"
          variant="ghost"
          className="flex gap-2"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <Typography variant="h4" className="font-bold">
          Edit Image Quiz
        </Typography>
        <div className="w-[70px]"></div>
      </div>

      <div className="w-full h-full p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          <div className="bg-white w-full p-8 space-y-6 rounded-xl border shadow-sm">
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
              <p className="text-sm text-red-500 mt-1">{formErrors["title"]}</p>
            )}

            <TextareaField
              label="Description"
              placeholder="Describe your quiz game"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Dropzone
              required
              defaultValue={thumbnailPreview ?? undefined}
              label="Game Thumbnail"
              allowedTypes={["image/png", "image/jpeg"]}
              maxSize={2 * 1024 * 1024}
              onChange={handleThumbnailChange}
            />
            {formErrors["thumbnail"] && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors["thumbnail"]}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <Typography variant="h3">Game Rounds</Typography>
              <Typography variant="p" className="text-gray-500">
                Each round has a hidden image and answer options.
              </Typography>
            </div>
            <Button variant="default" onClick={addRound} className="gap-2">
              <Plus size={16} /> Add Round
            </Button>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-white w-full p-6 rounded-xl border shadow-sm"
              >
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {qIndex + 1}
                    </div>
                    <Typography variant="h4" className="text-lg">
                      Round {qIndex + 1}
                    </Typography>
                  </div>
                  <Trash2
                    size={20}
                    className={`${questions.length === 1 ? "text-gray-300 cursor-not-allowed" : "text-red-500 cursor-pointer hover:text-red-700"}`}
                    onClick={() => removeRound(qIndex)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">
                        Hidden Image (Target){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Dropzone
                        defaultValue={
                          typeof q.questionImages === "string"
                            ? q.questionImages
                            : undefined
                        }
                        label={
                          q.questionImages ? "Change Image" : "Upload Image"
                        }
                        allowedTypes={["image/png", "image/jpeg"]}
                        maxSize={2 * 1024 * 1024}
                        onChange={(file) =>
                          handleQuestionImageChange(qIndex, file)
                        }
                      />
                      {formErrors[`questions.${qIndex}.questionImages`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors[`questions.${qIndex}.questionImages`]}
                        </p>
                      )}
                    </div>

                    <TextareaField
                      required
                      label="Category"
                      placeholder="e.g. Identify the hidden object"
                      rows={2}
                      value={q.questionText}
                      onChange={(e) =>
                        handleQuestionTextChange(qIndex, e.target.value)
                      }
                    />
                    {formErrors[`questions.${qIndex}.questionText`] && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors[`questions.${qIndex}.questionText`]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label>
                      Answer Options <span className="text-red-500">*</span>
                    </Label>
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                      <RadioGroup
                        value={String(q.answers.findIndex((a) => a.isCorrect))}
                        onValueChange={(val) =>
                          handleCorrectAnswer(qIndex, Number(val))
                        }
                      >
                        {q.answers.map((a, aIndex) => (
                          <div key={aIndex} className="flex items-center gap-3">
                            <RadioGroupItem value={aIndex.toString()} />
                            <div className="flex-1">
                              <Input
                                placeholder={`Option ${aIndex + 1}`}
                                className={`bg-white ${a.isCorrect ? "border-green-500 ring-1 ring-green-500" : ""}`}
                                value={a.text}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    qIndex,
                                    aIndex,
                                    e.target.value,
                                  )
                                }
                              />
                              {formErrors[
                                `questions.${qIndex}.answers.${aIndex}.text`
                              ] && (
                                <p className="text-sm text-red-500 mt-1 text-xs">
                                  {
                                    formErrors[
                                      `questions.${qIndex}.answers.${aIndex}.text`
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                      {formErrors[`questions.${qIndex}.answers`] && (
                        <p className="text-sm text-red-500 mt-1 text-center">
                          {formErrors[`questions.${qIndex}.answers`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white w-full p-6 space-y-6 rounded-xl border shadow-sm mt-8">
            <div className="border-b pb-4">
              <Typography variant="h4">Game Settings</Typography>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Rounds</Label>
                <Typography variant="small" className="text-gray-500">
                  Randomize the order of images for each player
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
                <Typography variant="small" className="text-gray-500">
                  Randomize answer options for each round
                </Typography>
              </div>
              <Switch
                checked={settings.isAnswerRandomized}
                onCheckedChange={(val) =>
                  setSettings((prev) => ({ ...prev, isAnswerRandomized: val }))
                }
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end w-full pt-8 pb-20">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive">
                  Discard
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
              size="lg"
              variant="outline"
              onClick={() => handleSubmit(false)}
            >
              <SaveIcon size={18} className="mr-2" /> Save Draft
            </Button>
            <Button
              disabled={questions.length < 1}
              size="lg"
              variant="default"
              className="bg-black text-white"
              onClick={() => handleSubmit(true)}
            >
              <EyeIcon size={18} className="mr-2" /> Publish Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditImageQuiz;
