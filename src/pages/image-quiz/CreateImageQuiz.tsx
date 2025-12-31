import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { imageQuizSchema } from "@/validation/imageQuizSchema";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Zap, Plus, Trash2 } from "lucide-react";
import { createImageQuiz } from "@/api/image-quiz/useCreateImageQuiz";
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

interface Question {
  question_id: string;
  questionText: string;
  questionImages: File | null;
  answers: Answer[];
  correct_answer_id: string;
}

const THEME_OPTIONS = [
  {
    id: "adventure",
    name: "Medieval Kingdom",
    description: "Knights, parchment, and royal aesthetics",
    colors: ["#451a03", "#fcd34d", "#e7d5b9"],
  },
  {
    id: "family100",
    name: "Family 100",
    description: "Classic TV Game Show vibe (Default)",
    colors: ["#1e3a8a", "#fbbf24", "#020617"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Hacker",
    description: "Neon lights and terminal aesthetics",
    colors: ["#00f2ff", "#ff00ff", "#050505"],
  },
];

function CreateImageQuiz() {
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    {
      question_id: uuidv4(),
      questionText: "",
      questionImages: null,
      answers: [
        { answer_id: uuidv4(), text: "", isCorrect: false },
        { answer_id: uuidv4(), text: "", isCorrect: false },
        { answer_id: uuidv4(), text: "", isCorrect: false },
      ],
      correct_answer_id: "",
    },
    {
      question_id: uuidv4(),
      questionText: "",
      questionImages: null,
      answers: [
        { answer_id: uuidv4(), text: "", isCorrect: false },
        { answer_id: uuidv4(), text: "", isCorrect: false },
        { answer_id: uuidv4(), text: "", isCorrect: false },
      ],
      correct_answer_id: "",
    },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    isQuestionRandomized: false,
    isAnswerRandomized: false,
    theme: "family100",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const addRound = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_id: uuidv4(),
        questionText: "",
        questionImages: null,
        answers: [
          { answer_id: uuidv4(), text: "", isCorrect: false },
          { answer_id: uuidv4(), text: "", isCorrect: false },
          { answer_id: uuidv4(), text: "", isCorrect: false },
        ],
        correct_answer_id: "",
      },
    ]);
  };

  const removeRound = (index: number) => {
    if (questions.length <= 2) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnswerChange = (
    qIndex: number,
    aIndex: number,
    value: string,
  ) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].answers[aIndex].text = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswer = (qIndex: number, aIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].answers = newQuestions[qIndex].answers.map((a, i) => ({
      ...a,
      isCorrect: i === aIndex,
    }));
    newQuestions[qIndex].correct_answer_id =
      newQuestions[qIndex].answers[aIndex].answer_id;
    setQuestions(newQuestions);
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].questionText = value;
    setQuestions(newQuestions);

    if (formErrors[`questions.${qIndex}.questionText`]) {
      const newErrs = { ...formErrors };
      delete newErrs[`questions.${qIndex}.questionText`];
      setFormErrors(newErrs);
    }
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail) {
      setFormErrors((prev) => ({
        ...prev,
        thumbnail: "Thumbnail is required",
      }));
      toast.error("Thumbnail is required");
      return;
    }

    const payloadForValidation = {
      title,
      description,
      thumbnail,
      questions,
      settings: {
        isPublishImmediately: publish,
        isQuestionRandomized: settings.isQuestionRandomized,
        isAnswerRandomized: settings.isAnswerRandomized,
        theme: settings.theme,
      },
    };

    const parseResult = imageQuizSchema.safeParse(payloadForValidation);

    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const errObj: Record<string, string> = {};
      issues.forEach((issue) => {
        const key = issue.path.join(".");
        errObj[key] = issue.message;
      });
      setFormErrors(errObj);
      toast.error("Please fill in all required fields.");
      setTimeout(() => {
        const firstError = document.querySelector(".text-red-500");
        if (firstError)
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    try {
      await createImageQuiz({
        title,
        description,
        thumbnail: thumbnail!, // [FIXED] Added ! assertion
        questions: questions.map((q) => ({
          question_id: q.question_id,
          questionText: q.questionText,
          questionImages: q.questionImages,
          answers: q.answers,
          correct_answer_id: q.correct_answer_id,
        })),
        settings: {
          isPublishImmediately: publish,
          isQuestionRandomized: settings.isQuestionRandomized,
          isAnswerRandomized: settings.isAnswerRandomized,
          theme: settings.theme,
        },
      });

      toast.success(
        publish ? "Game Published Successfully!" : "Draft Saved Successfully!",
      );
      navigate("/my-projects");
    } catch (err) {
      console.error("Failed to create image quiz:", err);
      toast.error("Failed to create quiz. Please try again.");
    }
  };

  const adventureStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Nunito:wght@400;600;700&display=swap');
      .font-adventure { font-family: 'Fredoka', sans-serif; }
      .font-body { font-family: 'Nunito', sans-serif; }
      .at-card { background-color: white; border: 3px solid #1a1a1a; border-radius: 1.5rem; box-shadow: 6px 6px 0px 0px #1a1a1a; transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out; }
      .at-card:hover { transform: translateY(-5px); box-shadow: 8px 8px 0px 0px #1a1a1a; }
      .at-input { border: 3px solid #1a1a1a !important; border-radius: 1rem !important; background-color: #F0F8FF !important; font-family: 'Nunito', sans-serif !important; font-weight: 600 !important; padding: 1.25rem !important; box-shadow: 2px 2px 0px 0px #1a1a1a !important; transition: all 0.2s !important; }
      .at-input:focus { background-color: #FFF !important; transform: translate(-1px, -1px); box-shadow: 4px 4px 0px 0px #1a1a1a !important; }
      .at-btn-jake { background-color: #FFD93D !important; color: #1a1a1a !important; border: 3px solid #1a1a1a !important; border-radius: 1rem !important; font-family: 'Fredoka', sans-serif !important; font-weight: 700 !important; box-shadow: 4px 4px 0px 0px #1a1a1a !important; letter-spacing: 0.05em; transition: all 0.1s !important; padding: 0.75rem 1.5rem !important; height: auto !important; }
      .at-btn-jake:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px 0px #1a1a1a !important; background-color: #FFE066 !important; }
      .at-btn-jake:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px 0px #1a1a1a !important; }
      .at-btn-bmo { background-color: #5BC0BE !important; color: white !important; border: 3px solid #1a1a1a !important; border-radius: 1rem !important; font-family: 'Fredoka', sans-serif !important; font-weight: 700 !important; box-shadow: 4px 4px 0px 0px #1a1a1a !important; padding: 0.75rem 1.5rem !important; height: auto !important; }
      .at-btn-bmo:hover { background-color: #6FD1CF !important; transform: translate(-1px, -1px); box-shadow: 5px 5px 0px 0px #1a1a1a !important; }
      .at-btn-marcy { background-color: #E74C3C !important; color: white !important; border: 3px solid #1a1a1a !important; border-radius: 1rem !important; font-family: 'Fredoka', sans-serif !important; font-weight: 700 !important; box-shadow: 4px 4px 0px 0px #1a1a1a !important; padding: 0.75rem 1.5rem !important; height: auto !important; }
      .at-label { font-family: 'Fredoka', sans-serif; font-weight: 600; color: #1a1a1a; margin-bottom: 0.5rem; font-size: 1.1rem; }
    `}</style>
  );

  return (
    <div className="w-full min-h-screen flex flex-col font-adventure bg-[#48C9B0] relative overflow-x-hidden">
      {adventureStyles}

      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#5BC0BE]/90 backdrop-blur-md h-16 flex justify-between items-center px-8 py-2 border-b-4 border-black shadow-md">
        <Button
          size="sm"
          className="flex gap-2 bg-white text-black border-2 border-black rounded-xl hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft size={20} /> <span className="font-bold">Back</span>
        </Button>
        <Typography
          variant="h4"
          className="font-black text-xl text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-wide uppercase"
        >
          Create Image Quiz
        </Typography>
        <div className="w-[80px]"></div>
      </div>

      <div className="w-full h-full pt-20 pb-10 px-4 md:px-8 flex flex-col items-center relative z-10">
        <div className="max-w-4xl w-full space-y-8">
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
              Set up the main information for your time-based puzzle game.
            </Typography>
          </div>

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
                value={title}
                className="at-input text-lg"
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formErrors["title"]) {
                    const newErrs = { ...formErrors };
                    delete newErrs["title"];
                    setFormErrors(newErrs);
                  }
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
                  label="Upload Game Thumbnail"
                  allowedTypes={["image/png", "image/jpeg"]}
                  maxSize={2 * 1024 * 1024}
                  onChange={(file) => {
                    setThumbnail(file);
                    if (formErrors["thumbnail"]) {
                      const newErrs = { ...formErrors };
                      delete newErrs["thumbnail"];
                      setFormErrors(newErrs);
                    }
                  }}
                />
              </div>
              {formErrors["thumbnail"] && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors["thumbnail"]}
                </p>
              )}
            </div>
          </div>

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
                Add images that will be hidden behind the 16x8 grid.
              </Typography>
            </div>
            <Button
              onClick={addRound}
              className="at-btn-jake px-6 py-6 text-lg flex items-center gap-2"
            >
              <Plus size={24} strokeWidth={3} /> Add Round
            </Button>
          </div>

          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="at-card p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#E74C3C] border-2 border-black rotate-1 shadow-sm z-0"></div>
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
                    onClick={() => {
                      if (questions.length > 2) removeRound(qIndex);
                    }}
                  >
                    <Trash2 size={24} strokeWidth={2.5} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
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
                          label={
                            q.questionImages ? "Change Image" : "Upload Image"
                          }
                          allowedTypes={["image/png", "image/jpeg"]}
                          maxSize={2 * 1024 * 1024}
                          onChange={(file) => {
                            const newQuestions = [...questions];
                            newQuestions[qIndex].questionImages = file;
                            setQuestions(newQuestions);
                            if (
                              formErrors[`questions.${qIndex}.questionImages`]
                            ) {
                              const newErrs = { ...formErrors };
                              delete newErrs[
                                `questions.${qIndex}.questionImages`
                              ];
                              setFormErrors(newErrs);
                            }
                          }}
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
                          Question <span className="text-red-500">*</span>
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

                  <div className="space-y-4">
                    <Label className="at-label">
                      <span>
                        Answer Options <span className="text-red-500">*</span>
                      </span>
                    </Label>
                    <div className="bg-[#E0F7FA] p-5 rounded-2xl border-2 border-[#B2EBF2] space-y-4 shadow-inner">
                      <RadioGroup
                        value={q.answers
                          .findIndex((a) => a.isCorrect)
                          .toString()}
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
              <div className="pt-6 border-t-4 border-black/10 mt-4">
                <div className="mb-4">
                  <Label className="text-lg font-bold">Visual Theme</Label>
                  <Typography
                    variant="small"
                    className="text-gray-600 font-medium font-body"
                  >
                    Choose the look and feel for your game.
                  </Typography>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {THEME_OPTIONS.map((themeOption) => {
                    const isSelected = settings.theme === themeOption.id;
                    return (
                      <div
                        key={themeOption.id}
                        onClick={() =>
                          setSettings({ ...settings, theme: themeOption.id })
                        }
                        className={`cursor-pointer relative overflow-hidden rounded-xl border-4 transition-all duration-200 group ${isSelected ? "border-black bg-white shadow-[4px_4px_0px_0px_#000] scale-[1.02]" : "border-black/10 bg-white/60 hover:bg-white hover:border-black/30"}`}
                      >
                        <div className="h-12 flex w-full border-b-2 border-black/10">
                          <div
                            style={{ background: themeOption.colors[0] }}
                            className="flex-1"
                          ></div>
                          <div
                            style={{ background: themeOption.colors[1] }}
                            className="flex-1"
                          ></div>
                          <div
                            style={{ background: themeOption.colors[2] }}
                            className="flex-1"
                          ></div>
                        </div>
                        <div className="p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span
                              className={`font-bold font-adventure text-lg ${isSelected ? "text-black" : "text-gray-600 group-hover:text-black"}`}
                            >
                              {themeOption.name}
                            </span>
                            {isSelected && (
                              <div className="bg-green-500 text-white rounded-full p-1 border-2 border-black shadow-[1px_1px_0px_#000]">
                                <Zap size={12} fill="white" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-bold font-body leading-tight">
                            {themeOption.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

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

export default CreateImageQuiz;
