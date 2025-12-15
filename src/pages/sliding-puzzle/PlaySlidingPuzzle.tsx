/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Typography } from "@/components/ui/typography";
import {
  ArrowLeft,
  Trophy,
  Pause,
  Play,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  ArrowLeftIcon,
  ArrowRight,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
  LayoutGrid,
  Timer,
  Shapes,
  Volume2,
  VolumeX,
} from "lucide-react";
import phoenixImg from "./images/phoenix.png";
import loadingImg from "./images/loading.png";
import fireHorseImg from "./images/firehorse.png";
import blueHorseImg from "./images/bluehorse.png";
import blueDragonImg from "./images/bluedragon.png";
import redDragonImg from "./images/reddragon.png";
import countdownSfx from "./Audio/countdown.mp3";
import gameSfx from "./Audio/game.mp3";
import helloSfx from "./Audio/hello.mp3";
import winSfx from "./Audio/win.mp3";
import leftTigerImg from "./images/lefttigerwin.png";

interface SlidingPuzzleData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  is_published: boolean;
  puzzle_image: string;
  grid_size: number;
  time_limit?: number;
  max_hint_percent?: number;
}

interface Tile {
  id: number;
  position: number;
  isEmpty: boolean;
}

interface Move {
  tileId: number;
  direction: "up" | "down" | "left" | "right";
}

// Initial hint calculation based on difficulty (grid size)
const getMaxSteps = (gridSize: number) => {
  switch (gridSize) {
    case 3:
      return 31;
    case 4:
      return 80;
    case 5:
      return 200;
    case 6:
      return 500;
    default:
      return 100;
  }
};

const getInitialHints = (gridSize: number, percent: number = 30) => {
  const maxSteps = getMaxSteps(gridSize);
  return Math.floor(maxSteps * (percent / 100));
};

