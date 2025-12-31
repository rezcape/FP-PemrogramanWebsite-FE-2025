import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Typography } from "@/components/ui/typography";
import { motion } from "framer-motion";
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
  theme?: "adventure" | "family100" | "ocean";
}

interface ThemeStyle {
  bgClass: string;
  tileClass: string;
  font: string;
  panelClass: string;
  modalClass: string;
  titleText: string;
  buttonPrimary: string;
  buttonSecondary: string;
  textHighlight: string;
  buzzerClass: string;
  optionButton: string;
  optionLetter: string;
  css: React.ReactNode;
  modalInstructionText?: string;
  answerOptionText?: string;
}

// Grid Configuration
const GRID_COLS = 16;
const GRID_ROWS = 8;
const TOTAL_BLOCKS = GRID_COLS * GRID_ROWS;

// --- THEME CONFIGURATION ---
const THEME_STYLES: Record<string, ThemeStyle> = {
  family100: {
    bgClass: "f100-bg",
    tileClass: "f100-tile",
    font: "font-f100",
    panelClass: "f100-panel",
    modalClass:
      "bg-gradient-to-b from-[#172554] to-[#020617] border-4 border-[#3b82f6] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl text-white",
    titleText: "f100-title-text",
    buttonPrimary: "f100-btn-primary",
    buttonSecondary: "f100-btn-secondary",
    textHighlight: "text-yellow-400",
    buzzerClass: "f100-buzzer",
    modalInstructionText: "text-white",
    answerOptionText: "text-white group-hover:text-yellow-400",
    optionButton:
      "bg-blue-900/80 border-2 border-blue-400 hover:border-yellow-400 hover:bg-blue-800 rounded-xl shadow-md transition-all",
    optionLetter:
      "bg-yellow-500 text-black border border-yellow-300 font-digital font-bold shadow-sm",

    css: (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700;800&family=Orbitron:wght@400;700;900&display=swap');
        .font-f100 { font-family: 'Chakra Petch', sans-serif; }
        .font-digital { font-family: 'Orbitron', monospace; }
        .f100-bg { background: radial-gradient(circle at center, #172554 0%, #020617 100%); color: white; }
        .f100-panel { background: linear-gradient(180deg, #1e3a8a 0%, #172554 100%); border: 4px solid #3b82f6; box-shadow: 0 0 0 2px #1e3a8a, 0 0 20px rgba(59, 130, 246, 0.6); border-radius: 1rem; }
        
        /* [UPDATE] Judul Teks Putih Solid + Glow (Hapus gradient transparan) */
        .f100-title-text { 
            font-family: 'Chakra Petch', sans-serif; 
            font-weight: 800; 
            text-transform: uppercase; 
            color: #ffffff; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(59, 130, 246, 0.9); 
            letter-spacing: 1px;
        }

        /* [BARU] EFEK 3D/TIMBUL UNTUK KOTAK GRID */
        .f100-tile {
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%); /* Gradasi Biru */
          border-radius: 4px;
          /* Kombinasi Shadow untuk efek tebal */
          box-shadow: 
            inset 1px 1px 0px rgba(255, 255, 255, 0.4), /* Kilau atas kiri */
            inset -1px -1px 0px rgba(0, 0, 0, 0.2),    /* Bayangan dalam kanan bawah */
            0 3px 0px #172554,                          /* Shadow Solid (Ketebalan 3D) */
            0 4px 4px rgba(0, 0, 0, 0.3);               /* Bayangan lembut ke lantai */
          border: 1px solid #3b82f6;
        }

        .f100-btn-primary { background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%); border: 3px solid #fef3c7; color: #451a03; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 6px 0 #92400e; transition: all 0.1s; } 
        .f100-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #92400e; }
        .f100-btn-secondary { background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%); border: 3px solid #bfdbfe; color: white; font-weight: 700; }
        .f100-buzzer { background: radial-gradient(circle at 30% 30%, #ef4444 0%, #991b1b 100%); border: 4px solid #fca5a5; box-shadow: 0 10px 0 #7f1d1d, 0 0 50px rgba(220, 38, 38, 0.6); }
        .f100-buzzer:active { transform: scale(0.95); box-shadow: 0 2px 0 #7f1d1d; }
      `}</style>
    ),
  },
  adventure: {
    bgClass: "medieval-bg",
    tileClass:
      "bg-[#44403c] border border-[#292524] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5)]",
    font: "font-medieval-body",
    panelClass: "medieval-panel",
    modalClass:
      "bg-[#e7d5b9] border-[6px] border-[#451a03] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]",
    titleText:
      "font-medieval-title text-[#451a03] tracking-widest drop-shadow-md uppercase",
    buttonPrimary: "medieval-btn-royal",
    buttonSecondary: "medieval-btn-iron",
    textHighlight: "text-[#b91c1c]",
    buzzerClass: "medieval-buzzer",
    optionButton:
      "bg-[#f5ebe0] border-[3px] border-[#78350f] hover:bg-[#d6c0a0] rounded-sm shadow-md hover:scale-[1.01] transition-all relative overflow-hidden",
    optionLetter:
      "bg-[#78350f] text-[#f5ebe0] font-medieval-title border border-[#451a03]",
    css: (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=MedievalSharp&display=swap');
        
        .font-medieval-title { font-family: 'Cinzel', serif; font-weight: 900; }
        .font-medieval-body { font-family: 'MedievalSharp', cursive; }
        .font-digital { font-family: 'Cinzel', serif; letter-spacing: 2px; } /* Override font digital jadi classic */

        /* Background: Tekstur Kayu Gelap / Batu */
        .medieval-bg { 
          background-color: #1a0f0a; /* Warna cadangan jika gambar gagal load */
          
          /* Ganti URL ini sesuai nama file di folder public Anda */
          /* Contoh: jika file ada di public/images/medieval-bg.jpg */
          background-image: url('/images/medieval-bg.jpg'); 
          
          background-size: cover;      /* Agar gambar memenuhi layar */
          background-position: center; /* Posisi gambar di tengah */
          background-repeat: no-repeat;
          background-attachment: fixed; /* Agar background diam saat scroll */
          
          color: #f5ebe0;
        }

        .medieval-bg .bg-[#44403c] {
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(135deg, #57534e 0%, #44403c 100%);
          background-size: 4px 4px, cover;
          position: relative;
        }

        /* Memberikan efek retakan halus pada batu */
        .medieval-bg .bg-[#44403c]::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.2;
          background-image: url("https://www.transparenttextures.com/patterns/asfalt-dark.png");
        }

        /* Panel: Kertas Perkamen (Parchment) */
        .medieval-panel { 
          background-color: #e7d5b9; /* Parchment Color */
          border: 4px double #78350f; /* Double border kayu */
          border-radius: 0.5rem; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 40px rgba(120, 53, 15, 0.2);
          color: #292524;
        }

        /* --- ORNAMEN SUDUT (Baru) --- */
        .medieval-corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: #d4af37;
          border-style: solid;
          z-index: 50;
          pointer-events: none;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }
        /* Hiasan bulat kecil di ujung sudut */
        .medieval-corner::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: #d4af37;
          border-radius: 50%;
          box-shadow: 0 0 5px #fcd34d;
        }

        /* Aturan spesifik per sudut */
        .corner-tl { top: -6px; left: -6px; border-width: 4px 0 0 4px; border-radius: 8px 0 0 0; }
        .corner-tl::after { top: -4px; left: -4px; }

        .corner-tr { top: -6px; right: -6px; border-width: 4px 4px 0 0; border-radius: 0 8px 0 0; }
        .corner-tr::after { top: -4px; right: -4px; }

        .corner-bl { bottom: -6px; left: -6px; border-width: 0 0 4px 4px; border-radius: 0 0 0 8px; }
        .corner-bl::after { bottom: -4px; left: -4px; }

        .corner-br { bottom: -6px; right: -6px; border-width: 0 4px 4px 0; border-radius: 0 0 8px 0; }
        .corner-br::after { bottom: -4px; right: -4px; }
        /* -------------------------- */

        /* Tombol Kerajaan */
        .medieval-btn-royal { 
          background: linear-gradient(180deg, #525252 0%, #171717 100%);
          color: #fef3c7; 
          border: 2px solid #fcd34d; /* Border Emas */
          border-radius: 0.25rem;
          font-family: 'Cinzel', serif;
          text-transform: uppercase;
          box-shadow: 0 4px 0 #450a0a;
          transition: all 0.1s;
        }
        .medieval-btn-royal:hover { filter: brightness(1.2); }
        .medieval-btn-royal:active { transform: translateY(2px); box-shadow: none; }

        /* Tombol Besi/Netral */
        .medieval-btn-iron { 
          background: linear-gradient(180deg, #57534e 0%, #292524 100%); 
          color: #d6d3d1; 
          border: 2px solid #78716c; 
          border-radius: 0.25rem;
          font-family: 'Cinzel', serif;
          box-shadow: 0 4px 0 #1c1917;
        }
        .medieval-btn-iron:hover { background: #78716c; color: white; }
        .medieval-btn-iron:active { transform: translateY(2px); box-shadow: none; }

        /* Buzzer: Wax Seal Merah */
        .medieval-buzzer { 
          background: radial-gradient(circle at 40% 40%, #525252 0%, #171717 100%); 
          border: 4px solid #262626; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.8); 
          border-radius: 50%; 
        }
        .medieval-buzzer:active { transform: scale(0.95); }
      `}</style>
    ),
  },
  cyberpunk: {
    bgClass: "cyber-bg",
    tileClass: "cyber-tile",
    font: "font-cyber",
    panelClass: "cyber-panel",
    modalClass:
      "bg-black/90 border-2 border-[#00f2ff] shadow-[0_0_30px_rgba(0,242,255,0.3)] rounded-lg",
    titleText:
      "text-[#00f2ff] font-black tracking-widest uppercase drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]",
    buttonPrimary: "cyber-btn-primary",
    buttonSecondary: "cyber-btn-secondary",
    textHighlight: "text-[#ff00ff]",
    buzzerClass: "cyber-buzzer",
    modalInstructionText: "text-white",
    answerOptionText: "text-white group-hover:text-[#ff00ff] font-digital",
    optionButton:
      "bg-black/80 border border-[#00f2ff]/30 hover:border-[#00f2ff] hover:bg-[#00f2ff]/10 rounded-none transition-all duration-300 group relative overflow-hidden",
    optionLetter:
      "bg-[#00f2ff] text-black font-bold rounded-none group-hover:bg-[#ff00ff] group-hover:text-white transition-colors",
    css: (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .font-cyber { font-family: 'Orbitron', sans-serif; }
        .font-digital { font-family: 'JetBrains+Mono', monospace; }
        
        .cyber-bg {
          background-color: #050505;
          background-image: 
            linear-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 242, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          color: #00f2ff;
        }

        .cyber-panel {
          background: rgba(0, 0, 0, 0.85);
          border: 2px solid #00f2ff;
          box-shadow: 0 0 15px rgba(0, 242, 255, 0.2), inset 0 0 10px rgba(0, 242, 255, 0.1);
        }

        .cyber-tile {
          background: #000;
          border: 1px solid #00f2ff;
          box-shadow: inset 0 0 5px rgba(0, 242, 255, 0.5);
          position: relative;
          overflow: hidden;
        }
        .cyber-tile::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 242, 255, 0.05) 1px, rgba(0, 242, 255, 0.05) 2px);
        }

        .cyber-btn-primary {
          background: transparent;
          color: #00f2ff;
          border: 2px solid #00f2ff;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          position: relative;
          transition: all 0.2s;
          clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
        }
        .cyber-btn-primary:hover {
          background: #00f2ff;
          color: black;
          box-shadow: 0 0 20px rgba(0, 242, 255, 0.6);
          transform: translate(-2px, -2px);
        }

        .cyber-btn-secondary {
          background: transparent;
          color: #ff00ff;
          border: 1px solid #ff00ff;
          clip-path: polygon(0 0, 90% 0, 100% 30%, 100% 100%, 10% 100%, 0 70%);
        }
        .cyber-btn-secondary:hover {
          background: rgba(255, 0, 255, 0.1);
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
        }

        .cyber-buzzer {
          background: #000;
          border: 4px solid #ff00ff;
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.5), inset 0 0 15px rgba(255, 0, 255, 0.3);
          color: #ff00ff;
        }
        .cyber-buzzer:active {
          transform: scale(0.95);
          box-shadow: 0 0 40px rgba(255, 0, 255, 0.8);
          background: #ff00ff;
          color: white;
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .cyber-bg::before {
          content: "";
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(0, 242, 255, 0.03), transparent);
          animation: scanline 8s linear infinite;
          pointer-events: none;
          z-index: 100;
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
  }, [fetchedQuizData, fetchingQuiz, fetchError, stopSound]); // Added stopSound

  // Wrapped in useCallback
  const startActualGame = useCallback(() => {
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
  }, [quiz, timeLimit, playSound]);

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
  }, [startCountdown, playSound, startActualGame]); // Added dependencies

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
  }, [isPlaying, isPaused, timeLeft, playSound, stopSound]); // Added dependencies

  // Wrapped in useCallback
  const handleTimeUp = useCallback(() => {
    console.log("Time Up!");
    setIsTimeUp(true);
    cleanupTimers();
    setIsPlaying(false);
    setIsPaused(true);
    setActiveModal("answer");
    playSound("timeUp");
    stopSound("bgm");
  }, [playSound, stopSound]);

  useEffect(() => {
    if (timeLeft <= 0 && isPlaying && !isPaused) {
      handleTimeUp();
    }
  }, [timeLeft, isPlaying, isPaused, handleTimeUp]); // Added dependencies

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
        className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-300"
        style={{
          opacity: opacity,
          transform: opacity === 1 ? "translateY(-40px)" : "translateY(0)",
        }}
      >
        <span className="text-yellow-400 font-black text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] font-digital">
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
        <Typography variant="h4" className="text-red-500 font-cyber">
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
          // [REVISI 1] HAPUS 'overflow-hidden' dari sini agar sudut emas bisa muncul keluar
          className={`relative w-full max-w-4xl aspect-[2/1] bg-black rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.4)] ${activeStyle.panelClass}`}
        >
          {/* [REVISI 2] Pastikan ornamen ada di LUAR wrapper gambar tapi di DALAM panel utama */}
          {activeThemeId === "adventure" && (
            <>
              <div className="medieval-corner corner-tl"></div>
              <div className="medieval-corner corner-tr"></div>
              <div className="medieval-corner corner-bl"></div>
              <div className="medieval-corner corner-br"></div>
            </>
          )}

          {/* [REVISI 3] Buat Wrapper Baru untuk Gambar & Grid agar tetap rounded dan rapi */}
          <div className="relative w-full h-full overflow-hidden rounded-lg">
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

            {/* Grid Overlay */}
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
                  <div key={i} className="relative w-full h-full">
                    {/* Kotak Batu/Biru hanya muncul jika ada di hiddenBlocks */}
                    {hiddenBlocks.includes(i) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0,
                          transition: { duration: 0.3 },
                        }}
                        className={`w-full h-full ${activeStyle.tileClass}`}
                      />
                    )}

                    {/* Particle dipisah, tidak boleh di dalam logic hiddenBlocks */}
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
              <span className="font-cyber font-black text-white text-xl md:text-2xl tracking-widest drop-shadow-md z-10 pointer-events-none">
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
                  : currentQ.question_text || "Who is it?"}
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
                <p
                  className={`text-center mb-6 text-lg font-bold opacity-80 ${activeStyle.modalInstructionText || ""}`}
                >
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
                        className={`font-bold text-xl transition-colors ${activeStyle.answerOptionText || (activeStyle.titleText ? "" : "text-white group-hover:text-yellow-400")}`}
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
