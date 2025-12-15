import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCreateQuiz } from "@/api/quiz/useCreateQuiz";
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

interface Question {
  questionText: string;
  questionImages: File | null;

  answers: Answer[];
}

function CreateQuiz() {
  const navigate = useNavigate();
  const createQuiz = useCreateQuiz;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: "",
      questionImages: null,
      answers: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    isQuestionRandomized: false,
    isAnswerRandomized: false,
    scorePerQuestion: 1,
  });

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: "",
        questionImages: null,
        answers: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
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
    setQuestions(newQuestions);
  };

  const handleQuestionTextChange = (qIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].questionText = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (publish = false) => {
    if (!thumbnail) return toast.error("Thumbnail is required");

    const payload = {
      title,
      description,
      thumbnail,
      questions,
      settings: { ...settings, isPublishImmediately: publish },
    };

    const parseResult = quizSchema.safeParse(payload);
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
      await createQuiz(parseResult.data);
      toast.success("Quiz created successfully!");
      navigate("/create-projects");
    } catch {
      toast.error("Failed to create quiz. Please try again.");
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
            <Typography variant="h3">Create Quiz Game</Typography>
            <Typography variant="p" className="mt-2">
              Build your quiz by adding questions and multiple choice answers
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
              {formErrors["title"] && (
                <p className="text-sm text-red-500">{formErrors["title"]}</p>
              )}
            </div>
            <TextareaField
              label="Description"
              placeholder="Describe your quiz game"
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
              {formErrors["thumbnail"] && (
                <p className="text-sm text-red-500">
                  {formErrors["thumbnail"]}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Typography variant="p">
              Questions {`(${questions.length})`}
            </Typography>
            <Button variant="outline" onClick={addQuestion}>
              <Plus /> Add Question
            </Button>
          </div>
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white w-full h-full p-6 space-y-6 rounded-xl border"
            >
              <div className="flex justify-between">
                <Typography variant="p">Question {qIndex + 1}</Typography>
                <Trash2
                  size={20}
                  className={`${
                    questions.length === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-500 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (questions.length > 1) removeQuestion(qIndex);
                  }}
                />
              </div>

              <div>
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
              </div>

              <Dropzone
                label="Question Image"
                allowedTypes={["image/png", "image/jpeg"]}
                maxSize={2 * 1024 * 1024}
                onChange={(file) => {
                  const newQuestions = [...questions];
                  newQuestions[qIndex].questionImages = file;
                  setQuestions(newQuestions);
                }}
              />

              <div className="grid w-full items-center gap-1.5">
                <Label className="mb-2">
                  Answer Options <span className="text-red-500">*</span>
                </Label>
                <div className="space-x-4 flex">
                  <div className="space-y-3 mt-3">
                    {q.answers.map((a, aIndex) => (
                      <Input
                        key={aIndex}
                        placeholder={`${aIndex + 1}`}
                        className="bg-[#F3F3F5]"
                        value={a.text}
                        onChange={(e) =>
                          handleAnswerChange(qIndex, aIndex, e.target.value)
                        }
                      />
                    ))}
                  </div>
                  <div className="flex items-stretch justify-center mt-3">
                    <RadioGroup
                      value={q.answers.findIndex((a) => a.isCorrect).toString()}
                      onValueChange={(val) =>
                        handleCorrectAnswer(qIndex, Number(val))
                      }
                    >
                      {q.answers.map((_, aIndex) => (
                        <div
                          key={aIndex}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={aIndex.toString()} />
                          <Label className="font-normal">Correct</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <Typography variant="p">Settings</Typography>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Questions</Label>
                <Typography variant="small">
                  Randomize questions order for each player
                </Typography>
              </div>
              <div>
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
            </div>
            <div className="flex justify-between items-center">
              <div>
                <Label>Shuffle Answers</Label>
                <Typography variant="small">
                  Randomize answer options for each question
                </Typography>
              </div>
              <div>
                <Switch
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
            <div className="flex justify-between items-center">
              <FormField
                label="Score Per Question"
                placeholder="1"
                type="string"
                value={settings.scorePerQuestion}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    scorePerQuestion: Number(e.target.value),
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

export default CreateQuiz;
