import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Timer,
  Trophy,
  RefreshCcw,
  Home,
  Star,
  Diamond,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HAPPY_IMG_URL from "./assets/correct.png";
import SAD_IMG_URL from "./assets/wrong.png";

// 1. Moving Cloud Asset
const CloudSVG = ({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    animate={{ x: [0, 100, 0] }}
    transition={{
      repeat: Infinity,
      duration: 20,
      delay: delay,
      ease: "linear",
    }}
  >
    <path d="M17.5,19c-0.83,0-1.5-0.67-1.5-1.5c0-0.83,0.67-1.5,1.5-1.5c0.83,0,1.5,0.67,1.5,1.5C19,18.33,18.33,19,17.5,19z M19.5,12 c-1.66,0-3,1.34-3,3c0,1.66,1.34,3,3,3s3-1.34,3-3C22.5,13.34,21.16,12,19.5,12z M13.5,19c-1.38,0-2.5-1.12-2.5-2.5 c0-1.38,1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5C16,17.88,14.88,19,13.5,19z M6.5,19C4.57,19,3,17.43,3,15.5C3,13.57,4.57,12,6.5,12 c0.23,0,0.45,0.02,0.66,0.06C7.55,9.63,9.6,7.5,12,7.5c2.76,0,5,2.24,5,5c0,0.14-0.01,0.27-0.02,0.4c0.55-0.26,1.16-0.4,1.8-0.4 c2.08,0,3.97,1.09,5.03,2.72C24.58,16.03,24.93,17,24.93,17.97c0,2.76-2.24,5-5,5H6.5z" />
  </motion.svg>
);

// 2. Big Star Decoration
const BigStarDecor = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 5L63 35H95L69 55L79 85L50 70L21 85L31 55L5 35H37L50 5Z"
      fill="#FDE047"
      stroke="#F472B6"
      strokeWidth="2"
      strokeOpacity="0.5"
      fillOpacity="0.2"
    />
  </svg>
);

// 3. Big Diamond Decoration
const BigDiamondDecor = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 5L95 50L50 95L5 50L50 5Z"
      fill="#60A5FA"
      stroke="#1E40AF"
      strokeWidth="2"
      strokeOpacity="0.5"
      fillOpacity="0.2"
    />
  </svg>
);

// 4. Background System
const GameBackground = () => (
  <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-[#E6C4E9]">
    <div className="absolute inset-0 bg-gradient-to-b from-[#FAD0C4] via-[#FFD1FF] to-[#C3B1E1]" />
    <div className="absolute top-10 left-0 w-full opacity-30 text-white pointer-events-none">
      <CloudSVG className="w-32 h-32 absolute top-0 left-[10%]" delay={0} />
      <CloudSVG className="w-24 h-24 absolute top-20 left-[60%]" delay={5} />
      <CloudSVG className="w-40 h-40 absolute top-5 left-[80%]" delay={2} />
    </div>
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-200/60"
          initial={{
            opacity: 0,
            scale: 0,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -100] }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 5,
          }}
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      ))}
    </div>
    <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-purple-300/30 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-[10%] left-[20%] w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse" />
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: "radial-gradient(#FFF 2px, transparent 2px)",
        backgroundSize: "40px 40px",
      }}
    ></div>
  </div>
);

// 5. Font Style Helper
const BubbleText = ({
  text,
  color = "text-white",
  strokeColor = "#4c1d95",
  size = "text-3xl",
}: {
  text: string;
  color?: string;
  strokeColor?: string;
  size?: string;
}) => (
  <h2
    className={cn(`font-black ${size} ${color} tracking-wider drop-shadow-md`)}
    style={{ WebkitTextStroke: `1.5px ${strokeColor}` }}
  >
    {text}
  </h2>
);

