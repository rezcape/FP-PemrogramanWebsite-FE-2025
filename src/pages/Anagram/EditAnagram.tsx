import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Eye,
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
import toast from "react-hot-toast";

interface QuestionItem {
  id: number;
  real_id?: number;
  word: string;
  imageFile: File | null;
  previewUrl: string | null;
}

interface ApiQuestion {
  id?: number;
  question_id?: number;
  correct_word?: string;
  image_url?: string | null;
}

const EditAnagram = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [gameInfo, setGameInfo] = useState({
    name: "",
    description: "",
    is_publish: false,
    is_question_randomized: false,
  });

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  const [questions, setQuestions] = useState<QuestionItem[]>([
    { id: Date.now(), word: "", imageFile: null, previewUrl: null },
  ]);

  // FETCH EXISTING DATA
  useEffect(() => {
    if (!id) return;

    const fetchAnagram = async () => {
      setLoadingData(true);
      try {
        const res = await api.get(`/api/game/game-type/anagram/${id}`);
        const data = res.data.data;

        console.log("=== FULL DATA ===", data);

        // Set basic info
        setGameInfo({
          name: data.name || "",
          description: data.description || "",
          is_publish: !!data.is_published,
          is_question_randomized: !!data.is_question_randomized,
        });

        // Set thumbnail
        if (data.thumbnail_image) {
          setThumbnailPreview(
            `${import.meta.env.VITE_API_URL}/${data.thumbnail_image}`,
          );
        }

        // Questions ada di data.questions
        const questionsData = data.questions || [];

        console.log("=== QUESTIONS DATA ===", questionsData);

        const mappedQuestions: QuestionItem[] = questionsData.map(
          (q: ApiQuestion, idx: number) => {
            let imageUrl = null;
            if (q.image_url) {
              imageUrl = `${import.meta.env.VITE_API_URL}/${q.image_url}`;
            }

            console.log(`Question ${idx + 1}:`, {
              word: q.correct_word,
              imageUrl,
            });

            return {
              id: Date.now() + idx,
              real_id: q.question_id || q.id,
              word: q.correct_word || "",
              imageFile: null,
              previewUrl: imageUrl,
            };
          },
        );

        console.log("=== MAPPED QUESTIONS ===", mappedQuestions);

        setQuestions(
          mappedQuestions.length > 0
            ? mappedQuestions
            : [{ id: Date.now(), word: "", imageFile: null, previewUrl: null }],
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load anagram data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchAnagram();
  }, [id]);

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setThumbnailError(false); // Clear error when file is selected
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), word: "", imageFile: null, previewUrl: null },
    ]);
  };

  const handleRemoveQuestion = (id: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionWordChange = (id: number, val: string) => {
    const updated = questions.map((q) =>
      q.id === id ? { ...q, word: val } : q,
    );
    setQuestions(updated);
  };

  const handleQuestionImageChange = (
    id: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = questions.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            imageFile: file,
            previewUrl: URL.createObjectURL(file),
          };
        }
        return q;
      });
      setQuestions(updated);
    }
  };

  // Custom Alert Modal Function
  const showAlert = (message: string, type: "error" | "info" = "error") => {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]";
    alertDiv.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        <div class="w-16 h-16 ${type === "error" ? "bg-red-100" : "bg-blue-100"} rounded-full flex items-center justify-center mx-auto mb-4">
          ${
            type === "error"
              ? `<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>`
              : `<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`
          }
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">${type === "error" ? "Oops!" : "Info"}</h3>
        <p class="text-slate-600 mb-6">${message}</p>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full">
          OK
        </button>
      </div>
    `;
    document.body.appendChild(alertDiv);

    const button = alertDiv.querySelector("button");
    button?.addEventListener("click", () => {
      document.body.removeChild(alertDiv);
    });
  };

  const handleSubmit = async (publish = false) => {
    // 1. Validasi Input
    if (!gameInfo.name) {
      showAlert("Game Title is required!");
      return;
    }

    // Validasi thumbnail: harus ada file baru ATAU preview URL lama
    if (!thumbnail && !thumbnailPreview) {
      setThumbnailError(true);
      showAlert("Game Thumbnail is required!");
      // Scroll to thumbnail section
      setTimeout(() => {
        document
          .getElementById("thumbnail-section")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].word) {
        showAlert(`Question ${i + 1}: Correct Answer (Word) is required!`);
        return;
      }
      // Validasi gambar: Harus ada File baru ATAU URL preview lama
      if (!questions[i].imageFile && !questions[i].previewUrl) {
        showAlert(`Question ${i + 1}: Image Hint is required!`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // 2. Append Info Dasar
      formData.append("name", gameInfo.name);
      formData.append("description", gameInfo.description);
      formData.append(
        "is_publish",
        (publish || gameInfo.is_publish).toString(),
      );
      formData.append(
        "is_question_randomized",
        gameInfo.is_question_randomized.toString(),
      );

      if (thumbnail) {
        formData.append("thumbnail_image", thumbnail);
      }

      // 3. Logic Gambar Baru (FIXED)
      // Kita pisahkan file fisik dan logikanya biar gak error 422
      const filesToUpload: File[] = [];
      const questionFileMap: Record<number, number> = {}; // Map index soal -> index file

      questions.forEach((q, index) => {
        if (q.imageFile) {
          // Hanya jika user upload gambar baru, kita catat indexnya
          questionFileMap[index] = filesToUpload.length;
          filesToUpload.push(q.imageFile);
        }
        // Jika pakai gambar lama (previewUrl), skip aja. Jangan push string ke file array.
      });

      // Masukkan file fisik ke formData
      // IMPORTANT: Append each file separately with the same field name to create an array
      if (filesToUpload.length > 0) {
        filesToUpload.forEach((f) => {
          formData.append("files_to_upload", f);
        });
      }
      // If no new files, don't append files_to_upload at all - backend should handle this

      // 4. Buat Payload JSON (FIXED - Logic ID & Image di dalam Map)
      const questionsPayload = questions.map((q, idx) => {
        // Pakai 'any' biar aman nambah properti dinamis
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          correct_word: q.word.toUpperCase(),
        };

        // A. Masukkan ID Asli (PENTING BUAT EDIT/UPDATE)
        if (q.real_id) {
          payload.question_id = q.real_id;
        }

        // B. Masukkan Index Gambar (Hanya jika ada gambar BARU)
        if (questionFileMap[idx] !== undefined) {
          payload.question_image_array_index = questionFileMap[idx];
        }
        // Jika tidak ada gambar baru, field question_image_array_index TIDAK DIKIRIM.
        // Backend akan otomatis mempertahankan gambar lama berdasarkan question_id.

        return payload;
      });

      formData.append("questions", JSON.stringify(questionsPayload));

      // Debugging: Cek console browser kalau masih error
      console.log("Payload Questions:", questionsPayload);

      await api.patch(`/api/game/game-type/anagram/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show success message with custom UI
      const successDiv = document.createElement("div");
      successDiv.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]";
      successDiv.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-2">Success!</h3>
          <p class="text-slate-600 mb-6">Anagram game updated successfully!</p>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Go to My Projects
          </button>
        </div>
      `;
      document.body.appendChild(successDiv);

      const button = successDiv.querySelector("button");
      button?.addEventListener("click", () => {
        document.body.removeChild(successDiv);
        navigate("/my-projects");
      });

      // Auto redirect after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
          navigate("/my-projects");
        }
      }, 3000);
    } catch (error: unknown) {
      console.error(error);
      // @ts-expect-error: response property exists on AxiosError but not on generic Error
      const msg = error?.response?.data?.message || (error as Error).message;
      toast.error(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 relative">
      <div className="mb-6">
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft className="w-5 h-5" /> Back to Projects
        </Button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Edit Anagram Game
          </h1>
          <p className="text-slate-500 mt-1">
            Update your anagram game. Changes will be saved when you click Save
            or Publish.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Game Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Example: Guess the Animal Name"
                    value={gameInfo.name}
                    onChange={(e) =>
                      setGameInfo({ ...gameInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of this game..."
                    value={gameInfo.description}
                    onChange={(e) =>
                      setGameInfo({ ...gameInfo, description: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Question List</h2>
                <span className="text-sm text-slate-500">
                  Total: {questions.length} Questions
                </span>
              </div>

              {questions.map((q, index) => {
                console.log(`Rendering Question ${index}:`, {
                  id: q.id,
                  word: q.word,
                  previewUrl: q.previewUrl,
                  hasPreview: !!q.previewUrl,
                });

                return (
                  <Card
                    key={q.id}
                    className="relative overflow-hidden border-l-4 border-l-blue-500 shadow-sm"
                  >
                    <CardContent className="pt-6 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 w-full md:w-48 space-y-2">
                        <Label className="text-xs font-semibold uppercase text-slate-500">
                          Image Hint <span className="text-red-500">*</span>
                        </Label>
                        <div
                          className={`h-32 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${q.previewUrl ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}`}
                          onClick={() =>
                            document.getElementById(`q-img-${q.id}`)?.click()
                          }
                        >
                          {q.previewUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={q.previewUrl}
                                alt={`Preview ${index + 1}`}
                                className="h-full w-full object-cover rounded-md"
                                onError={(e) => {
                                  console.error(
                                    `Image load error for question ${index}:`,
                                    q.previewUrl,
                                  );
                                  console.log(
                                    "Image element:",
                                    e.currentTarget,
                                  );
                                }}
                                onLoad={() => {
                                  console.log(
                                    `Image loaded successfully for question ${index}`,
                                  );
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-center p-2">
                              <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                              <span className="text-xs text-slate-500">
                                Upload Image
                              </span>
                            </div>
                          )}
                          <input
                            id={`q-img-${q.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleQuestionImageChange(q.id, e)}
                          />
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                            Question #{index + 1}
                          </div>
                          {questions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveQuestion(q.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Correct Answer (Word){" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Example: CAT"
                            value={q.word}
                            onChange={(e) =>
                              handleQuestionWordChange(q.id, e.target.value)
                            }
                            className="font-mono uppercase tracking-wider"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Button
                variant="outline"
                className="w-full py-8 border-dashed border-2 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"
                onClick={handleAddQuestion}
              >
                <Plus className="w-5 h-5 mr-2" /> Add New Question
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2" id="thumbnail-section">
                  <Label>
                    Game Thumbnail <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={`aspect-video w-full border-2 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition ${
                      thumbnailError && !thumbnailPreview
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200"
                    }`}
                    onClick={() =>
                      document.getElementById("thumb-input")?.click()
                    }
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs">Upload Cover</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="thumb-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                  {thumbnailError && !thumbnailPreview && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Thumbnail image is required
                    </p>
                  )}
                </div>

                <hr />

                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize" className="cursor-pointer">
                    Randomize Question Order?
                  </Label>
                  <Switch
                    id="randomize"
                    checked={gameInfo.is_question_randomized}
                    onCheckedChange={(checked) =>
                      setGameInfo({
                        ...gameInfo,
                        is_question_randomized: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                Cancel
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

          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
            >
              <Save className="w-5 h-5 mr-2" /> Save Draft
            </Button>
            <Button
              size="lg"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" /> Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAnagram;
