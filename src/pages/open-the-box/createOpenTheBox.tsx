import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea-field"; // Pastikan komponen ini ada
import { Label } from "@/components/ui/label";
import Dropzone from "@/components/ui/dropzone"; // Pastikan komponen ini ada
import { Typography } from "@/components/ui/typography"; // Pastikan komponen ini ada
import axios from "axios";
import {
  ArrowLeft,
  Plus,
  SaveIcon,
  Trash2,
  Check,
  X,
  ImageIcon,
  Copy,
  Loader2,
} from "lucide-react";
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

import api from "@/api/axios";

// --- Helper & Interface ---
const generateId = () => Math.random().toString(36).substring(2, 9);

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  answers: Answer[];
}

// STORAGE KEYS (Untuk Auto-Save Draft)
const STORAGE_KEY_TITLE = "otb_draft_title";
const STORAGE_KEY_DESC = "otb_draft_desc";
const STORAGE_KEY_QUESTIONS = "otb_draft_questions";

function CreateOpenTheBox() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE ---
  // Mengambil data dari LocalStorage jika ada (Fitur Draft)
  const [title, setTitle] = useState(
    () => localStorage.getItem(STORAGE_KEY_TITLE) || "",
  );
  const [description, setDescription] = useState(
    () => localStorage.getItem(STORAGE_KEY_DESC) || "",
  );
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    try {
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: generateId(),
              questionText: "",
              answers: [
                { id: generateId(), text: "", isCorrect: true },
                { id: generateId(), text: "", isCorrect: false },
              ],
            },
          ];
    } catch {
      return [];
    }
  });

  // --- AUTO SAVE EFFECT ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TITLE, title);
    localStorage.setItem(STORAGE_KEY_DESC, description);
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  }, [title, description, questions]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY_TITLE);
    localStorage.removeItem(STORAGE_KEY_DESC);
    localStorage.removeItem(STORAGE_KEY_QUESTIONS);
  };

  // --- LOGIC QUESTIONS ---
  const addQuestion = () => {
    if (questions.length >= 10) return toast.error("Maksimal 10 pertanyaan");
    setQuestions((prev) => [
      ...prev,
      {
        id: generateId(),
        questionText: "",
        answers: [
          { id: generateId(), text: "", isCorrect: true }, // Default jawaban pertama benar
          { id: generateId(), text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1)
      return toast.error("Minimal harus ada 1 pertanyaan.");
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateQuestion = (index: number) => {
    const original = questions[index];
    const copy: Question = {
      ...original,
      id: generateId(),
      answers: original.answers.map((a) => ({ ...a, id: generateId() })),
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, copy);
    setQuestions(newQuestions);
    toast.success("Pertanyaan diduplikasi");
  };

  const handleQuestionTextChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = value;
    setQuestions(newQuestions);
  };

  // --- LOGIC ANSWERS ---
  const addAnswer = (qIndex: number) => {
    const newQuestions = [...questions];
    // Batasi maks 4 jawaban agar sesuai layout kartu 2x2 atau 4 kolom
    if (newQuestions[qIndex].answers.length >= 4)
      return toast.error("Maksimal 4 jawaban.");
    newQuestions[qIndex].answers.push({
      id: generateId(),
      text: "",
      isCorrect: false,
    });
    setQuestions(newQuestions);
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].answers.length <= 2)
      return toast.error("Minimal 2 pilihan jawaban.");
    newQuestions[qIndex].answers.splice(aIndex, 1);
    setQuestions(newQuestions);
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

  const toggleCorrectAnswer = (qIndex: number, aIndex: number) => {
    const newQuestions = [...questions];
    // Reset semua jadi false dulu, baru set yang dipilih jadi true (Single Correct Answer)
    newQuestions[qIndex].answers.forEach((ans, idx) => {
      ans.isCorrect = idx === aIndex;
    });
    setQuestions(newQuestions);
  };

  const handleSubmit = async (publish = false) => {
    // 1. Validasi Frontend
    if (!title) return toast.error("Judul wajib diisi");
    if (!thumbnail) return toast.error("Thumbnail wajib diupload");
    if (questions.length === 0)
      return toast.error("Minimal harus ada 1 pertanyaan");
    if (questions.length > 10) return toast.error("Maksimal 10 pertanyaan");

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // --- KITA COBA KOMBINASI STANDARD DULU ---
      formData.append("name", title);
      formData.append("description", description || "-");

      // [TEBAKAN 1]: Biasanya backend minta 'game_template_slug' (snake_case)
      formData.append("game_template_slug", "open-the-box");

      // [TEBAKAN 2]: Nama field gambar. Kita kirim 'thumbnail_image'.
      // Nanti lihat Error Alert kalau ternyata dia minta 'thumbnail' atau 'file'.
      formData.append("thumbnail_image", thumbnail);

      // Data lain
      formData.append("is_publish_immediately", publish ? "true" : "false");
      formData.append("is_question_randomized", "false");
      formData.append("is_answer_randomized", "true");
      formData.append("score_per_question", "100");

      const gameData = {
        items: questions.map((q, idx) => ({
          id: idx + 1,
          text: q.questionText,
          options: q.answers.map((a) => a.text),
          answer: q.answers.find((a) => a.isCorrect)?.text || q.answers[0].text,
        })),
        settings: { theme: "default" },
      };

      formData.append("gameData", JSON.stringify(gameData));

      // EKSEKUSI
      await api.post("/api/game/game-type/open-the-box", formData);

      toast.success("Berhasil!");
      navigate("/create-projects");
    } catch (err: unknown) {
      console.error("🔥 ERROR:", err);

      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as
          | { message?: string }
          | undefined;
        const message =
          errorData?.message ?? err.message ?? "Request gagal (Axios error)";

        alert(`DITOLAK BACKEND:\n\n${message}`);
        return;
      }

      if (err instanceof Error) {
        alert(`Terjadi error:\n\n${err.message}`);
        return;
      }

      alert("Terjadi error tidak dikenal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    clearDraft();
    navigate("/create-projects");
    toast.success("Draft dihapus");
  };

  return (
    <div className="w-full bg-[#F0F2F5] min-h-screen flex flex-col font-sans pb-24">
      {/* Header Sticky */}
      <div className="bg-white border-b h-16 w-full flex justify-between items-center px-6 sticky top-0 z-50 shadow-sm">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/create-projects")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Typography
          variant="h4"
          className="font-serif tracking-wide text-slate-800"
        >
          Create Open The Box
        </Typography>
        <div className="w-20"></div> {/* Spacer agar Title di tengah */}
      </div>

      <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-8">
        {/* Metadata Section */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <Label className="mb-2 block text-xs font-bold uppercase text-slate-500 tracking-wider">
              Activity Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. English Numbers 1-10"
              className="text-xl font-semibold h-12 border-slate-300 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TextareaField
              label="Description"
              placeholder="Describe your activity logic or instruction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-full min-h-[150px]"
            />
            <div>
              <Label className="mb-2 block">Cover Image</Label>
              <Dropzone
                label="Upload Thumbnail"
                onChange={setThumbnail}
                maxSize={2000000} // 2MB
                allowedTypes={["image/jpeg", "image/png", "image/webp"]}
              />
              {thumbnail && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <Check size={12} className="mr-1" /> Image Selected:{" "}
                  {thumbnail.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Questions List Section */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow"
            >
              {/* Question Toolbar */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateQuestion(qIndex)}
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(qIndex)}
                  disabled={questions.length === 1}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              {/* Question Input */}
              <div className="flex items-start gap-4 mb-6 pr-24">
                <div className="bg-slate-100 text-slate-500 w-8 h-8 flex items-center justify-center rounded-full font-bold mt-1">
                  {qIndex + 1}
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-bold uppercase text-slate-400 mb-1 block">
                    Question / Box Content
                  </Label>
                  <div className="relative">
                    <Input
                      value={q.questionText}
                      onChange={(e) =>
                        handleQuestionTextChange(qIndex, e.target.value)
                      }
                      placeholder="Type the question inside the box..."
                      className="pr-10 h-12 text-lg"
                    />
                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* Answers Grid */}
              <div className="pl-12">
                <Label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                  Answers
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.answers.map((a, aIndex) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 group/answer"
                    >
                      {/* Correct/Incorrect Toggle */}
                      <div
                        onClick={() => toggleCorrectAnswer(qIndex, aIndex)}
                        className={`
                                cursor-pointer w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border-2 transition-all
                                ${
                                  a.isCorrect
                                    ? "bg-green-50 border-green-500 text-green-600 shadow-sm scale-105"
                                    : "bg-white border-slate-200 text-slate-300 hover:border-slate-300"
                                }
                            `}
                        title={
                          a.isCorrect ? "Correct Answer" : "Mark as Correct"
                        }
                      >
                        {a.isCorrect ? (
                          <Check size={20} strokeWidth={3} />
                        ) : (
                          <X size={20} strokeWidth={3} />
                        )}
                      </div>

                      {/* Answer Input */}
                      <div className="relative flex-1">
                        <Input
                          value={a.text}
                          onChange={(e) =>
                            handleAnswerChange(qIndex, aIndex, e.target.value)
                          }
                          placeholder={`Answer option ${String.fromCharCode(65 + aIndex)}`}
                          className={`${a.isCorrect ? "border-green-500 ring-1 ring-green-100" : ""}`}
                        />
                        {q.answers.length > 2 && (
                          <button
                            onClick={() => removeAnswer(qIndex, aIndex)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover/answer:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {q.answers.length < 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addAnswer(qIndex)}
                    className="mt-4 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Option
                  </Button>
                )}
              </div>
            </div>
          ))}

          <Button
            onClick={addQuestion}
            className="w-full py-8 border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all"
            variant="outline"
          >
            <Plus className="mr-2 h-6 w-6" /> Add New Question
          </Button>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-between items-center px-8 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="text-slate-500 text-sm font-medium">
          {questions.length} Items Created
        </div>
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes will be lost permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDiscard}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Draft
          </Button>

          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Publish
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default CreateOpenTheBox;