/* =========================================
   CHARACTER REACTION COMPONENT
========================================= */
const CharacterReaction = ({
  feedback,
}: {
  feedback: "correct" | "wrong" | null;
}) => {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ y: 200, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 200, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="fixed -bottom-10 right-8 z-50 pointer-events-none"
        >
          {/* Container Gambar */}
          <div className="relative w-48 md:w-64 lg:w-80">
            <img
              // Gunakan placeholder jika file tidak ditemukan
              src={feedback === "correct" ? HAPPY_IMG_URL : SAD_IMG_URL}
              onError={(e) => {
                e.currentTarget.src =
                  feedback === "correct"
                    ? "https://placehold.co/400x600/png?text=Happy+Steven"
                    : "https://placehold.co/400x600/png?text=Sad+Steven";
              }}
              alt="Character Reaction"
              className="w-full h-full object-contain drop-shadow-2xl"
            />

            {/* Bubble Dialog */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "absolute top-0 right-0 p-4 rounded-3xl rounded-bl-none shadow-xl border-4 font-black text-xl md:text-2xl transform translate-x-4 -translate-y-4",
                feedback === "correct"
                  ? "bg-white text-pink-600 border-pink-500"
                  : "bg-slate-800 text-white border-slate-600",
              )}
            >
              {feedback === "correct" ? "YESS!!" : "NOOO..."}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =========================================
   TYPES
========================================= */
interface Question {
  questionIndex: number;
  questionText: string;
}

interface GameData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  countdown: number;
  choices: { A: string; B: string };
  questions: Question[];
}

