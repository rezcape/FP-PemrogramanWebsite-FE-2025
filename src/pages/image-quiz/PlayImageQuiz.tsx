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
  Volume2,
  VolumeX,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useImageQuizPlayData } from "@/api/image-quiz/useImageQuizPlayData";
import { checkImageQuizAnswer } from "@/api/image-quiz/useCheckImageQuizAnswer";
import { useImageQuizSound } from "@/hooks/useImageQuizSound";

// --- INTERFACES ---
interface Answer {
  answer_id: string;
  answer_text: string;
}

interface Question {
  question_id: string;
  question_text: string;
  question_image_url: string | null;
  correct_answer_id: string;
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
  theme?: "adventure" | "family100" | "ocean"; // [PERBAIKAN] Tambah theme
}

// Grid Configuration
const GRID_COLS = 16;
const GRID_ROWS = 8;
const TOTAL_BLOCKS = GRID_COLS * GRID_ROWS;

// --- THEME CONFIGURATION ---
const THEME_STYLES = {
  family100: {
    bgClass: "f100-bg",
    font: "font-f100",
    panelClass: "f100-panel",
    modalClass: "bg-[#0f172a] border-4 border-blue-500",
    titleText: "f100-title-text",
    buttonPrimary: "f100-btn-primary",
    buttonSecondary: "f100-btn-secondary",
    textHighlight: "text-yellow-400",
    buzzerClass: "f100-buzzer",
    optionButton:
      "bg-gradient-to-r from-blue-900 to-blue-950 border-2 border-blue-500 hover:border-yellow-400 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)]",
    optionLetter:
      "bg-blue-800 border border-blue-400 text-white font-digital group-hover:bg-yellow-500 group-hover:text-black",
    css: (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700;800&family=Orbitron:wght@400;700;900&display=swap');
        .font-f100 { font-family: 'Chakra Petch', sans-serif; }
        .font-digital { font-family: 'Orbitron', monospace; }
        .f100-bg { background: radial-gradient(circle at center, #172554 0%, #020617 100%); color: white; }
        .f100-panel { background: linear-gradient(180deg, #1e3a8a 0%, #172554 100%); border: 4px solid #3b82f6; box-shadow: 0 0 0 2px #1e3a8a, 0 0 20px rgba(59, 130, 246, 0.6); border-radius: 1rem; }
        .f100-title-text { font-family: 'Chakra Petch', sans-serif; font-weight: 800; text-transform: uppercase; background: linear-gradient(180deg, #ffffff 0%, #93c5fd 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(2px 2px 0px #1e3a8a); }
        .f100-btn-primary { background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%); border: 3px solid #fef3c7; color: #451a03; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 6px 0 #92400e; transition: all 0.1s; }
        .f100-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #92400e; }
        .f100-btn-secondary { background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%); border: 3px solid #bfdbfe; color: white; font-weight: 700; }
        .f100-buzzer { background: radial-gradient(circle at 30% 30%, #ef4444 0%, #991b1b 100%); border: 4px solid #fca5a5; box-shadow: 0 10px 0 #7f1d1d, 0 0 50px rgba(220, 38, 38, 0.6); }
        .f100-buzzer:active { transform: scale(0.95); box-shadow: 0 2px 0 #7f1d1d; }
      `}</style>
    ),
  },
  adventure: {
    bgClass: "at-bg",
    font: "font-adventure",
    panelClass: "at-panel",
    modalClass: "bg-[#48C9B0] border-4 border-black",
    titleText: "font-black text-white drop-shadow-[2px_2px_0px_#000]",
    buttonPrimary: "at-btn-jake",
    buttonSecondary: "at-btn-bmo",
    textHighlight: "text-[#d97706]",
    buzzerClass: "at-buzzer",
    optionButton:
      "bg-white border-4 border-black hover:bg-yellow-100 rounded-xl shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]",
    optionLetter:
      "bg-black text-white font-black rounded-lg group-hover:bg-[#FFD93D] group-hover:text-black",
    css: (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Nunito:wght@400;600;700&display=swap');
        .font-adventure { font-family: 'Fredoka', sans-serif; }
        .font-digital { font-family: 'Nunito', sans-serif; font-weight: 800; }
        .at-bg { background-color: #48C9B0; color: #1a1a1a; }
        .at-panel { background-color: white; border: 4px solid #1a1a1a; border-radius: 1.5rem; box-shadow: 6px 6px 0px 0px #1a1a1a; }
        .at-btn-jake { background-color: #FFD93D; color: #1a1a1a; border: 3px solid #1a1a1a; font-weight: 700; box-shadow: 4px 4px 0px 0px #1a1a1a; border-radius: 1rem; }
        .at-btn-jake:hover { background-color: #FFE066; transform: translate(-2px, -2px); box-shadow: 6px 6px 0px 0px #1a1a1a; }
        .at-btn-bmo { background-color: #5BC0BE; color: white; border: 3px solid #1a1a1a; font-weight: 700; box-shadow: 4px 4px 0px 0px #1a1a1a; border-radius: 1rem; }
        .at-buzzer { background: #E74C3C; border: 4px solid #1a1a1a; box-shadow: 6px 6px 0px 0px #1a1a1a; border-radius: 50%; }
        .at-buzzer:active { transform: scale(0.95); box-shadow: 2px 2px 0px 0px #1a1a1a; }
      `}</style>
    ),
  },
  ocean: {
    bgClass: "ocean-bg",
    font: "font-ocean",
    panelClass: "ocean-panel",
    modalClass:
      "bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl",
    titleText: "text-[#0c4a6e] font-black tracking-wide drop-shadow-sm",
    buttonPrimary: "ocean-btn-primary",
    buttonSecondary: "ocean-btn-secondary",
    textHighlight: "text-[#0284c7]",
    buzzerClass: "ocean-buzzer",
    optionButton:
      "bg-white/80 border-2 border-white/50 hover:bg-[#e0f2fe] hover:border-[#38bdf8] rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl backdrop-blur-sm",
    optionLetter:
      "bg-[#38bdf8] text-white font-bold rounded-xl shadow-md group-hover:bg-[#0284c7] transition-colors",
    css: (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;800&family=Quicksand:wght@400;600;700&display=swap');
        
        .font-ocean { font-family: 'Baloo 2', cursive; }
        .font-digital { font-family: 'Quicksand', sans-serif; font-weight: 700; }
        
        /* Animasi Background Gelombang */
        @keyframes wave {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .ocean-bg {
          background: linear-gradient(-45deg, #0ea5e9, #22d3ee, #67e8f9, #e0f2fe);
          background-size: 400% 400%;
          animation: wave 15s ease infinite;
          color: #0f172a;
        }

        /* Glassmorphism Panel */
        .ocean-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }

        .ocean-btn-primary {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          border: none;
          border-radius: 1rem;
          font-weight: 800;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
          transition: all 0.3s ease;
        }
        .ocean-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
          background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
        }

        .ocean-btn-secondary {
          background: white;
          color: #0284c7;
          border: 2px solid #e0f2fe;
          border-radius: 1rem;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .ocean-btn-secondary:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
        }

        .ocean-buzzer {
          background: radial-gradient(circle at 30% 30%, #f43f5e 0%, #e11d48 100%);
          border: 4px solid white;
          box-shadow: 
            0 10px 20px rgba(225, 29, 72, 0.4),
            0 0 0 8px rgba(255, 255, 255, 0.3); /* Ring luar transparan */
          border-radius: 50%;
          transition: transform 0.1s;
        }
        .ocean-buzzer:active {
          transform: scale(0.95);
        }
      `}</style>
    ),
  },
};

function PlayImageQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSound, stopSound, toggleMute, isMuted } = useImageQuizSound();

  const {
    data: fetchedQuizData,
    loading: fetchingQuiz,
    error: fetchError,
  } = useImageQuizPlayData(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<ImageQuizGameData | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeModal, setActiveModal] = useState<"menu" | "answer" | null>(
    null,
  );
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hiddenBlocks, setHiddenBlocks] = useState<number[]>([]);

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  const [currentScore, setCurrentScore] = useState(0);
  const [scoreParticles, setScoreParticles] = useState<
    { blockIndex: number; delay: number }[]
  >([]);

  const [userAnswers, setUserAnswers] = useState<
    { question_id: string; selected_answer_id: string; time_spent_ms: number }[]
  >([]);

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
  const roundStartTimeRef = useRef<number>(0);

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
      setQuiz(fetchedQuizData as unknown as ImageQuizGameData);
      const limit = fetchedQuizData.tile_config?.time_limit_seconds || 30;
      setTimeLimit(limit);
      setTimeLeft(limit);

      const allBlocks = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
      setHiddenBlocks(allBlocks);
    }

    return () => {
      cleanupTimers();
      stopSound("bgm");
    };
  }, [fetchedQuizData, fetchingQuiz, fetchError]);

  useEffect(() => {
    if (startCountdown === null) return;

    if (startCountdown > 0) {
      playSound("tick");
      const timer = setTimeout(() => {
        setStartCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (startCountdown === 0) {
      setStartCountdown(null);
      startActualGame();
    }
  }, [startCountdown]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - 1);
          if (next <= 10 && next > 0) playSound("tick");
          return next;
        });
      }, 1000);
    } else {
      stopSound("bgm");
    }
    return () => clearInterval(timer);
  }, [isPlaying, isPaused, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && isPlaying && !isPaused) {
      handleTimeUp();
    }
  }, [timeLeft, isPlaying, isPaused]);

  const cleanupTimers = () => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  };

  const resetGrid = () => {
    console.log("Resetting Grid for next round");
    const allBlocks = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
    setHiddenBlocks(allBlocks);
    setScoreParticles([]);
    setIsPlaying(false);
    setIsPaused(false);
    setActiveModal(null);
    setIsTimeUp(false);
    cleanupTimers();
    setTimeLeft(timeLimit);
    stopSound("bgm");
  };

  const initiateRoundStart = () => {
    console.log("Initiating Round Start");
    if (!quiz || finished) return;
    setStartCountdown(3);
    playSound("countdown");
  };

  const startActualGame = () => {
    console.log("Starting Actual Game");
    setIsPlaying(true);
    setIsPaused(false);
    setActiveModal(null);
    setIsTimeUp(false);
    setTimeLeft(timeLimit);
    roundStartTimeRef.current = Date.now();
    playSound("bgm");

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
          playSound("reveal");
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
    playSound("timeUp");
    stopSound("bgm");
  };

  const handleOpenPauseMenu = () => {
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(true);
    setActiveModal("menu");
    stopSound("bgm");
  };

  const handleOpenAnswerModal = () => {
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(true);
    setActiveModal("answer");
    playSound("buzz");
    stopSound("bgm");
  };

  const handleResumeGame = () => {
    if (isTimeUp) return;
    console.log("Resuming Game");
    setIsPaused(false);
    setActiveModal(null);
    if (!finished && quiz && timeLeft > 0) {
      setIsPlaying(true);
      playSound("bgm");
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
            playSound("reveal");
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
    return 1;
  };

  const ScoreParticle = ({
    delay,
    blockIndex,
  }: {
    delay: number;
    blockIndex: number;
  }) => {
    const [opacity, setOpacity] = useState(0);
    useEffect(() => {
      const appearTimer = setTimeout(() => {
        setOpacity(1);
        const fadeOutTimer = setTimeout(() => {
          setOpacity(0);
        }, 800);
        return () => clearTimeout(fadeOutTimer);
      }, delay);
      return () => clearTimeout(appearTimer);
    }, [delay, blockIndex]);

    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300"
        style={{ opacity: opacity }}
      >
        <span className="text-yellow-400 font-black text-3xl drop-shadow-[3px_3px_0px_#000] font-digital">
          +1
        </span>
      </div>
    );
  };

  const handleAnswerSelect = async (selectedAnswerId: string) => {
    if (!quiz) return;
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveModal(null);
    setIsTimeUp(false);
    setHiddenBlocks([]);
    stopSound("bgm");

    const currentQ = quiz.questions[currentQuestionIndex];
    const currentTime = Date.now();
    const timeSpentMs = currentTime - roundStartTimeRef.current;
    const timeSpentSeconds = timeSpentMs / 1000;

    const isCorrect = selectedAnswerId === currentQ.correct_answer_id;
    const estimatedPoints = isCorrect
      ? calculatePointsFromTimeSpent(timeSpentSeconds)
      : 0;

    if (isCorrect) playSound("correct");
    else playSound("wrong");

    setCurrentScore((prev) => prev + estimatedPoints);

    if (isCorrect && estimatedPoints > 0) {
      const availableIndices = [...hiddenBlocks];
      const particles: { blockIndex: number; delay: number }[] = [];
      for (let i = 0; i < estimatedPoints; i++) {
        if (availableIndices.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const blockIndex = availableIndices[randomIndex];
        particles.push({ blockIndex, delay: i * 200 });
        availableIndices.splice(randomIndex, 1);
      }
      setScoreParticles(particles);
      setTimeout(
        () => {
          setScoreParticles([]);
        },
        (estimatedPoints > 0 ? estimatedPoints - 1 : 0) * 200 + 1400,
      );
    }

    const updatedAnswers = [
      ...userAnswers,
      {
        question_id: currentQ.question_id,
        selected_answer_id: selectedAnswerId,
        time_spent_ms: timeSpentMs,
      },
    ];
    setUserAnswers(updatedAnswers);

    if (isCorrect) {
      toast.success("Correct Answer!", {
        icon: "🎉",
        style: { borderRadius: "10px", background: "#166534", color: "#fff" },
      });
    } else {
      toast.error("Wrong Answer!", {
        icon: "❌",
        style: { borderRadius: "10px", background: "#991b1b", color: "#fff" },
      });
    }

    setTimeout(
      async () => {
        const isLast = currentQuestionIndex === quiz.questions.length - 1;
        if (!isLast) {
          setCurrentQuestionIndex((prev) => prev + 1);
          resetGrid();
          initiateRoundStart();
        } else {
          await submitQuiz(updatedAnswers);
        }
      },
      isCorrect ? 2500 : 1500,
    );
  };

  const handleExitGame = async () => {
    stopSound("bgm");
    navigate("/my-projects");
  };

  const fetchAndUpdateUser = async () => {
    try {
      const response = await api.get("/api/auth/me");
      useAuthStore.getState().setUser(response.data.data);
    } catch (error) {
      console.error("Failed to fetch and update user data:", error);
      toast.error("Failed to refresh user data.");
    }
  };

  const submitQuiz = async (finalAnswers: typeof userAnswers) => {
    try {
      setLoading(true);
      setFinished(true);
      cleanupTimers();
      stopSound("bgm");
      const res = await checkImageQuizAnswer({
        game_id: id!,
        answers: finalAnswers,
      });
      setResult(res);
      setCurrentScore(res.total_score);
      playSound("result");
      await fetchAndUpdateUser();
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

  // [PERBAIKAN] Tentukan Tema Aktif (Otomatis baca dari database, atau default ke 'family100')
  const activeThemeId =
    (quiz?.theme as keyof typeof THEME_STYLES) || "family100";
  const activeStyle = THEME_STYLES[activeThemeId] || THEME_STYLES.family100;

  if (loading || fetchingQuiz || !quiz) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-[#020617] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4 bg-[#020617] text-white">
        <Typography variant="h4" className="text-red-500 font-f100">
          {error}
        </Typography>
        <Button
          onClick={() => navigate("/my-projects")}
          className="f100-btn-secondary"
        >
          Go Back
        </Button>
      </div>
    );
  }

  // [PERBAIKAN] Bagian Result Screen (Menggunakan activeStyle)
  if (finished && result) {
    const { correct_count, total_questions, total_score } = result;
    const percentage =
      total_questions > 0 ? (correct_count / total_questions) * 100 : 0;

    return (
      <div
        className={`w-full min-h-screen flex justify-center items-center p-4 relative overflow-hidden ${activeStyle.bgClass} ${activeStyle.font}`}
      >
        {activeStyle.css}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent animate-pulse pointer-events-none"></div>

        <div
          className={`p-6 md:p-8 text-center max-w-lg w-full space-y-6 relative z-10 ${activeStyle.panelClass}`}
        >
          <div className="relative inline-block">
            <Trophy
              className={`mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] ${activeStyle.textHighlight}`}
              size={80}
            />
            <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full"></div>
          </div>

          <div className="space-y-2">
            <h2
              className={`text-3xl uppercase tracking-wider ${activeStyle.titleText}`}
            >
              {percentage >= 80
                ? "Survey Says... Top Score!"
                : percentage >= 50
                  ? "Good Answer!"
                  : "Nice Try!"}
            </h2>
            <p className="font-medium text-sm opacity-80">
              You completed the game!
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl border-2 border-white/10 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="uppercase tracking-widest text-xs font-bold opacity-80">
                Accuracy
              </span>
              <span className="font-digital text-xl font-bold">
                {percentage.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="uppercase tracking-widest text-xs font-bold opacity-80">
                Correct
              </span>
              <span className="font-digital text-xl font-bold">
                {correct_count} <span className="text-xs opacity-50">/</span>{" "}
                {total_questions}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span
                className={`uppercase tracking-widest font-bold text-sm ${activeStyle.textHighlight}`}
              >
                Final Score
              </span>
              <span
                className={`font-digital text-3xl font-black drop-shadow-lg ${activeStyle.textHighlight}`}
              >
                {total_score}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-3">
            <Button
              className={`w-full h-12 text-lg ${activeStyle.buttonPrimary}`}
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
              className={`w-full h-10 text-base ${activeStyle.buttonSecondary}`}
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

  // [PERBAIKAN] Bagian Game Screen (Menggunakan activeStyle)
  return (
    <div
      className={`w-full min-h-screen flex flex-col overflow-hidden ${activeStyle.bgClass} ${activeStyle.font}`}
    >
      {activeStyle.css}

      {/* Top Bar */}
      <div
        className={`h-16 w-full flex justify-between items-center px-4 md:px-8 border-b-4 shadow-xl relative z-20 ${activeStyle.panelClass} rounded-none border-x-0 border-t-0`}
      >
        <div className="flex items-center gap-4 w-1/3">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-200 hover:text-white hover:bg-white/10 rounded-full"
            onClick={handleExitGame}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="hidden md:block">
            <h1
              className={`text-lg md:text-xl leading-none ${activeStyle.titleText}`}
            >
              {quiz.name}
            </h1>
            <span className="text-xs font-bold tracking-widest uppercase opacity-70">
              Round {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="hidden md:flex flex-col items-center opacity-50">
            <div className="w-24 h-1 bg-current rounded-full mb-1"></div>
            <div className="w-16 h-1 bg-current rounded-full"></div>
          </div>
        </div>

        <div className="w-1/3 flex justify-end items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-white/10 rounded-full mr-2"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          <div
            className={`${activeStyle.panelClass} px-3 py-1 flex items-center gap-2 min-w-[100px] justify-center ${timeLeft <= 10 && isPlaying ? "border-red-500 animate-pulse" : ""}`}
            style={{ borderRadius: "0.5rem", borderWidth: "2px" }}
          >
            <Timer
              className={`w-4 h-4 ${timeLeft <= 10 ? "text-red-500" : ""}`}
            />
            <span
              className={`font-digital text-xl font-bold ${timeLeft <= 10 ? "text-red-500" : ""}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          <div
            className={`${activeStyle.panelClass} px-4 py-1 flex items-center gap-2 min-w-[90px] justify-center relative overflow-hidden group`}
            style={{ borderRadius: "0.5rem", borderWidth: "2px" }}
          >
            <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors"></div>
            <Star
              className={`w-4 h-4 drop-shadow-md ${activeStyle.textHighlight}`}
              fill="currentColor"
            />
            <span
              className={`font-digital text-xl font-bold drop-shadow-sm ${activeStyle.textHighlight}`}
            >
              {currentScore}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 relative">
        <div className="w-full max-w-4xl mb-2 md:mb-4 text-center relative z-10">
          <div
            className={`inline-block px-8 py-2 rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.3)] ${activeStyle.panelClass}`}
          >
            <Typography
              variant="h3"
              className="text-lg md:text-xl font-bold drop-shadow-md"
            >
              {currentQ.question_text || "Reveal the image and guess!"}
            </Typography>
          </div>
        </div>

        {/* Image Grid */}
        <div
          className={`relative w-full max-w-4xl aspect-[2/1] bg-black rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)] ${activeStyle.panelClass}`}
        >
          {isPaused && !isTimeUp && !activeModal && (
            <div className="absolute inset-0 bg-black/60 z-20 backdrop-blur-sm flex items-center justify-center">
              <h2 className="text-4xl font-black text-white uppercase tracking-widest">
                Paused
              </h2>
            </div>
          )}

          {currentQ.question_image_url ? (
            <img
              src={getImageUrl(currentQ.question_image_url) || ""}
              alt="Hidden"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-900">
              <span className="font-digital">NO IMAGE SIGNAL</span>
            </div>
          )}

          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            }}
          >
            {Array.from({ length: TOTAL_BLOCKS }, (_, i) => {
              const particle = scoreParticles.find((p) => p.blockIndex === i);
              return (
                <div key={i} className="relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 border border-black/20 ${isPlaying ? "transition-transform duration-500 ease-in-out" : ""} ${hiddenBlocks.includes(i) ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
                  >
                    <div className="absolute inset-[1px] border border-white/10 opacity-30"></div>
                  </div>
                  {particle && (
                    <ScoreParticle delay={particle.delay} blockIndex={i} />
                  )}
                </div>
              );
            })}
          </div>

          {!isPlaying &&
            hiddenBlocks.length === TOTAL_BLOCKS &&
            !isPaused &&
            startCountdown === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                <Button
                  onClick={initiateRoundStart}
                  className={`text-2xl py-8 px-12 rounded-full h-auto animate-bounce shadow-lg ${activeStyle.buttonPrimary}`}
                >
                  START ROUND
                </Button>
              </div>
            )}

          {startCountdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 backdrop-blur-sm">
              <div className="text-[12rem] font-digital font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse">
                {startCountdown === 0 ? "GO!" : startCountdown}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="mt-4 md:mt-6 flex gap-8 z-10 items-center justify-center w-full">
          <div className="hidden md:block">
            <Button
              variant="outline"
              size="icon"
              className={`w-14 h-14 rounded-full border-2 ${activeStyle.buttonSecondary}`}
              onClick={
                isPlaying && !isPaused ? handleOpenPauseMenu : handleResumeGame
              }
              disabled={!isPlaying && !isPaused}
            >
              {isPaused ? (
                <Play className="w-6 h-6 ml-1" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
          </div>

          <div className="relative group">
            {isPlaying && (
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse group-hover:bg-red-500/50 transition-all"></div>
            )}
            <button
              disabled={!isPlaying || isPaused}
              className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full transition-all duration-150 ease-out flex items-center justify-center ${activeStyle.buzzerClass} ${!isPlaying || isPaused ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:scale-105 active:scale-95"}`}
              onClick={handleOpenAnswerModal}
            >
              <span className="font-f100 font-black text-white text-xl md:text-2xl tracking-widest drop-shadow-md z-10 pointer-events-none">
                BUZZ
              </span>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-10 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[1px] pointer-events-none" />
            </button>
          </div>
          <div className="hidden md:block w-14"></div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog
        open={isPaused && activeModal !== null}
        onOpenChange={(open) => {
          if (!open && activeModal !== "answer" && !isTimeUp)
            handleResumeGame();
        }}
      >
        <DialogContent
          className={`sm:max-w-2xl p-0 overflow-hidden ${activeStyle.modalClass}`}
          onInteractOutside={(e) => {
            if (activeModal === "answer" || isTimeUp) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (activeModal === "answer" || isTimeUp) e.preventDefault();
          }}
        >
          <div
            className={`p-4 border-b-2 border-black/10 flex items-center justify-center relative overflow-hidden ${activeStyle.panelClass} rounded-none border-x-0 border-t-0`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
            <DialogTitle
              className={`text-3xl font-bold uppercase tracking-widest drop-shadow-md relative z-10 ${activeStyle.titleText}`}
            >
              {activeModal === "menu"
                ? "Game Paused"
                : isTimeUp
                  ? "Time's Up!"
                  : "Who is it?"}
            </DialogTitle>
          </div>

          <div className="p-8 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            {activeModal === "menu" && (
              <div className="flex flex-col gap-4 relative z-10">
                <p className="text-center text-lg mb-4 font-bold opacity-80">
                  The clock is stopped. Ready to continue?
                </p>
                <Button
                  className={`text-xl py-6 ${activeStyle.buttonPrimary}`}
                  onClick={handleResumeGame}
                >
                  <Play className="mr-2 w-6 h-6" /> Resume Game
                </Button>
                <div className="h-px bg-white/10 my-2"></div>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                  onClick={() => {
                    setFinished(false);
                    setResult(null);
                    setCurrentScore(0);
                    setCurrentQuestionIndex(0);
                    setUserAnswers([]);
                    resetGrid();
                  }}
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> Restart Round
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-500 hover:text-black font-bold"
                  onClick={handleExitGame}
                >
                  <LogOut className="mr-2 w-4 h-4" /> Exit to Menu
                </Button>
              </div>
            )}

            {activeModal === "answer" && (
              <div className="relative z-10">
                <p className="text-center mb-6 text-lg font-bold opacity-80">
                  {isTimeUp
                    ? "You're out of time! Select an answer."
                    : "Select the correct answer from the board below!"}
                </p>
                <div className="grid grid-cols-1 gap-4">
                  {currentQ.answers.map((ans, idx) => (
                    <button
                      key={idx}
                      className={`group relative overflow-hidden text-left flex items-center p-4 transition-all duration-200 hover:-translate-y-1 ${activeStyle.optionButton}`}
                      onClick={() => handleAnswerSelect(ans.answer_id)}
                    >
                      <div
                        className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl mr-4 shadow-inner transition-colors ${activeStyle.optionLetter}`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span
                        className={`font-bold text-xl transition-colors ${activeStyle.titleText ? "" : "text-white group-hover:text-yellow-400"}`}
                      >
                        {ans.answer_text}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlayImageQuiz;
