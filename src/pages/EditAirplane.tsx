import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import Navbar from "@/components/ui/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Plane, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Dropzone from "@/components/ui/dropzone";
import toast from "react-hot-toast";

interface QuestionItem {
  question: string;
  correctAnswer: string;
  wrongAnswers: [string, string, string];
}

interface GameData {
  id: string;
  name: string;
  description: string | null;
  thumbnail_image: string | null;
  is_published: boolean;
  game_json: QuestionItem[] | string;
}

export default function EditAirplane() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: "", correctAnswer: "", wrongAnswers: ["", "", ""] },
  ]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await api.get(`/api/game/game-type/airplane/${id}`);
        const game = response.data.data as GameData;

        setTitle(game.name);
        setDescription(game.description || "");
        setCurrentThumbnail(game.thumbnail_image);

        let parsedQuestions: QuestionItem[] = [];

        if (game.game_json) {
          if (typeof game.game_json === "string") {
            try {
              parsedQuestions = JSON.parse(game.game_json);
            } catch (e) {
              console.error("Failed to parse game_json string", e);
            }
          } else if (Array.isArray(game.game_json)) {
            parsedQuestions = game.game_json;
          }
        }

        if (parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
        }
      } catch (error) {
        console.error("Failed to fetch game:", error);
        toast.error("Gagal mengambil data game.");
        navigate("/my-projects");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGame();
  }, [id, navigate]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", correctAnswer: "", wrongAnswers: ["", "", ""] },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQ = [...questions];
      newQ.splice(index, 1);
      setQuestions(newQ);
    } else {
      toast.error("Minimal harus ada satu pertanyaan.");
    }
  };

  const updateQuestionText = (
    index: number,
    field: "question" | "correctAnswer",
    value: string,
  ) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const updateWrongAnswer = (qIndex: number, wIndex: number, value: string) => {
    const newQ = [...questions];
    newQ[qIndex].wrongAnswers[wIndex] = value;
    setQuestions(newQ);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Judul wajib diisi!");

    const isQuestionsValid = questions.every(
      (q) =>
        q.question.trim() &&
        q.correctAnswer.trim() &&
        q.wrongAnswers.every((w) => w.trim()),
    );

    if (!isQuestionsValid) {
      return toast.error("Semua kolom pertanyaan dan jawaban harus diisi!");
    }

    let finalTitle = title;
    if (!finalTitle.toLowerCase().includes("airplane")) {
      finalTitle = `${finalTitle} - Airplane`;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", finalTitle);
      formData.append("description", description);

      formData.append("game_data", JSON.stringify(questions));

      if (newThumbnail) {
        formData.append("thumbnail_image", newThumbnail);
      }

      await api.put(`/api/game/game-type/airplane/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Game berhasil diupdate!");
      navigate("/my-projects");
    } catch (error) {
      console.error("Gagal update game:", error);
      toast.error("Terjadi kesalahan saat update game.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin mb-4">
          <Plane className="w-10 h-10 text-sky-600" />
        </div>
        <p className="text-slate-500 font-medium">Mengambil data game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => navigate("/my-projects")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke My Projects
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="md:hidden bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting ? "Saving..." : <Save className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <Plane className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10 rotate-[-15deg]" />
              <div className="relative z-10">
                <div className="bg-white/20 p-3 rounded-xl w-fit mb-4 backdrop-blur-sm">
                  <Plane className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Edit Game</h1>
                <p className="text-orange-100 text-sm leading-relaxed">
                  Perbarui judul, cover, serta soal-soal untuk game pesawat ini.
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" /> Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="border-slate-200 shadow-md bg-white">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg text-slate-800">
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="space-y-2">
                  <Label>Judul Game</Label>
                  <Input
                    placeholder="Judul Game"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deskripsi Singkat</Label>
                  <Textarea
                    placeholder="Deskripsi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px] border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail Game</Label>

                  {!newThumbnail &&
                    currentThumbnail &&
                    currentThumbnail !== "default_image.jpg" && (
                      <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-4">
                        <img
                          src={
                            currentThumbnail.startsWith("http")
                              ? currentThumbnail
                              : `${import.meta.env.VITE_API_URL}/${currentThumbnail}`
                          }
                          alt="Current Cover"
                          className="w-20 h-14 object-cover rounded-md border bg-white"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-600">
                            Cover Saat Ini
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Upload baru untuk mengganti.
                          </p>
                        </div>
                      </div>
                    )}

                  <Dropzone
                    label="Ganti Cover (Opsional)"
                    allowedTypes={["image/png", "image/jpeg", "image/jpg"]}
                    maxSize={2 * 1024 * 1024}
                    onChange={(file: File | null) => setNewThumbnail(file)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-md bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-800">
                    Daftar Pertanyaan
                  </CardTitle>
                  <CardDescription>
                    Total: {questions.length} Soal
                  </CardDescription>
                </div>
                <Button
                  onClick={addQuestion}
                  size="sm"
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="relative p-5 bg-slate-50 rounded-xl border border-slate-200 group transition-all hover:border-orange-300"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-2 py-1 rounded">
                        Soal #{index + 1}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500">
                          Pertanyaan
                        </Label>
                        <Input
                          value={q.question}
                          onChange={(e) =>
                            updateQuestionText(
                              index,
                              "question",
                              e.target.value,
                            )
                          }
                          placeholder="Contoh: Apa nama ibukota Indonesia?"
                          className="bg-white border-slate-200 focus:border-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-emerald-600 font-bold">
                            ✓ Jawaban Benar
                          </Label>
                          <Input
                            value={q.correctAnswer}
                            onChange={(e) =>
                              updateQuestionText(
                                index,
                                "correctAnswer",
                                e.target.value,
                              )
                            }
                            placeholder="Jawaban Benar"
                            className="bg-emerald-50/50 border-emerald-200 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-rose-500 font-bold">
                            ✕ Jawaban Salah (3)
                          </Label>
                          {q.wrongAnswers.map((wrongAns, wIndex) => (
                            <Input
                              key={wIndex}
                              value={wrongAns}
                              onChange={(e) =>
                                updateWrongAnswer(index, wIndex, e.target.value)
                              }
                              placeholder={`Pengecoh ${wIndex + 1}`}
                              className="bg-rose-50/30 border-rose-200 text-slate-700 focus:border-rose-400 h-9 text-sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addQuestion}
                  variant="outline"
                  className="w-full border-2 border-dashed border-slate-300 text-slate-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 h-12"
                >
                  <Plus className="w-5 h-5 mr-2" /> Tambah Pertanyaan Baru
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
