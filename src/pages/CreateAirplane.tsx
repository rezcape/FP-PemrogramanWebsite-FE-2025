import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Upload, Plane, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/api/axios";
import { toast } from "sonner";

interface QuestionItem {
  question: string;
  correctAnswer: string;
  wrongAnswers: [string, string, string];
}

interface AirplaneFormData {
  title: string;
  description: string;
}

export default function CreateAirplane() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AirplaneFormData>();

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: "", correctAnswer: "", wrongAnswers: ["", "", ""] },
  ]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setThumbnail(file);
      setPreview(URL.createObjectURL(file));
    },
  });

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
    }
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionItem,
    value: string,
  ) => {
    const newQ = [...questions];
    // @ts-expect-error: Dynamic assignment to question object
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const updateWrongAnswer = (qIndex: number, wIndex: number, value: string) => {
    const newQ = [...questions];
    newQ[qIndex].wrongAnswers[wIndex] = value;
    setQuestions(newQ);
  };

  const onSubmit = async (data: AirplaneFormData) => {
    if (!thumbnail) {
      toast.error("Thumbnail game wajib diupload!");
      return;
    }

    const isQuestionsValid = questions.every(
      (q) =>
        q.question.trim() &&
        q.correctAnswer.trim() &&
        q.wrongAnswers.every((w) => w.trim()),
    );

    if (!isQuestionsValid) {
      toast.error("Semua kolom soal dan jawaban harus diisi!");
      return;
    }

    let finalTitle = data.title;
    if (!finalTitle.toLowerCase().includes("airplane")) {
      finalTitle = `${finalTitle} - Airplane`;
    }

    const formData = new FormData();
    formData.append("title", finalTitle);
    formData.append("description", data.description);
    formData.append("thumbnail_image", thumbnail);
    formData.append("is_published", "true");
    formData.append("game_data", JSON.stringify(questions));

    try {
      await api.post("/api/game/game-type/airplane", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMessage(true);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error creating game:", error);

      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (err.response?.status === 409) {
        toast.error("Nama game sudah ada! Silakan gunakan nama lain.");
      } else {
        toast.error(err.response?.data?.message || "Gagal membuat game.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {successMessage && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-emerald-500 text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 border-4 border-emerald-400">
              <div className="bg-white rounded-full p-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-center">
                Game Berhasil Dibuat!
              </h2>
              <p className="text-emerald-100 text-center">
                Mengalihkan ke dashboard...
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-sky-600 rounded-xl shadow-lg shadow-sky-900/20">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Buat Misi Penerbangan
            </h1>
            <p className="text-slate-400">
              Desain tantangan untuk para pilot kadet.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-sky-400">
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Judul Game</Label>
                <Input
                  {...register("title", { required: true })}
                  className="bg-slate-950 border-slate-700 text-white focus:border-sky-500 h-12 text-lg"
                  placeholder="Contoh: Kuis Ibukota Dunia"
                />
                {errors.title && (
                  <span className="text-red-400 text-sm">
                    Judul wajib diisi
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Deskripsi</Label>
                <Textarea
                  {...register("description")}
                  className="bg-slate-950 border-slate-700 text-white focus:border-sky-500 min-h-[100px]"
                  placeholder="Jelaskan tantangan game ini..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Thumbnail / Cover</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                        ${isDragActive ? "border-sky-400 bg-sky-900/20" : "border-slate-700 hover:border-slate-500 bg-slate-950"}`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-40 object-cover rounded-lg shadow-md mb-4"
                      />
                      <p className="text-sky-400 text-sm">
                        Klik atau drag untuk ganti gambar
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Upload className="w-10 h-10 mb-3 text-slate-500" />
                      <p>Drag & drop gambar di sini, atau klik untuk upload</p>
                      <p className="text-xs mt-2 text-slate-600">
                        Format: JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-sky-400">
                Daftar Pertanyaan ({questions.length})
              </h2>
              <Button
                type="button"
                onClick={addQuestion}
                variant="outline"
                className="border-sky-600 text-sky-400 hover:bg-sky-950"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Soal
              </Button>
            </div>

            <div className="grid gap-6">
              {questions.map((q, index) => (
                <Card
                  key={index}
                  className="bg-slate-900 border-slate-800 relative group transition-all hover:border-slate-700"
                >
                  <CardContent className="pt-6 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-sm font-mono font-bold">
                        SOAL #{index + 1}
                      </div>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Tulis pertanyaanmu di sini..."
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(index, "question", e.target.value)
                        }
                        className="bg-slate-950 border-slate-700 text-white font-medium text-lg h-12 focus:ring-2 focus:ring-sky-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-emerald-400 font-bold flex items-center">
                          ✓ Jawaban Benar
                        </Label>
                        <Input
                          placeholder="Ketik jawaban benar"
                          value={q.correctAnswer}
                          onChange={(e) =>
                            updateQuestion(
                              index,
                              "correctAnswer",
                              e.target.value,
                            )
                          }
                          className="bg-emerald-950/30 border-emerald-900/50 text-emerald-100 focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-rose-400 font-bold flex items-center">
                          ✕ Jawaban Pengecoh (Salah)
                        </Label>
                        <div className="grid gap-2">
                          {q.wrongAnswers.map((ans, wIndex) => (
                            <Input
                              key={wIndex}
                              placeholder={`Pengecoh ${wIndex + 1}`}
                              value={ans}
                              onChange={(e) =>
                                updateWrongAnswer(index, wIndex, e.target.value)
                              }
                              className="bg-rose-950/20 border-rose-900/40 text-rose-100 focus:border-rose-500"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              onClick={addQuestion}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-dashed border-slate-600 py-6"
            >
              <Plus className="mr-2 w-5 h-5" /> Tambah Pertanyaan Lagi
            </Button>
          </div>

          <div className="pt-6 border-t border-slate-800 sticky bottom-0 bg-slate-950/90 backdrop-blur pb-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-lg bg-sky-600 hover:bg-sky-500 font-bold shadow-lg shadow-sky-900/50 transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Menyimpan Misi...</span>
              ) : (
                <>
                  <Save className="mr-2 w-5 h-5" /> Simpan Game & Terbitkan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
