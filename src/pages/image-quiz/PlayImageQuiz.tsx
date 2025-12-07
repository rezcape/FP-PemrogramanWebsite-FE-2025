import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Typography } from "@/components/ui/typography";
import {
  ArrowLeft,
  Pause,
  Play,
  Trophy,
  Timer,
  Star,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useImageQuizPlayData } from "@/api/image-quiz/useImageQuizPlayData";
import { checkImageQuizAnswer } from "@/api/image-quiz/useCheckImageQuizAnswer";

interface Answer {
  answer_id: string;
  answer_text: string;
}

interface Question {
  question_id: string;
  question_text: string;
  question_image_url: string | null;
  answers: Answer[];
}

interface ImageQuizPlayConfig {
  time_limit_seconds: number;
  total_tiles: number;
  reveal_interval: number;
}

interface ImageQuizGameData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  questions: Question[];
  tile_config: ImageQuizPlayConfig;
}

// Grid Configuration
const GRID_COLS = 16;
const GRID_ROWS = 8;
const TOTAL_BLOCKS = GRID_COLS * GRID_ROWS;

function PlayImageQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data State
  const {
    data: fetchedQuizData,
    loading: fetchingQuiz,
    error: fetchError,
  } = useImageQuizPlayData(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<ImageQuizGameData | null>(null);

  // Game State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeModal, setActiveModal] = useState<"menu" | "answer" | null>(
    null,
  );
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hiddenBlocks, setHiddenBlocks] = useState<number[]>([]);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timeLimit, setTimeLimit] = useState<number>(30);

  // Countdown State (3-2-1-Go)
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  // Score State
  const [currentScore, setCurrentScore] = useState(0);
  const [scoreDiff, setScoreDiff] = useState<{ show: boolean; val: number }>({
    show: false,
    val: 0,
  });

  // User Progress
  const [userAnswers, setUserAnswers] = useState<
    { question_id: string; selected_answer_id: string; time_spent_ms: number }[]
  >([]);

  // Results
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{
    total_questions: number;
    total_answered: number;
    correct_count: number;
    total_score: number;
    details: {
      question_id: string;
      is_correct: boolean;
      score: number;
      correct_answer_id: string;
    }[];
  } | null>(null);

  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // const timeTrackingRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);

  // 1. Fetch Data & Init
  useEffect(() => {
    if (fetchingQuiz) {
      setLoading(true);
      return;
    }
    setLoading(false);

    if (fetchError) {
      setError(fetchError);
      toast.error(fetchError);
      return;
    }

    if (fetchedQuizData) {
      console.log("Game Data Loaded:", fetchedQuizData);
      setQuiz(fetchedQuizData);
      const limit = fetchedQuizData.tile_config?.time_limit_seconds || 30;
      setTimeLimit(limit);
      setTimeLeft(limit);

      // Initialize grid
      const allBlocks = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
      setHiddenBlocks(allBlocks);
    }

    return () => cleanupTimers();
  }, [fetchedQuizData, fetchingQuiz, fetchError]);

  // Effect for 3-2-1 Countdown
  useEffect(() => {
    if (startCountdown === null) return;

    if (startCountdown > 0) {
      const timer = setTimeout(() => {
        setStartCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (startCountdown === 0) {
      setStartCountdown(null);
      startActualGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCountdown]);

  // Game Timer Countdown Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, timeLeft]);

  // Check Time Up
  useEffect(() => {
    if (timeLeft <= 0 && isPlaying && !isPaused) {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isPlaying, isPaused]);

  const cleanupTimers = () => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    // if (timeTrackingRef.current) clearInterval(timeTrackingRef.current);
  };

  const resetGrid = () => {
    console.log("Resetting Grid for next round");
    const allBlocks = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
    setHiddenBlocks(allBlocks);
    setIsPlaying(false);
    setIsPaused(false);
    setActiveModal(null);
    setIsTimeUp(false);
    cleanupTimers();
    setTimeLeft(timeLimit);
  };

  const initiateRoundStart = () => {
    console.log("Initiating Round Start");
    if (!quiz || finished) return;
    setStartCountdown(3);
  };

  const startActualGame = () => {
    console.log("Starting Actual Game");
    setIsPlaying(true);
    setIsPaused(false);
    setActiveModal(null);
    setIsTimeUp(false);
    setTimeLeft(timeLimit);
    roundStartTimeRef.current = Date.now();

    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    revealTimerRef.current = setInterval(
      () => {
        setHiddenBlocks((prev) => {
          if (prev.length === 0) {
            clearInterval(revealTimerRef.current!);
            return prev;
          }
          const randomIndex = Math.floor(Math.random() * prev.length);
          const newBlocks = [...prev];
          newBlocks.splice(randomIndex, 1);
          return newBlocks;
        });
      },
      (quiz?.tile_config?.reveal_interval || 0.2) * 1000,
    );
  };

  const handleTimeUp = () => {
    console.log("Time Up!");
    setIsTimeUp(true);
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(true);
    setActiveModal("answer");
  };

  // -- Pause Menu Logic --
  const handleOpenPauseMenu = () => {
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(true);
    setActiveModal("menu");
  };

  // -- Answer Logic --
  const handleOpenAnswerModal = () => {
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(true);
    setActiveModal("answer");
  };

  const handleResumeGame = () => {
    if (isTimeUp) return;

    console.log("Resuming Game");
    setIsPaused(false);
    setActiveModal(null);
    if (!finished && quiz && timeLeft > 0) {
      setIsPlaying(true);
      if (revealTimerRef.current) clearInterval(revealTimerRef.current);
      revealTimerRef.current = setInterval(
        () => {
          setHiddenBlocks((prev) => {
            if (prev.length === 0) {
              clearInterval(revealTimerRef.current!);
              return prev;
            }
            const randomIndex = Math.floor(Math.random() * prev.length);
            const newBlocks = [...prev];
            newBlocks.splice(randomIndex, 1);
            return newBlocks;
          });
        },
        (quiz?.tile_config?.reveal_interval || 0.2) * 1000,
      );
    }
  };

  const calculatePointsFromTimeSpent = (timeSpentSeconds: number) => {
    if (timeSpentSeconds <= 5) return 5;
    if (timeSpentSeconds <= 10) return 4;
    if (timeSpentSeconds <= 20) return 3;
    if (timeSpentSeconds <= 30) return 2;
    return 1;
  };

  const handleAnswerSelect = async (selectedAnswerId: string) => {
    if (!quiz) return;

    console.log("Answer Selected:", selectedAnswerId);
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveModal(null);
    setIsTimeUp(false);
    setHiddenBlocks([]);

    const currentQ = quiz.questions[currentQuestionIndex];

    // Calculate precise time spent based on start time
    const currentTime = Date.now();
    const timeSpentMs = currentTime - roundStartTimeRef.current;
    const timeSpentSeconds = timeSpentMs / 1000;

    const estimatedPoints = calculatePointsFromTimeSpent(timeSpentSeconds);

    setScoreDiff({ show: true, val: estimatedPoints });

    const updatedAnswers = [
      ...userAnswers,
      {
        question_id: currentQ.question_id,
        selected_answer_id: selectedAnswerId,
        time_spent_ms: timeSpentMs,
      },
    ];
    setUserAnswers(updatedAnswers);

    setTimeout(async () => {
      setScoreDiff({ show: false, val: 0 });
      setCurrentScore((prev) => prev + estimatedPoints);

      const isLast = currentQuestionIndex === quiz.questions.length - 1;
      if (!isLast) {
        console.log("Moving to next question");
        setCurrentQuestionIndex((prev) => prev + 1);
        resetGrid();
        initiateRoundStart();
      } else {
        console.log("Submitting Quiz");
        await submitQuiz(updatedAnswers);
      }
    }, 2500);
  };
  const handleExitGame = async () => {
    navigate("/my-projects");
  };

  const submitQuiz = async (finalAnswers: typeof userAnswers) => {
    try {
      setLoading(true);
      setFinished(true);
      cleanupTimers();

      const res = await checkImageQuizAnswer({
        game_id: id!,
        answers: finalAnswers,
      });

      setResult(res);
      setCurrentScore(res.total_score);
    } catch (err) {
      console.error(err);
      setError("Failed to submit results.");
      toast.error("Failed to submit results.");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const normalizedPath = path.replace(/\\/g, "/");
    return `${import.meta.env.VITE_API_URL}/${normalizedPath}`;
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading || fetchingQuiz || !quiz) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-300 border-t-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4 bg-slate-900 text-white">
        <Typography variant="h4" className="text-red-500">
          {error}
        </Typography>
        <Button onClick={() => navigate("/my-projects")}>Go Back</Button>
      </div>
    );
  }

  if (finished && result) {
    const { correct_count, total_questions, total_score } = result;
    const percentage =
      total_questions > 0 ? (correct_count / total_questions) * 100 : 0;

    // const starCount = (percentage / 100) * 5;
    // const fullStars = Math.floor(starCount);
    // const halfStar = starCount - fullStars >= 0.5;
    // const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-slate-900 p-4 text-white">
        <div className="bg-slate-800 rounded-xl p-8 md:p-12 text-center max-w-md w-full space-y-6 shadow-xl border border-slate-700">
          <Trophy className="mx-auto text-yellow-400" size={80} />
          <div className="space-y-2">
            <Typography variant="h2" className="font-bold text-3xl">
              {percentage >= 80
                ? "Great Job!"
                : percentage >= 50
                  ? "Good Effort!"
                  : "Nice Try!"}
            </Typography>
            <Typography variant="p" className="text-slate-400">
              You completed the game
            </Typography>
          </div>
          <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-2">
              <span className="text-sm text-slate-300">Accuracy</span>
              <span className="font-bold">{percentage.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-2">
              <span className="text-sm text-slate-300">Correct Answers</span>
              <span className="font-bold text-green-400">
                {correct_count} / {total_questions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Final Score</span>
              <span className="font-bold text-blue-400 text-xl">
                {total_score}
              </span>
            </div>
          </div>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                setFinished(false);
                setResult(null);
                setCurrentScore(0);
                setCurrentQuestionIndex(0);
                setUserAnswers([]);
                resetGrid();
              }}
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
              onClick={handleExitGame}
            >
              Exit Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestionIndex];
  if (!currentQ)
    return <div className="text-white">Error: Question not found</div>;

  return (
    <div className="w-full min-h-screen bg-slate-900 flex flex-col text-white">
      {/* Top Bar */}
      <div className="h-20 w-full flex justify-between items-center px-6 bg-slate-950 border-b border-slate-800 relative">
        {/* Left: Back & Info */}
        <div className="flex items-center gap-4 w-1/3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-slate-800"
            onClick={handleExitGame}
          >
            <ArrowLeft />
          </Button>
          <div>
            <Typography
              variant="h4"
              className="text-base font-bold leading-none truncate max-w-[150px]"
            >
              {quiz.name}
            </Typography>
            <Typography variant="small" className="text-slate-400 text-xs">
              Round {currentQuestionIndex + 1} / {quiz.questions.length}
            </Typography>
          </div>
        </div>

        {/* Center: Pause Button */}
        <div className="flex justify-center w-1/3 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          {!isPaused && isPlaying && (
            <Button
              size="icon"
              className="bg-slate-700 hover:bg-slate-600 text-white w-12 h-12 rounded-full shadow-lg border border-slate-600"
              onClick={handleOpenPauseMenu}
              title="Pause Game"
            >
              <Pause className="w-6 h-6" />
            </Button>
          )}
          {isPaused && (
            <Button
              size="icon"
              disabled={isTimeUp}
              className={`${isTimeUp ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white w-12 h-12 rounded-full shadow-lg border border-slate-600 transition-all`}
              onClick={handleResumeGame}
              title="Resume Game"
            >
              <Play className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Right: Timer & Score */}
        <div className="w-1/3 flex justify-end items-center gap-4">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft <= 10 && isPlaying ? "text-red-500 animate-pulse" : "text-blue-400"}`}
          >
            <Timer size={20} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Score Display */}
          <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2 relative">
            <Star className="text-yellow-400 w-5 h-5 fill-yellow-400" />
            <span className="text-xl font-bold text-white">{currentScore}</span>
            {scoreDiff.show && (
              <div className="absolute top-[-20px] right-0 text-green-400 font-bold text-xl animate-score-pop">
                +{scoreDiff.val}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden">
        <div className="mb-6 text-center max-w-2xl z-10">
          <Typography
            variant="h3"
            className="text-2xl md:text-3xl font-bold drop-shadow-lg"
          >
            {currentQ.question_text || "Guess the image!"}
          </Typography>
        </div>

        {/* Image & Grid Container */}
        <div
          className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800"
          style={{ aspectRatio: "2/1" }}
        >
          {/* Background Image */}
          {currentQ.question_image_url ? (
            <img
              src={getImageUrl(currentQ.question_image_url) || ""}
              alt="Hidden"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              No Image Available
            </div>
          )}

          {/* Overlay Grid */}
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            }}
          >
            {Array.from({ length: TOTAL_BLOCKS }, (_, i) => (
              <div
                key={i}
                className={`bg-slate-800 border border-slate-900/50 ${isPlaying ? "transition-opacity duration-500" : ""} ${
                  hiddenBlocks.includes(i) ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>

          {/* Start Button Overlay */}
          {!isPlaying &&
            hiddenBlocks.length === TOTAL_BLOCKS &&
            !isPaused &&
            startCountdown === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 backdrop-blur-sm">
                <Button
                  size="lg"
                  className="text-xl px-10 py-8 rounded-full bg-blue-600 hover:bg-blue-700 border-none shadow-2xl hover:scale-105 transition-transform"
                  onClick={initiateRoundStart}
                >
                  <Play fill="currentColor" className="mr-2 w-6 h-6" /> START
                  ROUND
                </Button>
              </div>
            )}

          {/* Countdown Overlay */}
          {startCountdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30 backdrop-blur-sm">
              <div className="text-9xl font-black text-white animate-pulse">
                {startCountdown === 0 ? "GO!" : startCountdown}
              </div>
            </div>
          )}
        </div>

        {/* Submit Answer Button (Bottom) */}
        <div className="mt-4 flex gap-4 z-10 h-24 items-center justify-center">
          {isPlaying && (
            <button
              className="relative w-24 h-24 rounded-full bg-red-600 border-4 border-red-800 shadow-[0_8px_0_#7f1d1d,0_15px_20px_rgba(220,38,38,0.5)] active:shadow-none active:translate-y-2 transition-all duration-100 ease-in-out flex items-center justify-center animate-pulse hover:animate-none group"
              onClick={handleOpenAnswerModal}
              aria-label="Submit Answer"
            >
              <span className="font-black text-white/90 text-xl tracking-wider drop-shadow-md z-10">
                BUZZ
              </span>
              {/* Shine/Reflection */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[0.5px]" />
            </button>
          )}
        </div>
      </div>

      {/* Unified Dialog Handler */}
      <Dialog
        open={isPaused && activeModal !== null}
        onOpenChange={(open) => {
          // If modal is being closed manually (e.g. by clicking outside),
          // and it's not the time-up forced answer modal, then resume.
          if (!open && activeModal !== "answer" && !isTimeUp) {
            handleResumeGame();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-lg bg-white text-black border-none p-6 rounded-xl backdrop-blur-md"
          onInteractOutside={(e) => {
            if (activeModal === "answer" || isTimeUp) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (activeModal === "answer" || isTimeUp) e.preventDefault();
          }}
        >
          {/* MENU PAUSE */}
          {activeModal === "menu" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-center mb-2">
                  Game Paused
                </DialogTitle>
                <Typography
                  variant="p"
                  className="text-center text-gray-500 mb-4"
                >
                  Timer is stopped.
                </Typography>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white text-lg"
                  onClick={handleResumeGame}
                >
                  <Play className="mr-2 w-5 h-5" /> Resume Game
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 text-lg"
                  onClick={() => {
                    setFinished(false);
                    setResult(null);
                    setCurrentScore(0);
                    setCurrentQuestionIndex(0);
                    setUserAnswers([]);
                    resetGrid();
                  }}
                >
                  <ArrowLeft className="mr-2 w-5 h-5" /> Restart Game
                </Button>
                <Button variant="ghost" onClick={handleExitGame}>
                  <LogOut className="mr-2 w-4 h-4" /> Exit
                </Button>
              </div>
            </>
          )}

          {/* ANSWER MODAL */}
          {activeModal === "answer" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-center mb-2">
                  {isTimeUp ? (
                    <span className="text-red-600">Time's Up!</span>
                  ) : (
                    "Choose Answer"
                  )}
                </DialogTitle>
                <Typography
                  variant="p"
                  className="text-center text-gray-500 mb-4"
                >
                  {isTimeUp
                    ? "You ran out of time! Select an answer to continue."
                    : "Time is paused. Choose carefully!"}
                </Typography>
              </DialogHeader>

              <div className="grid gap-4 mt-2">
                {currentQ.answers.map((ans, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-auto py-6 px-6 text-xl justify-start border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left rounded-xl"
                    onClick={() => handleAnswerSelect(ans.answer_id)}
                  >
                    <span className="bg-slate-100 text-slate-600 font-bold rounded-lg w-10 h-10 flex-shrink-0 flex items-center justify-center mr-4 text-lg">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium">{ans.answer_text}</span>
                  </Button>
                ))}
              </div>
              {/* No "Cancel & Resume" button here as per user request */}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlayImageQuiz;