function PlaySlidingPuzzle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<SlidingPuzzleData | null>(null);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintMoves, setHintMoves] = useState<
    { tileId: number; direction: string }[]
  >([]);
  const [hintProgress, setHintProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isAnimatingWin, setIsAnimatingWin] = useState(false);
  const [userHintsLeft, setUserHintsLeft] = useState(3);
  const [gameResult, setGameResult] = useState<"won" | "lost" | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(false); // Loading state after clicking Start
  const [countdown, setCountdown] = useState<string>("3");
  const [isMuted, setIsMuted] = useState(false);

  // Dark mode styles
  const styles = {
    background: "#000000",
    color: "#ffffff",
    cardBg: "rgba(30, 30, 50, 0.95)",
    textSecondary: "#a0aec0",
    borderColor: "rgba(255, 255, 255, 0.15)",
  };

  // Premium Toast Style
  const toastStyle = {
    style: {
      background: "rgba(20, 20, 30, 0.95)",
      color: "#fff",
      border: "1px solid rgba(255, 107, 53, 0.5)",
      fontFamily: "'Sen', sans-serif",
      padding: "12px 20px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      borderRadius: "12px",
    },
    iconTheme: {
      primary: "#ff6b35",
      secondary: "#ffffff",
    },
  };

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/sliding-puzzle/${id}/play/public`,
        );
        setPuzzle(response.data.data);
      } catch (err) {
        setError("Failed to load puzzle.");
        console.error(err);
        toast.error("Failed to load puzzle.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPuzzle();
  }, [id]);

  // Disable browser zoom on this page
  useEffect(() => {
    // Set viewport meta to disable zoom
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalContent = viewportMeta?.getAttribute("content");
    if (viewportMeta) {
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
      );
    }

    // Prevent Ctrl + scroll zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Prevent Ctrl + +/- zoom
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeydown);

    // Cleanup - restore original viewport on unmount
    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeydown);
      if (viewportMeta && originalContent) {
        viewportMeta.setAttribute("content", originalContent);
      }
    };
  }, []);

  // Start Screen Audio (Hello)
  useEffect(() => {
    if (!isStarted && !loading) {
      const audio = new Audio(helloSfx);
      audio.volume = 0.7;
      // audio.playbackRate = 1.0;
      audio.muted = isMuted;

      const handleTimeUpdate = () => {
        if (audio.currentTime >= 2) {
          audio.pause();
        }
      };
      audio.addEventListener("timeupdate", handleTimeUpdate);

      audio.play().catch(console.error);

      return () => {
        audio.pause();
        audio.currentTime = 0;
        audio.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [isStarted, loading]);

  // Countdown effect
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (isLoadingGame) {
      // Play countdown sound
      audio = new Audio(countdownSfx);
      audio.volume = 0.8;
      audio.muted = isMuted;
      audio.play().catch((err) => console.error("Audio play failed:", err));

      // Removed explicit stop timer, let cleanup handle it or play until finish if needed

      setCountdown("3");

      timers.push(setTimeout(() => setCountdown("2"), 1000));
      timers.push(setTimeout(() => setCountdown("1"), 2000));
      timers.push(setTimeout(() => setCountdown("GO!"), 3000));

      return () => {
        timers.forEach(clearTimeout);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }
  }, [isLoadingGame]);

  // BGM Logic
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and Cleanup BGM
  useEffect(() => {
    bgmRef.current = new Audio(gameSfx);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.5;

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  // Control BGM Playback
  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    bgm.muted = isMuted;

    // Ensure volume is set (sometimes resets)
    bgm.volume = 0.5;

    if (isStarted && !isLoadingGame && !isFinished && !isPaused) {
      // Check if already playing to avoid interruption/error?
      // Audio.play() restarts if paused.
      if (bgm.paused) {
        bgm.play().catch((e) => console.error("BGM play failed:", e));
      }
    } else {
      if (!bgm.paused) {
        bgm.pause();
      }
    }
  }, [isStarted, isLoadingGame, isFinished, isPaused, isMuted]);

  // Initialize tiles
  useEffect(() => {
    if (puzzle) {
      const gridSize = puzzle.grid_size;
      const totalTiles = gridSize * gridSize;
      const initialTiles: Tile[] = Array.from(
        { length: totalTiles },
        (_, i) => ({
          id: i,
          position: i,
          isEmpty: i === totalTiles - 1,
        }),
      );
      setTiles(initialTiles);
    }
  }, [puzzle]);

  // Timer
  useEffect(() => {
    if (!isStarted || isPaused || isFinished) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        if (puzzle?.time_limit && prev >= puzzle.time_limit) {
          setIsFinished(true);
          setGameResult("lost");
          toast.error("Time's up!", toastStyle);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isPaused, isFinished, puzzle?.time_limit]);

  const shuffleTiles = useCallback(() => {
    if (!puzzle) return;

    // Show loading animation
    setIsLoadingGame(true);
    setIsFinished(false);
    setGameResult(null);

    // Wait 3.5 seconds for countdown animation, then start the game
    setTimeout(() => {
      const gridSize = puzzle.grid_size;
      const totalTiles = gridSize * gridSize;
      const shuffled = Array.from({ length: totalTiles }, (_, i) => i);

      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Ensure puzzle is solvable
      if (!isSolvable(shuffled, gridSize)) {
        // Swap first two non-empty tiles
        if (shuffled[0] !== totalTiles - 1 && shuffled[1] !== totalTiles - 1) {
          [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        } else {
          [shuffled[2], shuffled[3]] = [shuffled[3], shuffled[2]];
        }
      }

      const newTiles: Tile[] = shuffled.map((id, position) => ({
        id,
        position,
        isEmpty: id === totalTiles - 1,
      }));

      setTiles(newTiles);
      setMoves(0);
      setTime(0);
      setIsStarted(true);
      setIsPaused(false);
      setShowHint(false);
      setShowPreview(true); // Auto-show preview side by side
      setHintMoves([]);
      setHintProgress(null);
      setUserHintsLeft(
        getInitialHints(gridSize, puzzle.max_hint_percent ?? 30),
      );
      setIsAnimatingWin(false);
      setIsLoadingGame(false); // End loading
    }, 5000); // 3s countdown + 2s hold on GO
  }, [puzzle]);

  // Win Audio Effect
  useEffect(() => {
    if (gameResult === "won") {
      const audio = new Audio(winSfx);
      audio.volume = 0.8;
      audio.play().catch(console.error);
    }
  }, [gameResult]);

  const isSolvable = (arr: number[], gridSize: number) => {
    let inversions = 0;
    const totalTiles = gridSize * gridSize;

    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (
          arr[i] !== totalTiles - 1 &&
          arr[j] !== totalTiles - 1 &&
          arr[i] > arr[j]
        ) {
          inversions++;
        }
      }
    }

    if (gridSize % 2 === 1) {
      return inversions % 2 === 0;
    } else {
      const emptyRow = Math.floor(arr.indexOf(totalTiles - 1) / gridSize);
      return (inversions + emptyRow) % 2 === 1;
    }
  };

  const canMove = (tilePosition: number, emptyPosition: number): boolean => {
    if (!puzzle) return false;
    const gridSize = puzzle.grid_size;

    const tileRow = Math.floor(tilePosition / gridSize);
    const tileCol = tilePosition % gridSize;
    const emptyRow = Math.floor(emptyPosition / gridSize);
    const emptyCol = emptyPosition % gridSize;

    const rowDiff = Math.abs(tileRow - emptyRow);
    const colDiff = Math.abs(tileCol - emptyCol);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const moveTile = (clickedTile: Tile) => {
    if (isPaused || isFinished || !isStarted) return;

    const emptyTile = tiles.find((t) => t.isEmpty);
    if (!emptyTile) return;

    if (canMove(clickedTile.position, emptyTile.position)) {
      const newTiles = tiles.map((tile) => {
        if (tile.id === clickedTile.id) {
          return { ...tile, position: emptyTile.position };
        }
        if (tile.id === emptyTile.id) {
          return { ...tile, position: clickedTile.position };
        }
        return tile;
      });

      setTiles(newTiles);
      setMoves((prev) => prev + 1);

      // Update hint progress if user follows the hint
      if (hintProgress && hintMoves.length > 0) {
        const currentHint = hintMoves[0];
        if (currentHint.tileId === clickedTile.id) {
          // User followed the hint, update progress
          setHintProgress((prev) =>
            prev ? { ...prev, current: prev.current + 1 } : null,
          );
          // Remove the completed hint move
          setHintMoves((prev) => prev.slice(1));

          // If no more hints, clear progress after a delay
          if (hintMoves.length === 1) {
            setTimeout(() => {
              setHintProgress(null);
              setShowHint(false);
            }, 1000);
          }
        } else {
          // User didn't follow hint, clear hint
          setHintProgress(null);
          setHintMoves([]);
          setShowHint(false);
        }
      }

      // Check win condition
      if (checkWin(newTiles)) {
        setIsAnimatingWin(true);
        addPlayCount(id!);

        // Animate tiles one by one
        // Animate tiles one by one
        // Show win screen directly without tile animation
        setTimeout(() => {
          setIsFinished(true);
          setGameResult("won");

          setIsAnimatingWin(false);
          toast.success("Congratulations! You solved the puzzle!", toastStyle);
        }, 500);
      }
    }
  };

  const checkWin = (currentTiles: Tile[]): boolean => {
    return currentTiles.every((tile) => tile.id === tile.position);
  };

  const [cachedHint, setCachedHint] = useState<{
    path: Move[];
    found: boolean;
  } | null>(null);
  const [isCalculatingHint, setIsCalculatingHint] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./puzzleSolver.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e) => {
      const { success, found, path } = e.data;
      if (success) {
        // If path found, store it
        // Only store if we haven't manipulated tiles since sending (simple check not strictly needed if we assume linear flow)
        setCachedHint({ path, found });
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Trigger calculation whenever tiles change
  useEffect(() => {
    if (!puzzle || !isStarted || isFinished || isPaused) return;

    // Reset cached hint when tiles change
    setCachedHint(null);

    // Debounce slightly or just run? Run immediately for responsiveness.
    // If the worker is busy, we might want to terminate and restart, but for now queueing is okay.
    // Actually, for "instant" feel on rapid moves, terminating old request is better.

    // Simple approach: Just post message. Worker processes in order.
    // If user moves fast, the "hint" might be for previous state?
    // Ideally we want to cancel previous calculation.

    // Optimization: Terminate and restart worker if calculating?
    // Let's stick to simple first: Post message.

    // BETTER: Send with a timestamp/ID and ignore old responses?
    // For now, let's just let it compute. IDA* is fast enough for small steps.

    workerRef.current?.postMessage({
      tiles,
      gridSize: puzzle.grid_size,
    });
  }, [tiles, isStarted, isFinished, isPaused, puzzle]);

  const calculateHint = () => {
    if (!puzzle || !isStarted || isFinished || isPaused) return;
    if (userHintsLeft <= 0) {
      toast.error("No hints left!", toastStyle);
      return;
    }

    // If we have a cached hint, use it immediately
    if (cachedHint && cachedHint.path.length > 0) {
      applyHint(cachedHint.path, cachedHint.found);
    } else {
      // Fallback if worker hasn't finished yet (rare if pre-calc is working)
      toast.loading("Thinking...", { ...toastStyle, duration: 2000 });
      // We just wait for the effect to update cachedHint?
      // Or we can set a flag "waitingForHint" which triggers applyHint when cachedHint arrives.
      setIsCalculatingHint(true);
    }
  };

  // Effect to apply hint once it arrives if we are waiting
  useEffect(() => {
    if (isCalculatingHint && cachedHint) {
      setIsCalculatingHint(false);
      if (cachedHint.path.length > 0) {
        applyHint(cachedHint.path, cachedHint.found);
      } else {
        toast.error("Could not find a valid move.", toastStyle);
      }
    }
  }, [cachedHint, isCalculatingHint]);

  const applyHint = (path: any[], found: boolean) => {
    // Determine how many steps to show
    const stepsToShow = 1;
    // if (found) {
    //     if (gridSize === 4) stepsToShow = Math.min(2, path.length);
    //     else if (gridSize === 5) stepsToShow = Math.min(3, path.length);
    //     else if (gridSize >= 6) stepsToShow = Math.min(4, path.length);
    // }

    const selectedMoves = path.slice(0, stepsToShow);
    setHintMoves(selectedMoves);
    setShowHint(true);

    setHintProgress({ current: 0, total: found ? path.length : 1 });
    setUserHintsLeft((prev) => prev - 1);

    if (found) {
      toast.success(`Solution: ${path.length} steps to solve!`, toastStyle);
    } else {
      toast("Best next move calculated", { icon: "💡", ...toastStyle });
    }

    const timeout = found ? 8000 : 5000;
    setTimeout(() => {
      setShowHint(false);
      setHintProgress(null);
    }, timeout);
  };

  const addPlayCount = async (gameId: string) => {
    try {
      await api.post("/api/game/play-count", {
        game_id: gameId,
      });
    } catch (err) {
      console.error("Failed to update play count:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExit = async () => {
    if (isStarted && !isFinished) {
      await addPlayCount(id!);
    }

    navigate("/");
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">{error ?? "Puzzle not found"}</Typography>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const gridSize = puzzle.grid_size;
  const tileSize = Math.min(500 / gridSize, 120);
  const containerWidth = gridSize * tileSize;
  const containerHeight = gridSize * tileSize;

  // Main Game Screen
  return (
    <div
      className="puzzle-container font-['Sen']"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
        width: "100%",
        backgroundColor: styles.background,
        color: styles.color,
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <style>
        {`
                    @import url('https://fonts.googleapis.com/css2?family=Sen:wght@400;700;800&display=swap');
                    
                    .font-sen { font-family: 'Sen', sans-serif; }

                    /* Disable zoom */
                    .puzzle-container {
                        touch-action: pan-x pan-y;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        user-select: none;
                    }

                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.7; }
                    }

                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @keyframes phoenixFloat {
                        0%, 100% { 
                            transform: translateY(0px); 
                        }
                        50% { 
                            transform: translateY(-10px); 
                        }
                    }

                    @keyframes dragonFloat {
                        0%, 100% { 
                            transform: translateY(0px) scaleX(-1); 
                        }
                        50% { 
                            transform: translateY(-15px) scaleX(-1); 
                        }
                    }

                    @keyframes phoenixGlow {
                        0%, 100% { 
                            filter: drop-shadow(0 0 20px rgba(255, 107, 53, 0.4));
                        }
                        50% { 
                            filter: drop-shadow(0 0 35px rgba(255, 140, 0, 0.6));
                        }
                    }

                    /* Game Card */
                    .game-card {
                        background: rgba(10, 10, 18, 0.98);
                        backdrop-filter: blur(20px);
                        border-radius: 20px;
                        border: 2px solid rgba(255, 107, 53, 0.5);
                        box-shadow: 0 15px 50px rgba(0,0,0,0.6), 
                                    0 0 40px rgba(255, 107, 53, 0.3),
                                    0 0 80px rgba(255, 69, 0, 0.2),
                                    inset 0 0 30px rgba(255, 107, 53, 0.05);
                    }

                    /* Fixed sizes using vw - zoom independent */
                    .start-title {
                        font-size: clamp(2rem, 5vw, 7rem) !important;
                    }
                    .start-subtitle {
                        font-size: clamp(0.5rem, 0.8vw, 1rem) !important;
                    }

                    /* Premium Game Buttons */
                    .game-btn {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.8rem 1.5rem;
                        background: rgba(30, 30, 40, 0.6);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: white;
                        border-radius: 12px;
                        font-family: 'Sen', sans-serif;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        backdrop-filter: blur(10px);
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .game-btn:hover:not(:disabled) {
                        background: rgba(40, 40, 50, 0.8);
                        transform: translateY(-2px);
                        box-shadow: 0 6px 15px rgba(0,0,0,0.2), 0 0 15px rgba(255, 107, 53, 0.2);
                        border-color: rgba(255, 107, 53, 0.4);
                        color: #ff6b35;
                    }
                        transform: translateY(0);
                    }

                    .game-btn-orange {
                        background: rgba(255, 107, 53, 0.15) !important;
                        border-color: rgba(255, 107, 53, 0.3) !important;
                        color: #ffaa80 !important;
                    }
                    .game-btn-orange:hover:not(:disabled) {
                        background: rgba(255, 107, 53, 0.25) !important;
                        box-shadow: 0 0 20px rgba(255, 107, 53, 0.3) !important;
                        border-color: rgba(255, 107, 53, 0.8) !important;
                        color: #fff !important;
                    }

                    .game-btn-blue {
                        background: rgba(0, 150, 255, 0.8) !important;
                        border-color: rgba(0, 150, 255, 0.9) !important;
                        color: #ffffff !important;
                        box-shadow: 0 4px 10px rgba(0, 150, 255, 0.3) !important;
                    }
                    .game-btn-blue:hover:not(:disabled) {
                        background: rgba(0, 150, 255, 1) !important;
                        box-shadow: 0 0 25px rgba(0, 150, 255, 0.6) !important;
                        border-color: #fff !important;
                        transform: translateY(-2px);
                    }

                    .game-btn-outline {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.8rem 1.5rem;
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: rgba(255, 255, 255, 0.7);
                        border-radius: 12px;
                        font-family: 'Sen', sans-serif;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .game-btn-outline:hover {
                        border-color: rgba(255, 255, 255, 0.5);
                        color: white;
                        background: rgba(255, 255, 255, 0.05);
                    }

                    .game-btn-outline-blue {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.8rem 1.5rem;
                        background: rgba(0, 150, 255, 0.1);
                        border: 2px solid #0096ff;
                        color: #0096ff;
                        border-radius: 12px;
                        font-family: 'Sen', sans-serif;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 0 10px rgba(0, 150, 255, 0.1);
                    }
                    .game-btn-outline-blue:hover {
                        border-color: #4db8ff;
                        color: white;
                        background: rgba(0, 150, 255, 0.8);
                        box-shadow: 0 0 20px rgba(0, 150, 255, 0.4);
                    }

                    .label-badge {
                        display: inline-block;
                        padding: 0.4rem 1.2rem;
                        background: rgba(255, 107, 53, 0.15);
                        border: 1px solid rgba(255, 107, 53, 0.3);
                        border-radius: 50px;
                        color: #ff6b35;
                        font-size: 0.8rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 0.5rem;
                        box-shadow: 0 0 15px rgba(255, 107, 53, 0.1);
                    }
                    .label-badge-blue {
                        background: #0096ff !important;
                        border: 1px solid #00c3ff !important;
                        color: #ffffff !important;
                        box-shadow: 0 0 15px rgba(0, 150, 255, 0.4) !important;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                    }
                    .start-card {
                        max-width: clamp(300px, 45vw, 850px) !important;
                    }
                    .start-card-image {
                        width: clamp(120px, 12vw, 220px) !important;
                        height: clamp(120px, 12vw, 220px) !important;
                        min-width: clamp(120px, 12vw, 220px) !important;
                    }
                    .phoenix-img {
                        width: clamp(400px, 42vw, 800px) !important;
                    }
                    .start-container {
                        padding-left: clamp(1rem, 8vw, 12%) !important;
                    }

                    /* Responsive - Extra large screens (100% zoom on large monitors) */
                    @media (min-width: 1800px) {
                        .start-title { font-size: 9rem !important; }
                        .start-card { max-width: 950px !important; }
                        .phoenix-img { width: 900px !important; right: 8% !important; }
                    }

                    /* Responsive - Large screens (100% zoom) */
                    @media (max-width: 1799px) and (min-width: 1600px) {
                        .start-title { font-size: 8rem !important; }
                        .start-card { max-width: 900px !important; }
                        .phoenix-img { width: 850px !important; right: 6% !important; }
                    }

                    /* Responsive - 90% zoom */
                    @media (max-width: 1599px) and (min-width: 1400px) {
                        .start-title { font-size: 6.5rem !important; }
                        .start-card { max-width: 800px !important; }
                        .phoenix-img { width: 750px !important; right: 6% !important; }
                    }

                    /* Responsive - 80% zoom */
                    @media (max-width: 1399px) and (min-width: 1200px) {
                        .start-title { font-size: 5.5rem !important; }
                        .start-card { max-width: 700px !important; }
                        .start-card-image { width: 180px !important; height: 180px !important; min-width: 180px !important; }
                        .phoenix-img { width: 650px !important; right: 5% !important; top: -8% !important; }
                    }

                    /* Responsive - smaller screens / laptops */
                    @media (max-width: 1199px) and (min-width: 993px) {
                        .start-title { font-size: 4.5rem !important; }
                        .start-subtitle { font-size: 0.8rem !important; }
                        .start-card { max-width: 600px !important; padding: 1.5rem !important; gap: 1.5rem !important; }
                        .start-card-image { width: 160px !important; height: 160px !important; min-width: 160px !important; }
                        .phoenix-img { width: 500px !important; right: 3% !important; top: -5% !important; }
                        .start-container { padding-left: 8% !important; }
                    }

                    /* Responsive - tablet landscape */
                    @media (max-width: 992px) and (min-width: 769px) {
                        .puzzle-container { overflow-y: auto !important; }
                        .start-title { font-size: 3.8rem !important; }
                        .start-subtitle { font-size: 0.75rem !important; }
                        .start-card { 
                            max-width: 90% !important; 
                            flex-direction: column !important; 
                            padding: 1.5rem !important;
                            align-items: center !important;
                        }
                        .start-card-left { align-items: center !important; }
                        .start-card-image { width: 180px !important; height: 180px !important; }
                        .start-card-info { align-items: center !important; text-align: center !important; }
                        .phoenix-img { display: none !important; }
                        .start-container { 
                            width: 100% !important; 
                            padding-left: 5% !important; 
                            padding-right: 5% !important;
                            position: relative !important;
                            height: auto !important;
                            min-height: 100vh !important;
                        }
                    }

                    /* Responsive - tablet portrait / large mobile */
                    @media (max-width: 768px) and (min-width: 481px) {
                        .puzzle-container { overflow-y: auto !important; }
                        .start-title { font-size: 3rem !important; letter-spacing: 0.1em !important; }
                        .start-subtitle { font-size: 0.7rem !important; letter-spacing: 0.3em !important; }
                        .start-card { 
                            max-width: 95% !important; 
                            padding: 1.25rem !important; 
                            gap: 1.25rem !important; 
                            flex-direction: column !important;
                            align-items: center !important;
                        }
                        .start-card-left { align-items: center !important; }
                        .start-card-image { width: 150px !important; height: 150px !important; min-width: 150px !important; }
                        .start-card-info { align-items: center !important; text-align: center !important; }
                        .start-container { 
                            width: 100% !important; 
                            padding: 1rem !important;
                            position: relative !important;
                            height: auto !important;
                            min-height: 100vh !important;
                        }
                        .phoenix-img { display: none !important; }
                        .start-card h2 { font-size: 1.5rem !important; }
                        .start-card p { font-size: 0.9rem !important; }
                        .how-to-play { padding: 0.75rem !important; }
                        .how-to-play p { font-size: 0.8rem !important; }
                    }

                    /* Responsive - mobile */
                    @media (max-width: 480px) {
                        .puzzle-container { overflow-y: auto !important; }
                        .start-title { font-size: 2.5rem !important; letter-spacing: 0.08em !important; }
                        .start-subtitle { font-size: 0.6rem !important; letter-spacing: 0.2em !important; margin-top: 0.75rem !important; }
                        .start-card { 
                            max-width: 100% !important;
                            padding: 1rem !important; 
                            gap: 1rem !important;
                            border-radius: 16px !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            margin: 0 0.5rem !important;
                        }
                        .start-card-left { align-items: center !important; }
                        .start-card-image { width: 130px !important; height: 130px !important; min-width: 130px !important; border-radius: 12px !important; }
                        .start-card-info { align-items: center !important; text-align: center !important; }
                        .start-container { 
                            width: 100% !important; 
                            padding: 0.75rem !important;
                            gap: 1rem !important;
                            position: relative !important;
                            height: auto !important;
                            min-height: 100vh !important;
                        }
                        .phoenix-img { display: none !important; }
                        .start-card h2 { font-size: 1.3rem !important; }
                        .start-card p { font-size: 0.8rem !important; }
                        .stats-row { gap: 0.5rem !important; justify-content: center !important; }
                        .stats-row span { padding: 0.4rem 0.75rem !important; font-size: 0.75rem !important; }
                        .difficulty-badge { font-size: 0.7rem !important; padding: 0.4rem 0.9rem !important; }
                        .how-to-play { padding: 0.75rem !important; display: none !important; }
                        .action-buttons { flex-direction: column !important; width: 100% !important; }
                        .action-buttons button { width: 100% !important; }
                    }

                    /* Responsive - very small mobile */
                    @media (max-width: 360px) {
                        .start-title { font-size: 2rem !important; }
                        .start-subtitle { font-size: 0.5rem !important; }
                        .start-card-image { width: 110px !important; height: 110px !important; min-width: 110px !important; }
                        .start-card h2 { font-size: 1.1rem !important; }
                        .stats-row span { padding: 0.35rem 0.6rem !important; font-size: 0.7rem !important; }
                    }

                    /* Game Screen Horses - Hide on smaller screens */
                    .game-horse {
                        pointer-events: none;
                    }
                    @media (max-width: 1200px) {
                        .game-horse { opacity: 0.3 !important; }
                    }
                    @media (max-width: 992px) {
                        .game-horse { display: none !important; }
                    }

                    /* Win Screen Responsive */
                    .win-overlay {
                        flex-direction: row;
                    }
                    .win-tiger {
                        display: block;
                    }
                    .win-card {
                        padding: 3rem 4rem 3rem 8rem;
                    }
                    .win-title {
                        font-size: 5rem;
                    }
                    @media (max-width: 1200px) {
                        .win-tiger { width: 500px !important; max-width: 35vw !important; margin-right: -100px !important; }
                        .win-card { padding: 2.5rem 3rem 2.5rem 6rem !important; }
                        .win-title { font-size: 3.5rem !important; }
                    }
                    @media (max-width: 992px) {
                        .win-overlay { flex-direction: column !important; gap: 1rem !important; }
                        .win-tiger { display: none !important; }
                        .win-card { padding: 2rem !important; margin: 0 !important; max-width: 90vw !important; }
                        .win-title { font-size: 2.5rem !important; }
                    }
                    @media (max-width: 600px) {
                        .win-card { padding: 1.5rem !important; }
                        .win-title { font-size: 2rem !important; }
                        .win-stats { padding: 1rem 1.5rem !important; gap: 1rem !important; flex-wrap: wrap !important; }
                        .win-actions { flex-direction: column !important; width: 100% !important; }
                        .win-actions button { width: 100% !important; justify-content: center !important; }
                    }

                    /* Puzzle Grid Wrapper */
                    .puzzle-grid-wrapper {
                        position: relative;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                    }

                    /* Stats Display */
                    .stats-pill {
                        background: rgba(255, 107, 53, 0.1);
                        border: 1px solid rgba(255, 107, 53, 0.3);
                        backdrop-filter: blur(10px);
                    }

                    /* Label Badge */
                    .label-badge {
                        background: #ff6b35;
                        color: white;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        padding: 0.5rem 1.5rem;
                        border-radius: 8px;
                        font-size: 0.85rem;
                    }

                    /* Game Buttons */
                    .game-btn {
                        background: #ff6b35;
                        color: white !important;
                        font-weight: 600;
                        padding: 0.7rem 1.2rem;
                        border-radius: 8px;
                        border: none;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.9rem;
                        font-family: 'Sen', sans-serif;
                    }

                    .game-btn:hover {
                        background: #e55a2b;
                        transform: translateY(-1px);
                    }

                    .game-btn-outline {
                        background: transparent;
                        color: #ff6b35 !important;
                        border: 2px solid #ff6b35;
                        font-weight: 600;
                        padding: 0.7rem 1.2rem;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.9rem;
                        font-family: 'Sen', sans-serif;
                    }

                    .game-btn-outline:hover {
                        background: rgba(255, 107, 53, 0.1);
                    }

                    .game-btn-large {
                        padding: 1rem 2.5rem;
                        font-size: 1.1rem;
                        border-radius: 10px;
                    }

                    /* Title Styling */
                    .game-title {
                        font-size: 2.2rem;
                        font-weight: 800;
                        color: #ff6b35;
                        text-align: center;
                        margin-bottom: 0.5rem;
                    }

                    /* Loading Animation */
                    .loading-spinner {
                        border: 4px solid rgba(255, 107, 53, 0.2);
                        border-top-color: #ff6b35;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    .loading-text {
                        color: #ff6b35;
                        font-weight: 600;
                        font-size: 1.2rem;
                    }

                    @keyframes gradientText {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    .text-gradient-animated {
                        background: linear-gradient(-45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
                        background-size: 400% 400%;
                        animation: gradientText 5s ease infinite;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
                    }
                `}
      </style>

      {/* LOADING SCREEN */}
      {isLoadingGame && (
        <div
          className="font-sen"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: styles.background,
            zIndex: 100,
            gap: "2.5rem",
            overflow: "hidden",
          }}
        >
          {/* Red Dragon - Top Left */}
          <img
            src={redDragonImg}
            alt="Red Dragon"
            style={{
              position: "absolute",
              top: "-40%",
              left: "0%",
              width: "1000px",
              height: "auto",
              transform: "rotate(40deg) scaleX(-1)",
              opacity: 1,
              filter:
                "drop-shadow(0 0 50px rgba(255, 50, 0, 0.8)) contrast(1.25) brightness(1.1) saturate(1.4)",
              pointerEvents: "none",
            }}
          />

          {/* Blue Dragon - Bottom Right */}
          <img
            src={blueDragonImg}
            alt="Blue Dragon"
            style={{
              position: "absolute",
              bottom: "-50%",
              right: "6%",
              width: "1000px",
              height: "auto",
              transform: "rotate(20deg)",
              opacity: 1,
              filter:
                "drop-shadow(0 0 50px rgba(0, 150, 255, 0.9)) contrast(1.4) brightness(1.2) saturate(1.6)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Glow effect behind loading image */}
            <div
              style={{
                position: "absolute",
                width: "400px",
                height: "400px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255, 107, 53, 0.3) 0%, rgba(0, 150, 255, 0.2) 50%, transparent 70%)",
                filter: "blur(30px)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <img
              src={loadingImg}
              alt="Loading"
              style={{
                width: "450px",
                height: "450px",
                animation: "spin 1.5s linear infinite",
                filter:
                  "drop-shadow(0 0 30px rgba(255, 107, 53, 0.6)) drop-shadow(0 0 60px rgba(0, 150, 255, 0.4)) contrast(1.2) brightness(1.1) saturate(1.3)",
                position: "relative",
                zIndex: 1,
              }}
            />
            {/* Text inside the spinner */}
            <div
              style={{
                position: "absolute",
                zIndex: 2,
                textAlign: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "6rem",
                  fontWeight: 800,
                  fontFamily: "'Sen', sans-serif",
                  background:
                    "linear-gradient(90deg, #ff6b35, #ffa500, #0096ff, #ff6b35)",
                  backgroundSize: "300% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "gradientShift 2s ease-in-out infinite",
                  filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.8))",
                  lineHeight: 1,
                }}
              >
                <span
                  key={countdown}
                  style={{
                    display: "inline-block",
                    animation:
                      "pulse 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  }}
                >
                  {countdown}
                </span>
              </h2>
            </div>
          </div>
        </div>
      )}
      {/* Phoenix Logo - Fixed position, only on Start Screen */}
      {!isStarted && !isLoadingGame && (
        <img
          src={phoenixImg}
          alt="Phoenix Logo"
          className="phoenix-img"
          style={{
            position: "fixed",
            top: "-12%",
            right: "7%",
            width: "760px",
            height: "auto",
            zIndex: 9999,
            pointerEvents: "none",
            opacity: 0.9,
            animation:
              "phoenixFloat 6s ease-in-out infinite, phoenixGlow 4s ease-in-out infinite",
          }}
        />
      )}

      {/* START SCREEN - Title + Card on Left 60% */}
      {!isStarted && !isLoadingGame && (
        <div
          className="start-container"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "60%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            zIndex: 10,
            padding: "2rem",
            paddingLeft: "12%",
          }}
        >
          {/* Game Title - Vertical */}
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <span
              className="start-title"
              style={{
                display: "block",
                fontSize: "7rem",
                fontWeight: 900,
                fontFamily: "'Sen', sans-serif",
                letterSpacing: "0.15em",
                color: "#ff6b35",
                lineHeight: 0.9,
                textShadow:
                  "0 0 40px rgba(255, 107, 53, 0.8), 0 0 80px rgba(255, 69, 0, 0.4)",
              }}
            >
              SLIDING
            </span>
            <span
              className="start-title"
              style={{
                display: "block",
                fontSize: "7rem",
                fontWeight: 900,
                fontFamily: "'Sen', sans-serif",
                letterSpacing: "0.15em",
                color: "#ffa500",
                lineHeight: 0.9,
                textShadow:
                  "0 0 40px rgba(255, 165, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4)",
              }}
            >
              PUZZLE
            </span>
            <p
              className="start-subtitle"
              style={{
                fontSize: "1rem",
                color: "rgba(255, 165, 0, 0.5)",
                fontFamily: "'Sen', sans-serif",
                letterSpacing: "0.5em",
                margin: 0,
                marginTop: "1.5rem",
                textAlign: "center",
              }}
            >
              CHALLENGE YOUR MIND
            </p>
          </div>

          <div
            className="start-card"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              gap: "3rem",
              padding: "2.5rem",
              width: "100%",
              maxWidth: "900px",
              background: "rgba(10, 10, 14, 0.75)",
              backdropFilter: "blur(30px)",
              borderRadius: "32px",
              border: "1px solid rgba(255, 107, 53, 0.3)",
              boxShadow:
                "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255, 107, 53, 0.2)",
            }}
          >
            {/* Left side - Puzzle Image */}
            <div
              className="start-card-left"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                className="start-card-image"
                style={{
                  width: "220px",
                  height: "220px",
                  minWidth: "220px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.4), 0 0 0 3px rgba(255, 107, 53, 0.3)",
                }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}/${puzzle.puzzle_image}`}
                  alt="Puzzle Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              {/* Difficulty Badge */}
              <div
                className="difficulty-badge"
                style={{
                  padding: "0.5rem 1.25rem",
                  background:
                    gridSize <= 3
                      ? "rgba(34, 197, 94, 0.2)"
                      : gridSize <= 4
                        ? "rgba(251, 191, 36, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                  border: `1px solid ${gridSize <= 3 ? "rgba(34, 197, 94, 0.4)" : gridSize <= 4 ? "rgba(251, 191, 36, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                  borderRadius: "50px",
                  color:
                    gridSize <= 3
                      ? "#22c55e"
                      : gridSize <= 4
                        ? "#fbbf24"
                        : "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {gridSize <= 3
                  ? "⭐ Easy"
                  : gridSize <= 4
                    ? "⭐⭐ Medium"
                    : "⭐⭐⭐ Hard"}
              </div>
            </div>

            {/* Middle - Info */}
            <div
              className="start-card-info"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Title & Description */}
              <div>
                <h2
                  style={{
                    fontSize: "3rem",
                    fontWeight: 900,
                    fontFamily: "'Sen', sans-serif",
                    margin: "0 0 0.5rem 0",
                    background:
                      "linear-gradient(90deg, #ffffff 0%, #a0aec0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.2))",
                  }}
                >
                  {puzzle.name}
                </h2>

                {puzzle.description && (
                  <p
                    style={{
                      color: "#a0aec0",
                      fontSize: "1rem",
                      lineHeight: 1.6,
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    {puzzle.description}
                  </p>
                )}
              </div>

              {/* Stats Row */}
              <div
                className="stats-row"
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 1.25rem",
                    background: "rgba(255, 107, 53, 0.15)",
                    border: "1px solid rgba(255, 107, 53, 0.4)",
                    borderRadius: "12px",
                    color: "#ff8c5a",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  <LayoutGrid size={18} strokeWidth={2.5} /> {gridSize}x
                  {gridSize}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 1.25rem",
                    background: "rgba(251, 191, 36, 0.15)",
                    border: "1px solid rgba(251, 191, 36, 0.4)",
                    borderRadius: "12px",
                    color: "#fbbf24",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  <Timer size={18} strokeWidth={2.5} />{" "}
                  {puzzle.time_limit ?? 300}s
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 1.25rem",
                    background: "rgba(167, 139, 250, 0.15)",
                    border: "1px solid rgba(167, 139, 250, 0.4)",
                    borderRadius: "12px",
                    color: "#a78bfa",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  <Shapes size={18} strokeWidth={2.5} />{" "}
                  {gridSize * gridSize - 1} Pieces
                </span>
              </div>

              {/* How to Play */}
              <div
                className="how-to-play"
                style={{
                  padding: "1.25rem",
                  background:
                    "linear-gradient(to right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 215, 0, 0.2)",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    color: "#ffd700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lightbulb size={24} strokeWidth={2} />
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 0.25rem 0",
                      color: "#fff",
                      fontSize: "1rem",
                      fontWeight: 700,
                    }}
                  >
                    How to Play
                  </h4>
                  <p
                    style={{
                      color: "#a0aec0",
                      fontSize: "0.9rem",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Click adjacent tiles to move them into the empty space.
                    Arrange the full image to win!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="action-buttons"
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "auto",
                  paddingTop: "0.5rem",
                }}
              >
                <button
                  onClick={shuffleTiles}
                  style={{
                    flex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.8rem",
                    padding: "1.2rem 2rem",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    fontFamily: "'Sen', sans-serif",
                    background:
                      "linear-gradient(90deg, #ff6b35 0%, #ff4500 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "16px",
                    cursor: "pointer",
                    boxShadow:
                      "0 10px 30px -5px rgba(255, 69, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 15px 40px -5px rgba(255, 69, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px -5px rgba(255, 69, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)";
                  }}
                >
                  <Play size={24} fill="white" /> START GAME
                </button>
                <button
                  onClick={handleExit}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    padding: "1.2rem 1.5rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: 700,
                    fontFamily: "'Sen', sans-serif",
                    transition: "all 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.03)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <ArrowLeft size={20} /> BACK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME SCREEN (after game starts) */}
      {isStarted && !isLoadingGame && (
        <div
          className="font-sen"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            zIndex: 4,
            width: "100%",
            maxWidth: "1200px",
            paddingTop: "2rem",
            paddingBottom: "3rem",
          }}
        >
          {/* Game Screen Horses */}
          {/* Fire Horse - Left */}
          <div
            className="game-horse"
            style={{
              position: "fixed",
              top: "0%",
              left: "-10%",
              width: "900px",
              height: "auto",
              animation: "phoenixFloat 5s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <img
              src={fireHorseImg}
              alt="Fire Horse Game"
              style={{
                width: "100%",
                height: "auto",
                transform: "rotate(15deg)",
                opacity: 1,
                filter:
                  "drop-shadow(0 0 60px rgba(255, 50, 0, 0.6)) contrast(1.3) brightness(1.15) saturate(1.5)",
              }}
            />
          </div>

          {/* Blue Horse - Right */}
          <div
            className="game-horse"
            style={{
              position: "fixed",
              top: "20%",
              right: "-8%",
              width: "800px",
              height: "auto",
              animation: "phoenixFloat 5s ease-in-out infinite 1s",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <img
              src={blueHorseImg}
              alt="Blue Horse Game"
              style={{
                width: "100%",
                height: "auto",
                transform: "scaleX(-1)",
                opacity: 1,
                filter:
                  "drop-shadow(0 0 60px rgba(0, 150, 255, 0.6)) contrast(1.5) brightness(1.25) saturate(1.8)",
              }}
            />
          </div>

          {/* Stats Row */}
          <div
            className="stats-pill"
            style={{
              display: "flex",
              gap: "3rem",
              justifyContent: "center",
              padding: "1rem 3rem",
              borderRadius: "16px",
              fontSize: "2rem",
              fontWeight: 600,
              fontFamily: "'Sen', sans-serif",
              lineHeight: 1,
              background: "rgba(30, 30, 40, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  opacity: 0.8,
                  textTransform: "uppercase",
                  color: "#a0aec0",
                  letterSpacing: "2px",
                  marginBottom: "0.2rem",
                }}
              >
                Moves
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "2.5rem",
                  fontFamily: "'Sen', sans-serif",
                  background:
                    "linear-gradient(135deg, #ff6b35 0%, #ff8c00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 10px rgba(255, 107, 53, 0.4))",
                }}
              >
                {moves}
              </span>
            </div>
            <div
              style={{
                width: "1px",
                height: "60px",
                background:
                  "linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent)",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  opacity: 0.8,
                  textTransform: "uppercase",
                  color: "#a0aec0",
                  letterSpacing: "2px",
                  marginBottom: "0.2rem",
                }}
              >
                Time
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "2.5rem",
                  fontFamily: "'Sen', sans-serif",
                  background:
                    "linear-gradient(135deg, #0096ff 0%, #00c6ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 10px rgba(0, 150, 255, 0.4))",
                }}
              >
                {formatTime(time)}
              </span>
            </div>
          </div>

          {/* Puzzle and Preview Side by Side */}
          <div
            style={{
              display: "flex",
              gap: "2.5rem",
              justifyContent: "center",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Puzzle Grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span className="label-badge">Puzzle</span>
              <div
                className="puzzle-grid-wrapper"
                style={{
                  position: "relative",
                  width: `${containerWidth}px`,
                  height: `${containerHeight}px`,
                  boxShadow:
                    "0 0 60px rgba(255, 107, 53, 0.25), inset 0 0 20px rgba(255, 107, 53, 0.1)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "3px solid rgba(255, 107, 53, 0.8)",
                  backgroundColor: "rgba(30, 30, 40, 0.9)",
                  backdropFilter: "blur(10px)",
                  filter: isPaused
                    ? "blur(5px)"
                    : "drop-shadow(0 0 15px rgba(255, 107, 53, 0.4))",
                }}
              >
                {tiles.map((tile) => {
                  const row = Math.floor(tile.position / gridSize);
                  const col = tile.position % gridSize;
                  const sourceRow = Math.floor(tile.id / gridSize);
                  const sourceCol = tile.id % gridSize;
                  const hintIndex = showHint
                    ? hintMoves.findIndex((h) => h.tileId === tile.id)
                    : -1;
                  const hint = hintIndex >= 0 ? hintMoves[hintIndex] : null;

                  return (
                    <div
                      key={tile.id}
                      style={{
                        position: "absolute",
                        width: `${tileSize}px`,
                        height: `${tileSize}px`,
                        left: `${col * tileSize}px`,
                        top: `${row * tileSize}px`,
                        backgroundImage: tile.isEmpty
                          ? "none"
                          : `url(${import.meta.env.VITE_API_URL}/${puzzle.puzzle_image})`,
                        backgroundSize: `${gridSize * tileSize}px ${gridSize * tileSize}px`,
                        backgroundPosition: `-${sourceCol * tileSize}px -${sourceRow * tileSize}px`,
                        cursor: tile.isEmpty ? "default" : "pointer",
                        opacity: tile.isEmpty ? 0 : 1,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        border: tile.isEmpty
                          ? "none"
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        boxShadow: tile.isEmpty
                          ? "none"
                          : "0 4px 6px rgba(0,0,0,0.3)",
                        transform: "scale(0.98)",
                      }}
                      onClick={() =>
                        !tile.isEmpty && !isAnimatingWin && moveTile(tile)
                      }
                    >
                      {hint && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(234, 179, 8, 0.9)",
                          }}
                        >
                          {hint.direction === "up" && (
                            <ArrowUp color="white" size={tileSize / 2} />
                          )}
                          {hint.direction === "down" && (
                            <ArrowDown color="white" size={tileSize / 2} />
                          )}
                          {hint.direction === "left" && (
                            <ArrowLeftIcon color="white" size={tileSize / 2} />
                          )}
                          {hint.direction === "right" && (
                            <ArrowRight color="white" size={tileSize / 2} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Paused Overlay */}
                {isPaused && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "1.5rem",
                        borderRadius: "50%",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                      }}
                    >
                      <Play size={40} color="#ff6b35" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview - Same Size as Puzzle */}
            {showPreview && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <span className="label-badge label-badge-blue">Preview</span>
                <div
                  className="puzzle-grid-wrapper"
                  style={{
                    width: `${containerWidth}px`,
                    height: `${containerHeight}px`,

                    boxShadow:
                      "0 0 60px rgba(0, 150, 255, 0.25), inset 0 0 20px rgba(0, 150, 255, 0.1)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "3px solid rgba(0, 150, 255, 0.8)",
                    backgroundColor: "rgba(30, 30, 40, 0.9)",
                    backdropFilter: "blur(10px)",
                    filter: "drop-shadow(0 0 15px rgba(0, 150, 255, 0.4))",
                  }}
                >
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${puzzle.puzzle_image}`}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <button
              className="game-btn game-btn-orange"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button className="game-btn game-btn-orange" onClick={shuffleTiles}>
              <RotateCcw size={16} /> Restart
            </button>
            <button
              className="game-btn game-btn-blue"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? "Hide" : "Show"}
            </button>
            <button
              className="game-btn game-btn-blue"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              className="game-btn game-btn-blue"
              onClick={calculateHint}
              disabled={userHintsLeft <= 0 || showHint || isCalculatingHint}
              style={{
                opacity:
                  userHintsLeft <= 0 || showHint || isCalculatingHint ? 0.5 : 1,
              }}
            >
              {isCalculatingHint ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Lightbulb size={18} />
              )}
              Hint ({userHintsLeft})
            </button>
            <button className="game-btn-outline-blue" onClick={handleExit}>
              <ArrowLeft size={18} /> Exit
            </button>
          </div>
        </div>
      )}

      {/* WIN OVERLAY - Premium Design */}
      {gameResult === "won" && (
        <div
          className="win-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 5, 10, 0.95)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Sen', sans-serif",
            gap: "0",
            padding: "2rem",
          }}
        >
          {/* Left Side: Image */}
          <div
            className="win-tiger"
            style={{
              animation: "phoenixFloat 6s ease-in-out infinite",
              flex: "0 0 auto",
              zIndex: 50,
              position: "relative",
              marginRight: "-150px",
            }}
          >
            <img
              src={leftTigerImg}
              alt="Left Tiger"
              style={{
                width: "740px",
                maxWidth: "45vw",
                height: "auto",
                objectFit: "contain",
                filter:
                  "drop-shadow(0 0 50px rgba(255, 107, 53, 0.4)) contrast(1.25) saturate(1.3) brightness(1.1)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Right Side: Content Card */}
          <div
            className="win-card"
            style={{
              position: "relative",
              zIndex: 40,
              display: "flex",
              background: "rgba(30, 30, 40, 0.85)",
              backdropFilter: "blur(16px)",
              padding: "3rem 4rem 3rem 8rem",
              borderRadius: "30px",
              border: "1px solid rgba(255, 107, 53, 0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
            }}
          >
            <Trophy
              size={80}
              color="#ffd700"
              style={{ filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))" }}
            />

            <div style={{ textAlign: "center" }}>
              <h1
                className="win-title"
                style={{
                  fontSize: "5rem",
                  fontWeight: 900,
                  background:
                    "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: 0,
                  lineHeight: 1.1,
                  filter: "drop-shadow(0 0 30px rgba(255, 140, 0, 0.4))",
                }}
              >
                PUZZLE SOLVED!
              </h1>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "1.2rem",
                  letterSpacing: "0.2em",
                  marginTop: "0.5rem",
                }}
              >
                MAGNIFICENT VICTORY
              </p>
            </div>

            {/* Stats */}
            <div
              className="win-stats"
              style={{
                display: "flex",
                gap: "2rem",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "1.5rem 3rem",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "#a0aec0",
                    textTransform: "uppercase",
                  }}
                >
                  Time
                </span>
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#0096ff",
                  }}
                >
                  {formatTime(time)}
                </span>
              </div>
              <div
                style={{ width: "1px", background: "rgba(255,255,255,0.1)" }}
              />
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "#a0aec0",
                    textTransform: "uppercase",
                  }}
                >
                  Moves
                </span>
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#ff6b35",
                  }}
                >
                  {moves}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div
              className="win-actions"
              style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
            >
              <button
                onClick={shuffleTiles}
                className="game-btn"
                style={{ fontSize: "1.2rem", padding: "1rem 2rem" }}
              >
                <RotateCcw size={20} /> Play Again
              </button>
              <button
                onClick={handleExit}
                className="game-btn-outline-blue"
                style={{ fontSize: "1.2rem", padding: "1rem 2rem" }}
              >
                <ArrowLeft size={20} /> Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaySlidingPuzzle;
