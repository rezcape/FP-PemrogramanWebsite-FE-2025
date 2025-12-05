import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { imageQuizSchema } from "@/validation/imageQuizSchema";
import { TextareaField } from "@/components/ui/textarea-field";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Plus, SaveIcon, Trash2, EyeIcon } from "lucide-react";
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
  questionImages: File | null; // Wajib untuk Image Quiz
  answers: Answer[];
  correct_answer_id: string;
}

function CreateImageQuiz() {
  const navigate = useNavigate();

  // Helper function to create image quiz
  // const createImageQuiz = useCreateImageQuiz;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  // Default state minimal 1 round
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_id: uuidv4(),
      questionText: "", // Optional instruction
      questionImages: null,
      answers: [
        { answer_id: uuidv4(), text: "", isCorrect: false },
        { answer_id: uuidv4(), text: "", isCorrect: false },
        { answer_id: uuidv4(), text: "", isCorrect: false },
      ],
      correct_answer_id: "", // Will be set by handleCorrectAnswer
    },
  ]);

  const [settings, setSettings] = useState({
    isPublishImmediately: false,
    isQuestionRandomized: false,
    isAnswerRandomized: false,
    // scorePerQuestion dihapus karena backend yang mengatur
  });

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
    if (!thumbnail) return toast.error("Thumbnail is required");

    // Validate using Image Quiz Schema
    const payloadForValidation = {
      title,
      description,
      thumbnail,
      questions,
      settings: {
        isPublishImmediately: publish,
        isQuestionRandomized: settings.isQuestionRandomized,
        isAnswerRandomized: settings.isAnswerRandomized,
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
      toast.error("Please fix the highlighted errors");
      console.log("Validation errors:", errObj);
      return;
    }

    try {
      // Call API using validated data
      // Ensure structure matches what useCreateImageQuiz expects
      await createImageQuiz({
        title,
        description,
        thumbnail,
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
        },
      });

      toast.success("Image Quiz created successfully!");
      navigate("/my-projects"); // Redirect to My Projects instead of create options
    } catch (err) {
      console.error("Failed to create image quiz:", err);
      toast.error("Failed to create quiz. Please try again.");
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4 border-b">
        <Button
          size="sm"
          variant="ghost"
          className="flex gap-2"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft size={16} /> Back
        </Button>
        <Typography variant="h4" className="font-bold">
          Create Image Quiz
        </Typography>
        <div className="w-[70px]"></div> {/* Spacer for centering */}
      </div>

      <div className="w-full h-full p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header Text */}
          <div className="text-center md:text-left">
            <Typography variant="h3">Game Details</Typography>
            <Typography variant="p" className="text-gray-500 mt-1">
              Set up the main information for your time-based puzzle game.
            </Typography>
          </div>

          {/* Main Info Card */}
          <div className="bg-white w-full p-8 space-y-6 rounded-xl border shadow-sm">
            <div>
              <FormField
                required
                label="Game Title"
                placeholder="e.g. Guess the Celebrity"
                type="text"
                value={title}
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

            <TextareaField
              label="Description"
              placeholder="What is this game about?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <Dropzone
                required
                label="Game Thumbnail"
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
              {formErrors["thumbnail"] && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors["thumbnail"]}
                </p>
              )}
            </div>
          </div>

          {/* Rounds Header */}
          <div className="flex justify-between items-center pt-4">
            <div>
              <Typography variant="h3">Game Rounds</Typography>
              <Typography variant="p" className="text-gray-500">
                Add images that will be hidden behind the 16x8 grid.
              </Typography>
            </div>
            <Button variant="default" onClick={addRound} className="gap-2">
              <Plus size={16} /> Add Round
            </Button>
          </div>

          {/* Questions / Rounds List */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-white w-full p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
              >
                {/* Round Header */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {qIndex + 1}
                    </div>
                    <Typography variant="h4" className="text-lg">
                      Round {qIndex + 1}
                    </Typography>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500"
                    disabled={questions.length === 1}
                    onClick={() => {
                      if (questions.length > 1) removeRound(qIndex);
                    }}
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Image & Text */}
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block">
                        Hidden Image (Target){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="text-xs text-gray-500 mb-2">
                        This image will be covered by a 16x8 grid and revealed
                        over time.
                      </div>
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

                          // Clear error
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
                      {formErrors[`questions.${qIndex}.questionImages`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {formErrors[`questions.${qIndex}.questionImages`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <TextareaField
                        required
                        label="Category"
                        placeholder="e.g. Who is this person?"
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
                  </div>

                  {/* Right Column: Answers */}
                  <div className="space-y-4">
                    <Label>
                      Answer Options <span className="text-red-500">*</span>
                    </Label>
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                      <RadioGroup
                        value={q.answers
                          .findIndex((a) => a.isCorrect)
                          .toString()}
                        onValueChange={(val) =>
                          handleCorrectAnswer(qIndex, Number(val))
                        }
                      >
                        {q.answers.map((a, aIndex) => (
                          <div key={aIndex} className="flex items-center gap-3">
                            <RadioGroupItem
                              value={aIndex.toString()}
                              id={`q${qIndex}-a${aIndex}`}
                            />
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
                    <div className="text-xs text-gray-500 text-center">
                      Select the radio button next to the correct answer.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Settings Card */}
          <div className="bg-white w-full p-6 space-y-6 rounded-xl border shadow-sm mt-8">
            <div className="border-b pb-4">
              <Typography variant="h4">Game Settings</Typography>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <Label className="text-base">Shuffle Rounds</Label>
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
                <Label className="text-base">Shuffle Answers</Label>
                <Typography variant="small" className="text-gray-500">
                  Randomize answer options for each round
                </Typography>
              </div>
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

          {/* Footer Actions */}
          <div className="flex gap-4 justify-end w-full pt-8 pb-20">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive" className="px-8">
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
                  <AlertDialogAction
                    onClick={() => navigate("/create-projects")}
                  >
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="lg"
              variant="outline"
              className="px-8"
              onClick={() => handleSubmit(false)}
            >
              <SaveIcon size={18} className="mr-2" /> Save Draft
            </Button>
            <Button
              disabled={questions.length < 1}
              size="lg"
              variant="default"
              className="bg-black text-white px-8 hover:bg-gray-800"
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

export default CreateImageQuiz;
