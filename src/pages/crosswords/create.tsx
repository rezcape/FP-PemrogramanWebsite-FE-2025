import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import Dropzone from "@/components/ui/dropzone";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import api from "@/api/axios";
import { GridBuilder, type GridWord } from "@/components/crossword/GridBuilder";

interface CrosswordItem {
  word: string;
  clue: string;
}

export default function CreateCrossword() {
  const navigate = useNavigate();

  // -- STATE UMUM --
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  // -- STATE WORDS (STEP 1) --
  const [items, setItems] = useState<CrosswordItem[]>([
    { word: "", clue: "" },
    { word: "", clue: "" },
    { word: "", clue: "" },
    { word: "", clue: "" },
    { word: "", clue: "" },
  ]);

  // -- HANDLERS STEP 1 --
  const addItem = () => setItems([...items, { word: "", clue: "" }]);

  const removeItem = (index: number) => {
    if (items.length > 5) setItems(items.filter((_, i) => i !== index));
    else toast.error("Minimum 5 words required");
  };

  const handleItemChange = (
    index: number,
    field: "word" | "clue",
    value: string,
  ) => {
    const newItems = [...items];
    newItems[index][field] =
      field === "word"
        ? value.toUpperCase().replace(/[^A-Z]/g, "") // Paksa Uppercase
        : value;
    setItems(newItems);
  };

  const handleNextStep = () => {
    // Validasi Basic Step 1
    if (!thumbnail) return toast.error("Thumbnail is required");
    if (!title.trim()) return toast.error("Title is required");

    const validItems = items.filter(
      (i) => i.word.trim().length >= 2 && i.clue.trim().length >= 3,
    );

    if (validItems.length < 5)
      return toast.error("Please provide at least 5 valid words and clues");

    // Jika valid, lanjut ke Step 2 (Grid Builder)
    setStep(2);
  };

  // -- HANDLERS STEP 2 (FINAL SAVE) --
  const handleFinalSave = async (
    gridWords: GridWord[],
    rows: number,
    cols: number,
    publish = true,
  ) => {
    // gridWords adalah hasil susunan dari GridBuilder

    // Mapping ke format Backend
    const formattedWords = gridWords.map((gw) => ({
      number: gw.number,
      direction: gw.direction,
      row_index: gw.row,
      col_index: gw.col,
      answer: gw.word, // Backend butuh 'answer'
      clue: gw.clue,
    }));

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);
    if (thumbnail) formData.append("thumbnail_image", thumbnail);
    formData.append("is_publish_immediately", publish ? "true" : "false");

    // Data Grid
    formData.append("words", JSON.stringify(formattedWords));
    formData.append("rows", String(rows));
    formData.append("cols", String(cols));

    try {
      await api.post("/api/game/game-type/crossword", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Crossword created successfully!");
      navigate("/my-projects");
    } catch (err: unknown) {
      console.error(err);
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj?.response?.data?.message || "Failed to create game";
      toast.error(msg);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col p-4 sm:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() =>
              step === 2 ? setStep(1) : navigate("/create-projects")
            }
            className="pl-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />{" "}
            {step === 2 ? "Back to Words" : "Back"}
          </Button>

          <div className="flex gap-2 text-sm font-medium text-slate-500">
            <span className={step === 1 ? "text-blue-600 font-bold" : ""}>
              1. Details & Words
            </span>
            <span>/</span>
            <span className={step === 2 ? "text-blue-600 font-bold" : ""}>
              2. Grid Arrangement
            </span>
          </div>
        </div>

        <Typography variant="h3">Create Crossword</Typography>

        {/* STEP 1: INPUT DATA */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl border space-y-6 shadow-sm">
              <FormField
                label="Game Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="grid w-full items-center gap-1.5">
                <Label>Description</Label>
                <Textarea
                  className="bg-[#F3F3F5]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Game description..."
                />
              </div>

              <Dropzone label="Thumbnail" required onChange={setThumbnail} />
            </div>

            <div className="bg-white p-6 rounded-xl border space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Typography variant="h4">Words & Clues</Typography>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" /> Add Word
                </Button>
              </div>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 items-end border-b pb-4 last:border-0"
                  >
                    <div className="flex-1">
                      <Label>Word (Answer)</Label>
                      <input
                        className="w-full border rounded-md px-3 py-2 mt-1 uppercase text-sm bg-slate-50 font-mono"
                        value={item.word}
                        onChange={(e) =>
                          handleItemChange(idx, "word", e.target.value)
                        }
                        placeholder="e.g. REACT"
                      />
                    </div>
                    <div className="flex-2">
                      <Label>Clue (Question)</Label>
                      <input
                        className="w-full border rounded-md px-3 py-2 mt-1 text-sm bg-slate-50"
                        value={item.clue}
                        onChange={(e) =>
                          handleItemChange(idx, "clue", e.target.value)
                        }
                        placeholder="e.g. A JavaScript Library"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 shrink-0 hover:bg-red-50"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNextStep}
                size="lg"
                className="w-full sm:w-auto"
              >
                Next: Arrange Grid <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: GRID BUILDER */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <GridBuilder
              initialWords={items.filter((i) => i.word.trim().length >= 2)} // Filter kosong
              onBack={() => setStep(1)}
              onSave={(gridWords, r, c) =>
                handleFinalSave(gridWords, r, c, true)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
