import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Pause,
  Play,
  Clock,
  Trophy,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Typography } from "@/components/ui/typography";
import api from "@/api/axios";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// --- [BARU] IMPORT CONFETTI ---
import Confetti from "react-confetti";

// --- IMPORT AUDIO (Pastikan path sesuai) ---
import bgmSound from "@/assets/bgm.mp3";

// --- HELPER FORMAT WAKTU (MM:SS) ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

interface WordData {
  id: string;
  number: number;
  direction: "horizontal" | "vertical";
  row_index: number;
  col_index: number;
  length: number;
  clue: string;
}

interface GameData {
  id: string;
  name: string;
  rows: number;
  cols: number;
  words: WordData[];
}

interface CellData {
  isActive: boolean;
  char: string;
  number?: number;
  wordIds: string[];
  isCorrect?: boolean;
}

interface CheckResult {
  word_id: string;
  is_correct: boolean;
}

export default function PlayCrossword() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameData | null>(null);
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- STATE GAMEPLAY ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [volume, setVolume] = useState(0.4);

  // --- [BARU] STATE UNTUK UKURAN LAYAR (Supaya Confetti Full Screen) ---
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Focus Management
  const [selectedCell, setSelectedCell] = useState<{
    r: number;
    c: number;
  } | null>(null);
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // --- LOGIKA AUDIO ---
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(bgmSound);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (loading || isPaused || isFinished) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.log("Autoplay dicegah browser:", err);
      });
    }
  }, [loading, isPaused, isFinished]);

  // --- [BARU] LOGIKA RESIZE LAYAR (Untuk Confetti) ---
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------------------------------------------------------
  // --- FETCHING & GAME LOGIC ---
  // ---------------------------------------------------------

  useEffect(() => {
    const fetchGame = async () => {
      try {
        let res;
        try {
          res = await api.get(
            `/api/game/game-type/crossword/${id}/play/public`,
          );
        } catch {
          res = await api.get(
            `/api/game/game-type/crossword/${id}/play/private`,
          );
        }
        const data: GameData = res.data.data;
        setGame(data);
        initializeGrid(data);
      } catch (err) {
        console.error("Failed to load game", err);
        toast.error("Failed to load game data");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGame();
  }, [id, navigate]);

  useEffect(() => {
    let interval: number;
    if (game && !isPaused && !isFinished) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [game, isPaused, isFinished]);

  const initializeGrid = (data: GameData) => {
    const newGrid: CellData[][] = Array(data.rows)
      .fill(null)
      .map(() =>
        Array(data.cols).fill({
          isActive: false,
          char: "",
          wordIds: [],
        }),
      );

    data.words.forEach((word) => {
      for (let i = 0; i < word.length; i++) {
        const r =
          word.direction === "vertical" ? word.row_index + i : word.row_index;
        const c =
          word.direction === "horizontal" ? word.col_index + i : word.col_index;

        if (r < data.rows && c < data.cols) {
          const cell = { ...newGrid[r][c] };
          cell.isActive = true;
          cell.wordIds = [...cell.wordIds, word.id];
          if (i === 0) cell.number = word.number;
          newGrid[r][c] = cell;
        }
      }
    });
    setGrid(newGrid);
    inputRefs.current = Array(data.rows)
      .fill(null)
      .map(() => Array(data.cols).fill(null));
  };

  const handleInputChange = (r: number, c: number, val: string) => {
    if (!grid[r][c].isActive || isPaused || isFinished) return;
    const char = val.slice(-1).toUpperCase();
    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = { ...newGrid[r][c], char };
    setGrid(newGrid);
    if (char) moveFocus(r, c, 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (isPaused || isFinished) return;
    if (e.key === "Backspace" && !grid[r][c].char) {
      moveFocus(r, c, -1);
    } else if (e.key === "ArrowRight") {
      setDirection("horizontal");
      moveFocus(r, c, 1, "horizontal");
    } else if (e.key === "ArrowDown") {
      setDirection("vertical");
      moveFocus(r, c, 1, "vertical");
    }
  };

  const moveFocus = (
    r: number,
    c: number,
    step: number,
    overrideDir?: "horizontal" | "vertical",
  ) => {
    const dir = overrideDir || direction;
    let currR = r;
    let currC = c;
    let found = false;
    let attempts = 0;
    while (!found && attempts < 50) {
      if (dir === "horizontal") currC += step;
      else currR += step;
      if (
        currR < 0 ||
        currR >= (game?.rows || 0) ||
        currC < 0 ||
        currC >= (game?.cols || 0)
      )
        break;
      if (grid[currR][currC]?.isActive) {
        inputRefs.current[currR][currC]?.focus();
        setSelectedCell({ r: currR, c: currC });
        found = true;
      }
      attempts++;
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (!grid[r][c].isActive || isPaused || isFinished) return;
    if (selectedCell?.r === r && selectedCell?.c === c) {
      setDirection(direction === "horizontal" ? "vertical" : "horizontal");
    }
    setSelectedCell({ r, c });
  };

  const handleSubmit = async () => {
    if (!game) return;
    setSubmitting(true);
    try {
      const answersPayload = game.words.map((w) => {
        let userAnswer = "";
        for (let i = 0; i < w.length; i++) {
          const r = w.direction === "vertical" ? w.row_index + i : w.row_index;
          const c =
            w.direction === "horizontal" ? w.col_index + i : w.col_index;
          userAnswer += grid[r][c].char || " ";
        }
        return { word_id: w.id, user_answer: userAnswer };
      });
      const res = await api.post(`/api/game/game-type/crossword/${id}/check`, {
        answers: answersPayload,
      });
      const results = res.data.data.results as CheckResult[];
      const newGrid = [...grid];
      game.words.forEach((w) => {
        const result = results.find((r) => r.word_id === w.id);
        const isCorrect = result?.is_correct || false;
        for (let i = 0; i < w.length; i++) {
          const r = w.direction === "vertical" ? w.row_index + i : w.row_index;
          const c =
            w.direction === "horizontal" ? w.col_index + i : w.col_index;
          const cell = { ...newGrid[r][c] };
          if (!isCorrect) cell.isCorrect = false;
          else if (cell.isCorrect !== false) cell.isCorrect = true;
          newGrid[r][c] = cell;
        }
      });
      setGrid(newGrid);
      const allCorrect = results.every((r) => r.is_correct);

      if (allCorrect) {
        setIsPaused(true);
        setIsFinished(true);
        // Confetti akan muncul otomatis karena isFinished = true
      } else {
        toast.error("Some answers are incorrect.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check answers");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setTimer(0);
    setIsPaused(false);
    setIsFinished(false);
    const resetGrid = grid.map((row) =>
      row.map((cell) => ({ ...cell, char: "", isCorrect: undefined })),
    );
    setGrid(resetGrid);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!game) return <div>Game not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 relative overflow-hidden">
      {/* --- [BARU] COMPONENT CONFETTI --- */}
      {/* Hanya muncul jika isFinished = true. Z-Index tinggi agar di atas semua elemen */}
      {isFinished && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={500}
          gravity={0.2}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
        />
      )}

      {/* --- HEADER --- */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 sticky top-0 z-10 bg-slate-50 py-2 shadow-sm rounded-xl px-4 border border-slate-100">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Exit
        </Button>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm font-mono font-bold text-lg transition-all",
              isPaused || isFinished
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : "bg-white text-slate-700",
              isFinished && "bg-green-100 text-green-700 border-green-200",
            )}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timer)}
          </div>

          {/* VOLUME CONTROL */}
          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-2 rounded-full border shadow-sm">
            <button onClick={() => setVolume(volume === 0 ? 0.4 : 0)}>
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          <Button
            size="icon"
            variant="outline"
            onClick={() => !isFinished && setIsPaused(!isPaused)}
            disabled={isFinished}
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || isPaused || isFinished}
        >
          {submitting ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          <span className="hidden sm:inline">Check Answer</span>
        </Button>
      </div>

      {/* --- OVERLAYS --- */}
      {isPaused && !isFinished && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center space-y-4 animate-in zoom-in-95 duration-200">
            <Typography variant="h2" className="text-slate-800">
              Game Paused
            </Typography>
            <p className="text-slate-500">
              Take a break! The timer is stopped.
            </p>
            <Button
              size="lg"
              onClick={() => setIsPaused(false)}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" /> Resume Game
            </Button>
          </div>
        </div>
      )}

      {isFinished && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300 max-w-sm w-full border-4 border-green-100 relative z-[101]">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Trophy className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <Typography variant="h2" className="text-slate-800 font-bold">
                Puzzle Solved!
              </Typography>
              <p className="text-slate-500">
                Great job! You finished this crossword in:
              </p>
              <div className="text-4xl font-mono font-bold text-slate-800 tracking-wider">
                {formatTime(timer)}
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                onClick={handleRestart}
                className="w-full bg-slate-800 hover:bg-slate-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Play Again
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- GAME AREA --- */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl justify-center items-start">
        <div
          className="bg-white p-4 rounded-xl shadow-sm border overflow-auto max-w-full"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${game.cols}, minmax(30px, 40px))`,
            gap: "2px",
            backgroundColor: "#000",
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              if (!cell.isActive) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="bg-black w-full h-full aspect-square"
                  />
                );
              }
              return (
                <div
                  key={`${r}-${c}`}
                  className="relative bg-white aspect-square"
                >
                  {cell.number && (
                    <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-bold leading-none select-none">
                      {cell.number}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputRefs.current[r][c] = el;
                    }}
                    type="text"
                    maxLength={1}
                    disabled={isPaused || isFinished}
                    value={cell.char}
                    onChange={(e) => handleInputChange(r, c, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    onClick={() => handleCellClick(r, c)}
                    className={cn(
                      "w-full h-full text-center font-bold text-lg sm:text-xl uppercase outline-none focus:bg-yellow-100 transition-colors disabled:bg-slate-50 disabled:cursor-default",
                      cell.isCorrect === true &&
                        "bg-green-100 text-green-800 disabled:bg-green-50",
                      cell.isCorrect === false && "bg-red-100 text-red-800",
                    )}
                  />
                </div>
              );
            }),
          )}
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <Typography variant="h4" className="mb-3 border-b pb-2">
              Horizontal
            </Typography>
            <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {game.words
                .filter((w) => w.direction === "horizontal")
                .map((w) => (
                  <li key={w.id} className="flex gap-2">
                    <span className="font-bold min-w-5">{w.number}.</span>
                    <span className="text-slate-600">{w.clue}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <Typography variant="h4" className="mb-3 border-b pb-2">
              Vertical
            </Typography>
            <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {game.words
                .filter((w) => w.direction === "vertical")
                .map((w) => (
                  <li key={w.id} className="flex gap-2">
                    <span className="font-bold min-w-5">{w.number}.</span>
                    <span className="text-slate-600">{w.clue}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
