import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCw, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

export interface GridWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
  number: number;
}

interface GridBuilderProps {
  initialWords: { word: string; clue: string }[];
  prePlacedWords?: Omit<GridWord, "number">[];
  onSave: (gridWords: GridWord[], rows: number, cols: number) => void;
  onBack: () => void;
}

const GRID_SIZE = 20;

// Helper: Bersihkan string
const cleanStr = (s: string) => (s ? s.trim().toUpperCase() : "");

export function GridBuilder({
  initialWords,
  prePlacedWords = [],
  onSave,
  onBack,
}: GridBuilderProps) {
  const [placedWords, setPlacedWords] = useState<GridWord[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  const [selectedWordStr, setSelectedWordStr] = useState<string | null>(null);
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "horizontal",
  );

  // [FIX] Buat string JSON stabil untuk dependency useEffect
  // Ini mencegah infinite loop karena array.filter() di parent selalu bikin array baru
  const initialWordsJson = JSON.stringify(initialWords);
  const prePlacedWordsJson = JSON.stringify(prePlacedWords);

  useEffect(() => {
    // Parse balik dari JSON string agar aman
    const stableInitialWords = JSON.parse(
      initialWordsJson,
    ) as typeof initialWords;
    const stablePrePlacedWords = JSON.parse(
      prePlacedWordsJson,
    ) as typeof prePlacedWords;

    const normalizedPlaced: GridWord[] = [];
    const placedStrings = new Set<string>();

    stablePrePlacedWords.forEach((pw) => {
      const pWord = cleanStr(pw.word);
      const match = stableInitialWords.find(
        (iw) => cleanStr(iw.word) === pWord,
      );

      if (match) {
        normalizedPlaced.push({
          ...pw,
          word: pWord,
          clue: match.clue,
          number: normalizedPlaced.length + 1,
        });
        placedStrings.add(pWord);
      }
    });

    setPlacedWords(normalizedPlaced);

    const remaining = stableInitialWords
      .map((w) => cleanStr(w.word))
      .filter((w) => w.length > 0 && !placedStrings.has(w));

    setAvailableWords([...new Set(remaining)]);

    // [FIX] Gunakan variabel JSON string sebagai dependency
  }, [initialWordsJson, prePlacedWordsJson]);

  const getCharAt = (r: number, c: number) => {
    for (const pw of placedWords) {
      if (pw.direction === "horizontal") {
        if (r === pw.row && c >= pw.col && c < pw.col + pw.word.length) {
          return pw.word[c - pw.col];
        }
      } else {
        if (c === pw.col && r >= pw.row && r < pw.row + pw.word.length) {
          return pw.word[r - pw.row];
        }
      }
    }
    return null;
  };

  const canPlaceWord = (
    word: string,
    r: number,
    c: number,
    dir: "horizontal" | "vertical",
  ) => {
    if (dir === "horizontal" && c + word.length > GRID_SIZE) return false;
    if (dir === "vertical" && r + word.length > GRID_SIZE) return false;

    for (let i = 0; i < word.length; i++) {
      const currR = dir === "vertical" ? r + i : r;
      const currC = dir === "horizontal" ? c + i : c;

      const existingChar = getCharAt(currR, currC);

      if (existingChar && existingChar !== word[i]) {
        console.warn(
          `Conflict at [${currR},${currC}]: ${existingChar} vs ${word[i]}`,
        );
        return false;
      }
    }
    return true;
  };

  const handleCellClick = (r: number, c: number) => {
    if (!selectedWordStr) return;

    const wordToPlace = cleanStr(selectedWordStr);

    if (!canPlaceWord(wordToPlace, r, c, direction)) {
      alert("Cannot place here. Check overlap or bounds.");
      return;
    }

    const originalRef = initialWords.find(
      (w) => cleanStr(w.word) === wordToPlace,
    );
    const clue = originalRef ? originalRef.clue : "";

    const newPlacedWord: GridWord = {
      word: wordToPlace,
      clue: clue,
      row: r,
      col: c,
      direction: direction,
      number: placedWords.length + 1,
    };

    setPlacedWords([...placedWords, newPlacedWord]);
    setAvailableWords(availableWords.filter((w) => w !== selectedWordStr));
    setSelectedWordStr(null);
  };

  const handleRemovePlacedWord = (index: number) => {
    const removed = placedWords[index];
    const newPlaced = placedWords.filter((_, i) => i !== index);
    const reorderedPlaced = newPlaced.map((pw, i) => ({
      ...pw,
      number: i + 1,
    }));

    setPlacedWords(reorderedPlaced);
    setAvailableWords([...availableWords, removed.word]);
  };

  const handleFinish = () => {
    if (availableWords.length > 0) {
      if (!confirm("Discard unplaced words?")) return;
    }
    onSave(placedWords, GRID_SIZE, GRID_SIZE);
  };

  const renderGrid = () => {
    const displayGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(""));

    placedWords.forEach((pw) => {
      for (let i = 0; i < pw.word.length; i++) {
        const r = pw.direction === "vertical" ? pw.row + i : pw.row;
        const c = pw.direction === "horizontal" ? pw.col + i : pw.col;

        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          displayGrid[r][c] = pw.word[i];
        }
      }
    });

    return (
      <div
        className="grid border border-slate-300 bg-white shadow-sm select-none"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          width: "100%",
          maxWidth: "600px",
          aspectRatio: "1/1",
        }}
      >
        {displayGrid.map((row, rIdx) =>
          row.map((cellChar: string, cIdx: number) => (
            <div
              key={`${rIdx}-${cIdx}`}
              onMouseDown={() => handleCellClick(rIdx, cIdx)}
              className={cn(
                "border-[0.5px] border-slate-100 flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors",
                cellChar ? "bg-blue-600 text-white border-blue-700" : "",
                selectedWordStr && !cellChar ? "hover:bg-green-100" : "",
              )}
            >
              {cellChar}
            </div>
          )),
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      <div className="flex-1 space-y-4 w-full">
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
          <div>
            <h3 className="font-bold text-lg">Step 2: Arrange Grid</h3>
            <p className="text-xs text-slate-500">
              1. Click word on right. 2. Click grid cell.
            </p>
          </div>

          <Button
            size="sm"
            variant={direction === "horizontal" ? "default" : "secondary"}
            onClick={() =>
              setDirection(
                direction === "horizontal" ? "vertical" : "horizontal",
              )
            }
            className="gap-2"
          >
            {direction === "horizontal" ? "Horizontal →" : "Vertical ↓"}
            <RotateCw className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex justify-center bg-slate-100 p-4 rounded-xl border overflow-auto">
          {renderGrid()}
        </div>

        <div className="flex justify-between gap-2 mt-4">
          <Button variant="outline" onClick={onBack}>
            Back to Words
          </Button>
          <Button
            onClick={handleFinish}
            disabled={placedWords.length === 0}
            className="w-40"
          >
            Generate Game <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">
              Available Words
            </h4>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
              {availableWords.length} left
            </span>
          </div>

          {availableWords.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
              <Typography variant="p" className="text-sm">
                All words placed!
              </Typography>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableWords.map((word) => (
                <button
                  key={word}
                  onClick={() => setSelectedWordStr(word)}
                  className={cn(
                    "px-3 py-1.5 text-sm border rounded-md transition-all font-medium",
                    selectedWordStr === word
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                      : "bg-white hover:bg-slate-50 text-slate-700",
                  )}
                >
                  {word}
                </button>
              ))}
            </div>
          )}

          {selectedWordStr && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Now click grid to place <b>{selectedWordStr}</b> ({direction})
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <h4 className="font-semibold mb-3 text-sm text-slate-700 uppercase tracking-wider">
            Placed Words
          </h4>
          {placedWords.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No words placed yet.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {placedWords.map((pw, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex gap-2 items-center">
                    <span className="bg-slate-200 text-slate-600 w-5 h-5 flex items-center justify-center rounded text-xs font-bold">
                      {pw.number}
                    </span>
                    <span className="font-medium text-slate-700">
                      {pw.word}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemovePlacedWord(idx)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