/* =========================================
   MAIN COMPONENT
========================================= */
export default function PlayTrueOrFalseArcade() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- STATES ---
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "finished"
  >("loading");
  const [gameData, setGameData] = useState<GameData | null>(null);

  // Logic
  const [globalTimeLeft, setGlobalTimeLeft] = useState(0);
  const [questionProgress, setQuestionProgress] = useState(100);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Score
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Feedback
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // Constants
  const QUESTION_DURATION = 5000;
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const BASE_URL = import.meta.env.VITE_API_URL || "";

  // --- FETCH ---
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await api.get(
          `/api/game/game-type/true-or-false/${id}/play/public`,
        );
        if (res.data && res.data.data) {
          const rawData = res.data.data;
          // Shuffle Questions
          const shuffledQuestions = [...rawData.questions].sort(
            () => Math.random() - 0.5,
          );
          setGameData({ ...rawData, questions: shuffledQuestions });
          setGlobalTimeLeft(rawData.countdown);
          setGameState("playing");
        }
      } catch (error) {
        console.error("Error fetching game:", error);
      }
    };
    fetchGame();
  }, [id]);

  // --- TIMERS ---
  useEffect(() => {
    if (gameState !== "playing") return;
    globalTimerRef.current = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing" || feedback) return;
    const startTime = Date.now();
    setQuestionProgress(100);
    questionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / QUESTION_DURATION) * 100);
      setQuestionProgress(remaining);
      if (remaining <= 0) handleNextQuestion(false);
    }, 50);
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [currentQIndex, gameState, feedback]);

  // --- ACTIONS ---
  const endGame = () => {
    setGameState("finished");
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
  };

  const handleAnswer = async (choice: "A" | "B") => {
    if (gameState !== "playing" || feedback || !gameData) return;
    const currentQ =
      gameData.questions[currentQIndex % gameData.questions.length];

    try {
      const res = await api.post(
        `/api/game/game-type/true-or-false/${id}/check`,
        {
          answers: [
            {
              questionIndex: currentQ.questionIndex,
              selectedAnswer: choice,
            },
          ],
        },
      );

      const isCorrect = res.data.data.results[0].isCorrect;

      if (isCorrect) {
        const speedBonus = Math.floor(questionProgress / 2);
        const comboBonus = Math.min(combo, 10) * 10;
        setScore((s) => s + 100 + comboBonus + speedBonus);
        setCorrectCount((c) => c + 1);
        setCombo((c) => c + 1);
        setFeedback("correct");
      } else {
        setCombo(0);
        setFeedback("wrong");
      }
      setAnsweredCount((a) => a + 1);
      setTimeout(() => handleNextQuestion(true), 600);
    } catch (error) {
      console.error("Error checking answer:", error);
    }
  };

  const handleNextQuestion = (manualTrigger: boolean) => {
    setFeedback(null);
    if (!manualTrigger) setCombo(0);
    setCurrentQIndex((prev) => prev + 1);
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${BASE_URL}/${path}`;
  };

  // --- RENDER UI ---
  if (gameState === "loading" || !gameData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-100 relative overflow-hidden">
        <GameBackground />
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
        <h2 className="mt-4 font-bold text-xl text-pink-600 animate-pulse">
          Summoning Gems...
        </h2>
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <GameBackground />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <BigStarDecor className="absolute top-10 left-10 w-40 h-40 animate-spin-slow opacity-30" />
          <BigDiamondDecor className="absolute bottom-10 right-10 w-40 h-40 animate-pulse opacity-30" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 max-w-md w-full text-center border-4 border-pink-400 shadow-2xl relative z-10"
        >
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 p-4 rounded-full border-4 border-white shadow-lg">
            <Trophy className="w-12 h-12 text-yellow-900" />
          </div>
          <div className="mt-8 space-y-2">
            <BubbleText
              text="MISSION CLEAR!"
              color="text-pink-500"
              size="text-4xl"
            />
            <p className="text-slate-500 font-bold">Total Score</p>
            <div className="text-6xl font-black text-purple-600 drop-shadow-sm">
              {score}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
            <div className="bg-green-100 p-4 rounded-xl border-2 border-green-300">
              <p className="text-green-800 font-bold text-sm">CORRECT</p>
              <p className="text-3xl font-black text-green-600">
                {correctCount}
              </p>
            </div>
            <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300">
              <p className="text-blue-800 font-bold text-sm">ANSWERED</p>
              <p className="text-3xl font-black text-blue-600">
                {answeredCount}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-14 text-lg font-black bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-[0_4px_0_#be185d]"
            >
              <RefreshCcw className="mr-2 w-5 h-5" /> PLAY AGAIN
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              className="w-full text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
            >
              <Home className="mr-2 w-5 h-5" /> BACK TO HOME
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ =
    gameData.questions[currentQIndex % gameData.questions.length];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 relative overflow-hidden font-sans">
      <GameBackground />

      {/* --- CHARACTER REACTION (DI POJOK KIRI BAWAH) --- */}
      <CharacterReaction feedback={feedback} />

      {/* HEADER INFO */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10 pt-4">
        {/* Left: Game Info */}
        <div className="hidden md:flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border-2 border-white/60">
          <img
            src={getImageUrl(gameData.thumbnail_image)}
            alt="Icon"
            className="w-12 h-12 rounded-full object-cover border-2 border-pink-400"
          />
          <div className="text-left leading-tight">
            <h1 className="font-bold text-purple-900 line-clamp-1">
              {gameData.name}
            </h1>
            <p className="text-xs text-purple-700 font-semibold">
              {gameData.questions.length} Qs Loop
            </p>
          </div>
        </div>
        {/* Center: Timer */}
        <div className="flex flex-col items-center mx-auto md:mx-0">
          <div className="bg-purple-900/90 text-white px-6 py-2 rounded-full border-4 border-purple-400 shadow-lg flex items-center gap-3">
            <Timer className="w-6 h-6 text-yellow-300 animate-pulse" />
            <span className="text-2xl font-black font-mono tracking-widest">
              {Math.floor(globalTimeLeft / 60)
                .toString()
                .padStart(2, "0")}
              :{(globalTimeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        {/* Right: Score */}
        <div className="bg-white/80 backdrop-blur p-2 px-4 rounded-xl border-2 border-yellow-400 shadow-md">
          <p className="text-xs font-bold text-yellow-700 uppercase">Score</p>
          <p className="text-2xl font-black text-yellow-600">{score}</p>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="flex-1 w-full max-w-3xl flex flex-col justify-center items-center z-10 relative my-4">
        {/* Combo Badge */}
        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-10 right-4 md:-right-4 bg-orange-500 text-white px-4 py-1 rounded-full font-black italic border-2 border-white shadow-lg rotate-12 z-30"
            >
              {combo}x COMBO!
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQIndex}
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full relative"
          >
            <div className="bg-white/95 backdrop-blur rounded-[2rem] p-8 md:p-10 shadow-[0_12px_0px_rgba(0,0,0,0.1)] border-[4px] border-slate-100 relative overflow-hidden text-center min-h-[250px] flex flex-col justify-center items-center z-20">
              {/* Decoration inside card */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300" />

              {/* Question Text */}
              <h3 className="text-2xl md:text-4xl font-black text-slate-800 leading-snug mb-6 relative z-10 w-full break-words">
                {currentQ.questionText}
              </h3>

              {/* Progress Bar (Timer Soal) */}
              <div className="absolute bottom-0 left-0 w-full h-4 bg-slate-100">
                <motion.div
                  className={cn(
                    "h-full transition-colors",
                    questionProgress > 50
                      ? "bg-green-400"
                      : questionProgress > 20
                        ? "bg-yellow-400"
                        : "bg-red-500",
                  )}
                  style={{ width: `${questionProgress}%` }}
                />
              </div>

              {/* Feedback Overlay */}
              {feedback && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm animate-in fade-in zoom-in duration-200",
                    feedback === "correct"
                      ? "bg-green-500/20"
                      : "bg-red-500/20",
                  )}
                >
                  {feedback === "correct" ? (
                    <BubbleText
                      text="AWESOME!"
                      color="text-green-500"
                      strokeColor="#FFF"
                      size="text-6xl"
                    />
                  ) : (
                    <BubbleText
                      text="OOPS!"
                      color="text-red-500"
                      strokeColor="#FFF"
                      size="text-6xl"
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CONTROLS (TEXTBOX BUTTONS) WITH ORNAMENTS BEHIND */}
      <div className="w-full max-w-4xl relative z-10 px-2 mb-6">
        {/* Background Decorations for Buttons (The Big Shapes) */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -left-10 bottom-0 opacity-20"
          >
            <BigStarDecor className="w-64 h-64" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -right-10 bottom-0 opacity-20"
          >
            <BigDiamondDecor className="w-64 h-64" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BUTTON A (PINK THEME) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, translateY: 4 }}
            onClick={() => handleAnswer("A")}
            disabled={!!feedback}
            className="group relative w-full"
          >
            <div className="w-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-2xl border-b-[8px] border-rose-700 active:border-b-0 active:translate-y-2 transition-all p-4 flex items-center shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-20 transform translate-x-4 -translate-y-4">
                <Star className="w-24 h-24 text-white fill-white" />
              </div>

              {/* Ikon Hiasan Kiri */}
              <div className="bg-white/20 p-3 rounded-xl mr-4 z-10">
                <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
              </div>
              {/* Teks Jawaban */}
              <div className="flex-1 text-left z-10">
                <span className="block text-pink-100 text-xs font-bold tracking-widest uppercase mb-1">
                  Answer A
                </span>
                <span className="block text-white font-black text-xl md:text-2xl leading-tight break-words">
                  {gameData.choices.A}
                </span>
              </div>
            </div>
          </motion.button>

          {/* BUTTON B (BLUE THEME) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, translateY: 4 }}
            onClick={() => handleAnswer("B")}
            disabled={!!feedback}
            className="group relative w-full"
          >
            <div className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl border-b-[8px] border-indigo-700 active:border-b-0 active:translate-y-2 transition-all p-4 flex items-center shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-20 transform translate-x-4 -translate-y-4">
                <Diamond className="w-24 h-24 text-white fill-white" />
              </div>

              {/* Ikon Hiasan Kiri */}
              <div className="bg-white/20 p-3 rounded-xl mr-4 z-10">
                <Diamond className="w-8 h-8 text-cyan-200 fill-cyan-200" />
              </div>
              {/* Teks Jawaban */}
              <div className="flex-1 text-left z-10">
                <span className="block text-blue-100 text-xs font-bold tracking-widest uppercase mb-1">
                  Answer B
                </span>
                <span className="block text-white font-black text-xl md:text-2xl leading-tight break-words">
                  {gameData.choices.B}
                </span>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
