import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
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
        questionImages: q.questionImages,
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

    // Ensure we have at least 2 questions
    const finalQuestions = normalized;
    while (finalQuestions.length < 2) {
      finalQuestions.push({
        question_id: uuidv4(),
        questionText: "",
        questionImages: null,
        answers: Array(3).fill({
          answer_id: uuidv4(),
          text: "",
          isCorrect: false,
        }),
        correct_answer_id: "",
      });
    }

    setQuestions(finalQuestions);

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
    if (questions.length <= 2) return;
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
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!thumbnail && !thumbnailPreview) {
      newErrors["thumbnail"] = "Thumbnail is required";
      hasError = true;
    }

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
      toast.error("Please fill in all required fields.");

      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector(".text-red-500");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    try {
      setLoading(true);
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
      // Toast handled by hook
    } finally {
      setLoading(false);
    }
  };

  // --- Adventure Time Styles ---
  const adventureStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Nunito:wght@400;600;700&display=swap');
      
      .font-adventure { font-family: 'Fredoka', sans-serif; }
      .font-body { font-family: 'Nunito', sans-serif; }
      
      .at-card {
        background-color: white;
        border: 3px solid #1a1a1a;
        border-radius: 1.5rem;
        box-shadow: 6px 6px 0px 0px #1a1a1a;
        transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
      }
      .at-card:hover {
        transform: translateY(-5px);
        box-shadow: 8px 8px 0px 0px #1a1a1a;
      }
      
      .at-input {
        border: 3px solid #1a1a1a !important;
        border-radius: 1rem !important;
        background-color: #F0F8FF !important; /* AliceBlue */
        font-family: 'Nunito', sans-serif !important;
        font-weight: 600 !important;
        padding: 1.25rem !important;
        box-shadow: 2px 2px 0px 0px #1a1a1a !important;
        transition: all 0.2s !important;
      }
      .at-input:focus {
        background-color: #FFF !important;
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0px 0px #1a1a1a !important;
      }
      
      .at-btn-jake {
        background-color: #FFD93D !important; /* Jake Yellow */
        color: #1a1a1a !important;
        border: 3px solid #1a1a1a !important;
        border-radius: 1rem !important;
        font-family: 'Fredoka', sans-serif !important;
        font-weight: 700 !important;
        box-shadow: 4px 4px 0px 0px #1a1a1a !important;
        letter-spacing: 0.05em;
        transition: all 0.1s !important;
        padding: 0.75rem 1.5rem !important; /* py-3 px-6 */
        height: auto !important;
      }
      .at-btn-jake:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0px 0px #1a1a1a !important;
        background-color: #FFE066 !important;
      }
      .at-btn-jake:active {
        transform: translate(2px, 2px);
        box-shadow: 0px 0px 0px 0px #1a1a1a !important;
      }

      .at-btn-bmo {
        background-color: #5BC0BE !important; /* BMO Teal */
        color: white !important;
        border: 3px solid #1a1a1a !important;
        border-radius: 1rem !important;
        font-family: 'Fredoka', sans-serif !important;
        font-weight: 700 !important;
        box-shadow: 4px 4px 0px 0px #1a1a1a !important;
        padding: 0.75rem 1.5rem !important; /* py-3 px-6 */
        height: auto !important;
      }
      .at-btn-bmo:hover {
        background-color: #6FD1CF !important;
        transform: translate(-1px, -1px);
        box-shadow: 5px 5px 0px 0px #1a1a1a !important;
      }

      .at-btn-marcy {
        background-color: #E74C3C !important; /* Red */
        color: white !important;
        border: 3px solid #1a1a1a !important;
        border-radius: 1rem !important;
        font-family: 'Fredoka', sans-serif !important;
        font-weight: 700 !important;
        box-shadow: 4px 4px 0px 0px #1a1a1a !important;
        padding: 0.75rem 1.5rem !important; /* py-3 px-6 */
        height: auto !important;
      }


      .at-label {
        font-family: 'Fredoka', sans-serif;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
      }
    `}</style>
  );

  if (loading)
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#48C9B0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
      </div>
    );

  return (
    <div className="w-full min-h-screen flex flex-col font-adventure bg-[#48C9B0] relative overflow-x-hidden">
      {adventureStyles}

      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#5BC0BE]/90 backdrop-blur-md h-16 flex justify-between items-center px-8 py-2 border-b-4 border-black shadow-md">
        <Button
          size="sm"
          className="flex gap-2 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft size={20} /> <span className="font-bold">Back</span>
        </Button>
        <Typography
          variant="h4"
          className="font-black text-xl text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-wide uppercase"
        >
          Edit Image Quiz
        </Typography>
        <div className="w-[80px]"></div>
      </div>

      {/* Main Content */}
      <div className="w-full h-full pt-20 pb-10 px-4 md:px-8 flex flex-col items-center relative z-10">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header Text */}
          <div className="text-center">
            <Typography
              variant="h2"
              className="text-white font-black text-4xl drop-shadow-[3px_3px_0px_#000]"
            >
              Game Details
            </Typography>
            <Typography
              variant="p"
              className="text-white/90 font-bold text-lg mt-1 drop-shadow-md font-body"
            >
              Update the information for your time-based puzzle game.
            </Typography>
          </div>

          {/* Main Info Card */}
          <div className="at-card p-8 space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-black pb-4 mb-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center">
                <Zap className="fill-black" />
              </div>
              <h3 className="text-2xl font-bold">General Information</h3>
            </div>

            <div>
              <label className="at-label">
                <span>
                  Game Title <span className="text-red-500">*</span>
                </span>
              </label>
              <Input
                required
                placeholder="e.g. Guess the Celebrity"
                type="text"
                value={title}
                className="at-input text-lg"
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFormError("title");
                }}
              />
              {formErrors["title"] && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors["title"]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="at-label">Description</label>
              <Textarea
                placeholder="What is this game about?"
                rows={3}
                value={description}
                className="at-input resize-none"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="at-label">
                <span>
                  Game Thumbnail <span className="text-red-500">*</span>
                </span>
              </label>
              <div className="border-4 border-dashed border-black/30 rounded-2xl p-6 bg-gray-50 hover:bg-white transition-colors">
                <Dropzone
                  required
                  defaultValue={thumbnailPreview ?? undefined}
                  label="Upload Game Thumbnail"
                  allowedTypes={["image/png", "image/jpeg"]}
                  maxSize={2 * 1024 * 1024}
                  className="py-3 font-body"
                  onChange={handleThumbnailChange}
                />
              </div>
              {formErrors["thumbnail"] && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors["thumbnail"]}
                </p>
              )}
            </div>
          </div>

          {/* Rounds Header */}
          <div className="flex justify-between items-end pt-4 px-2">
            <div>
              <Typography
                variant="h3"
                className="text-black font-black text-3xl drop-shadow-sm"
              >
                Game Rounds
              </Typography>
              <Typography
                variant="p"
                className="text-black/70 font-bold font-body"
              >
                Add or edit images hidden behind the 16x8 grid.
              </Typography>
            </div>
            <Button
              onClick={addRound}
              className="at-btn-jake px-6 py-6 text-lg flex items-center gap-2"
            >
              <Plus size={24} strokeWidth={3} /> Add Round
            </Button>
          </div>

          {/* Questions / Rounds List */}
          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="at-card p-6 relative">
                {/* Decoration Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#E74C3C] border-2 border-black rotate-1 shadow-sm z-0"></div>

                {/* Round Header */}
                <div className="flex justify-between items-center mb-6 border-b-4 border-black/10 pb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-black text-white rounded-xl w-12 h-12 flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_#7f1d1d]">
                      {qIndex + 1}
                    </div>
                    <Typography
                      variant="h4"
                      className="text-2xl font-bold text-black"
                    >
                      Round {qIndex + 1}
                    </Typography>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                    disabled={questions.length <= 2}
                    onClick={() => removeRound(qIndex)}
                  >
                    <Trash2 size={24} strokeWidth={2.5} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {/* Left Column: Image & Text */}
                  <div className="space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200">
                      <Label className="at-label">
                        <span>
                          Hidden Image (Target){" "}
                          <span className="text-red-500">*</span>
                        </span>
                      </Label>
                      <div className="text-sm text-gray-600 font-medium mb-3 font-body">
                        This image will be covered by a 16x8 grid and revealed
                        over time.
                      </div>
                      <div className="bg-white rounded-xl border-2 border-black shadow-inner p-4">
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
                          className="py-3 font-body"
                          onChange={(file) =>
                            handleQuestionImageChange(qIndex, file)
                          }
                        />
                      </div>
                      {formErrors[`questions.${qIndex}.questionImages`] && (
                        <p className="text-sm text-red-500 mt-2">
                          {formErrors[`questions.${qIndex}.questionImages`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="at-label">
                        <span>
                          Category / Hint{" "}
                          <span className="text-red-500">*</span>
                        </span>
                      </Label>
                      <Textarea
                        required
                        placeholder="e.g. Who is this person?"
                        rows={2}
                        value={q.questionText}
                        className="at-input resize-none"
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
                  </div>

                  {/* Right Column: Answers */}
                  <div className="space-y-4">
                    <Label className="at-label">
                      <span>
                        Answer Options <span className="text-red-500">*</span>
                      </span>
                    </Label>
                    <div className="bg-[#E0F7FA] p-5 rounded-2xl border-2 border-[#B2EBF2] space-y-4 shadow-inner">
                      <RadioGroup
                        value={String(q.answers.findIndex((a) => a.isCorrect))}
                        onValueChange={(val) =>
                          handleCorrectAnswer(qIndex, Number(val))
                        }
                      >
                        {q.answers.map((a, aIndex) => (
                          <div
                            key={aIndex}
                            className="flex items-center gap-3 group"
                          >
                            <RadioGroupItem
                              value={aIndex.toString()}
                              id={`q${qIndex}-a${aIndex}`}
                              className="w-6 h-6 border-2 border-black text-black fill-black"
                            />
                            <div className="flex-1 transition-transform group-hover:scale-[1.02]">
                              <Input
                                placeholder={`Option ${aIndex + 1}`}
                                className={`at-input bg-white ${a.isCorrect ? "border-green-500 ring-2 ring-green-400 bg-green-50 !important" : ""}`}
                                value={a.text}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    qIndex,
                                    aIndex,
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                      {formErrors[`questions.${qIndex}.answers`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors[`questions.${qIndex}.answers`]}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-bold text-center font-body">
                      Select the circle next to the correct answer.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Settings Card */}
          <div className="at-card p-6 mt-8 bg-[#FFF9C4]">
            <div className="border-b-4 border-black/10 pb-4 mb-4">
              <Typography variant="h4" className="font-bold text-xl">
                Game Settings
              </Typography>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-black/5">
                <div>
                  <Label className="text-lg font-bold">Shuffle Rounds</Label>
                  <Typography
                    variant="small"
                    className="text-gray-600 font-medium font-body"
                  >
                    Randomize the order of images for each player
                  </Typography>
                </div>
                <Switch
                  className="data-[state=checked]:bg-green-500 border-2 border-black"
                  checked={settings.isQuestionRandomized}
                  onCheckedChange={(val) =>
                    setSettings((prev) => ({
                      ...prev,
                      isQuestionRandomized: val,
                    }))
                  }
                />
              </div>

              <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-black/5">
                <div>
                  <Label className="text-lg font-bold">Shuffle Answers</Label>
                  <Typography
                    variant="small"
                    className="text-gray-600 font-medium font-body"
                  >
                    Randomize answer options for each round
                  </Typography>
                </div>
                <Switch
                  className="data-[state=checked]:bg-green-500 border-2 border-black"
                  checked={settings.isAnswerRandomized}
                  onCheckedChange={(val) =>
                    setSettings((prev) => ({
                      ...prev,
                      isAnswerRandomized: val,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 justify-end w-full pt-8 pb-20">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="at-btn-marcy px-8 py-6 h-auto text-lg"
                >
                  Discard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-adventure font-bold text-2xl">
                    Discard Changes?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-adventure text-lg text-black">
                    Are you sure you want to cancel? All unsaved changes will be
                    lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-2 border-black rounded-xl font-bold">
                    Keep Editing
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 border-2 border-black rounded-xl font-bold hover:bg-red-700"
                    onClick={() => navigate("/my-projects")}
                  >
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="lg"
              className="at-btn-bmo px-8 py-6 h-auto text-lg"
              onClick={() => handleSubmit(false)}
            >
              Save Draft
            </Button>
            <Button
              disabled={questions.length < 1}
              size="lg"
              className="at-btn-jake px-10 py-6 h-auto text-lg"
              onClick={() => handleSubmit(true)}
            >
              Publish Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditImageQuiz;
