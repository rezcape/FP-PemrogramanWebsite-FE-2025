import { useEffect, useMemo, useState } from "react";
import backsoundOne from "../../../assets/game/speed-sorting/backsounds/a-lost-soul.mp3";
import backsoundTwo from "../../../assets/game/speed-sorting/backsounds/no-worries.mp3";
import backsoundThree from "../../../assets/game/speed-sorting/backsounds/searching-for-a-body.mp3";
import backsoundFour from "../../../assets/game/speed-sorting/backsounds/something-wrong.mp3";
import correctEffect from "../../../assets/game/speed-sorting/effects/correct-effect.mp3";
import countdownEffect from "../../../assets/game/speed-sorting/effects/countdown-effect.mp3";
import failedEffect from "../../../assets/game/speed-sorting/effects/failed-effect.mp3";
import gameStartEffect from "../../../assets/game/speed-sorting/effects/gamestart-effect.mp3";
import victoryEffect from "../../../assets/game/speed-sorting/effects/victory-effect.mp3";
export interface WordItem {
  id: string;
  text: string;
  correctCategory: string;
  completed?: boolean;
  type: "text" | "image";
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type GameState = "waiting" | "countdown" | "playing";

export interface DropFeedback {
  categoryId: string;
  isCorrect: boolean;
}

// Utility functions
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getScrollAnimation = () => `
  @keyframes scroll-right {
    0% { 
      transform: translateX(-50%); 
    }
    100% { 
      transform: translateX(0); 
    }
  }
  [data-dragging="true"] {
    border-color: #d1d5db !important;
    box-shadow: none !important;
  }
  [data-dragging="true"]:hover {
    border-color: #d1d5db !important;
    box-shadow: none !important;
    transform: none !important;
  }
`;

interface SpeedSortingDetail {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  categories: { id: string; name: string }[];
  items: {
    id: string;
    value: string;
    category_index?: number;
    category_id?: string;
    type: "text" | "image";
  }[];
}

const transformDataToGameFormat = (
  detail: SpeedSortingDetail | null,
): { words: WordItem[]; categories: Category[] } => {
  if (!detail) return { words: [], categories: [] };

  const categories: Category[] = detail.categories.map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    color:
      index === 0
        ? "bg-blue-600"
        : index === 1
          ? "bg-green-600"
          : index === 2
            ? "bg-purple-600"
            : "bg-red-600",
  }));

  const words: WordItem[] = detail.items.map((item) => {
    let correctCategoryId = "";

    if (typeof item.category_index === "number" && item.category_index >= 0) {
      correctCategoryId = detail.categories[item.category_index]?.id || "";
    } else if (item.category_id) {
      correctCategoryId = item.category_id;
    } else {
      correctCategoryId = detail.categories[0]?.id || "";
    }

    return {
      id: item.id,
      text: item.type === "text" ? item.value : `Image: ${item.id}`,
      correctCategory: correctCategoryId,
      completed: false,
      type: item.type,
      imageUrl:
        item.type === "image"
          ? `${import.meta.env.VITE_API_URL}/${item.value}`
          : undefined,
    };
  });

  for (let i = words.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  return { words, categories };
};

export function useSpeedSortingGame(
  detail: SpeedSortingDetail | null = null,
  isMuted: boolean = false,
) {
  const [words, setWords] = useState<WordItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [score, setScore] = useState(0);
  const correctAudio = useMemo(() => {
    const audio = new Audio(correctEffect);
    audio.volume = 0.2;
    return audio;
  }, []);
  const failedAudio = useMemo(() => {
    const audio = new Audio(failedEffect);
    audio.volume = 0.2;
    return audio;
  }, []);
  const startAudio = useMemo(() => {
    const audio = new Audio(gameStartEffect);
    audio.volume = 0.1;
    return audio;
  }, []);
  const countdownAudio = useMemo(() => {
    const audio = new Audio(countdownEffect);
    audio.volume = 0.35;
    return audio;
  }, []);
  const victoryAudio = useMemo(() => {
    const audio = new Audio(victoryEffect);
    audio.volume = 0.4;
    return audio;
  }, []);
  const backsounds = useMemo(() => {
    return [backsoundOne, backsoundTwo, backsoundThree, backsoundFour].map(
      (src) => {
        const audio = new Audio(src);
        audio.volume = 1;
        audio.loop = true;
        return audio;
      },
    );
  }, []);

  // sync mute flag to every audio instance
  useEffect(() => {
    const applyMute = (audio: HTMLAudioElement) => {
      audio.muted = isMuted;
    };
    [
      correctAudio,
      failedAudio,
      startAudio,
      countdownAudio,
      victoryAudio,
    ].forEach(applyMute);
    backsounds.forEach(applyMute);
  }, [
    backsounds,
    correctAudio,
    countdownAudio,
    failedAudio,
    isMuted,
    startAudio,
    victoryAudio,
  ]);

  useEffect(() => {
    if (detail) {
      const newGameData = transformDataToGameFormat(detail);
      setWords(newGameData.words);
      setCategories(newGameData.categories);
    }
  }, [detail]);
  const [timer, setTimer] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [dropFeedback, setDropFeedback] = useState<DropFeedback | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [countdown, setCountdown] = useState(3);

  const totalWords = words.length;
  const completedWords = words.filter((w) => w.completed).length;
  const speed = 1.5;

  useEffect(() => {
    if (gameState !== "playing" || gameEnded) return;
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState, gameEnded]);

  useEffect(() => {
    if (completedWords === totalWords && completedWords > 0 && !gameEnded) {
      setGameEnded(true);
      setFinalTime(timer);
    }
  }, [completedWords, totalWords, timer, gameEnded]);

  useEffect(() => {
    if (gameEnded) {
      victoryAudio.currentTime = 0;
      void victoryAudio.play().catch(() => {});
    }
  }, [gameEnded, victoryAudio]);

  useEffect(() => {
    if (gameEnded) {
      backsounds.forEach((audio) => audio.pause());
    }
  }, [gameEnded, backsounds]);

  const startGame = () => {
    setGameState("countdown");
    setCountdown(3);
    countdownAudio.currentTime = 0;
    void countdownAudio.play().catch(() => {});
    const interval = setInterval(() => {
      setCountdown((prev) => {
        const nextVal = prev - 1;
        if (nextVal > 0) {
          countdownAudio.currentTime = 0;
          void countdownAudio.play().catch(() => {});
        }
        if (prev <= 1) {
          clearInterval(interval);
          startAudio.currentTime = 0;
          void startAudio.play().catch(() => {});
          const nextIndex = Math.floor(Math.random() * backsounds.length);
          backsounds.forEach((audio, idx) => {
            if (idx === nextIndex) return;
            audio.pause();
          });
          const chosen = backsounds[nextIndex];
          chosen.currentTime = 0;
          void chosen.play().catch(() => {});
          setGameState("playing");
          return 0;
        }
        return nextVal;
      });
    }, 1000);
  };

  const resetGame = () => {
    const freshGameData = transformDataToGameFormat(detail);
    setWords(freshGameData.words.map((w) => ({ ...w, completed: false })));
    setCategories(freshGameData.categories);
    setScore(0);
    setTimer(0);
    setIncorrectAttempts(0);
    setGameEnded(false);
    setFinalTime(0);
    setGameState("waiting");
    setCountdown(3);
    setDraggedItem(null);
    setHoveredCategory(null);
    setDropFeedback(null);
    backsounds.forEach((audio) => audio.pause());
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    wordId: string,
  ) => {
    if (gameState !== "playing") {
      e.preventDefault();
      return;
    }
    setDraggedItem(wordId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setHoveredCategory(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    categoryId: string,
  ) => {
    e.preventDefault();
    if (draggedItem) {
      setHoveredCategory(categoryId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setHoveredCategory(null);
    }
  };

  const playAudio = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    categoryId: string,
  ) => {
    e.preventDefault();

    if (!draggedItem) return;

    const draggedWord = words.find((w) => w.id === draggedItem);
    if (!draggedWord) return;

    const isCorrect = draggedWord.correctCategory === categoryId;

    setDropFeedback({ categoryId, isCorrect });

    if (isCorrect) {
      playAudio(correctAudio);
    } else {
      playAudio(failedAudio);
    }

    if (isCorrect) {
      setTimeout(() => {
        setWords((prev) =>
          prev.map((w) =>
            w.id === draggedItem ? { ...w, completed: true } : w,
          ),
        );
        setScore((prev) => prev + 1);
      }, 300);
    } else {
      setIncorrectAttempts((prev) => prev + 1);
    }

    setDraggedItem(null);
    setHoveredCategory(null);

    setTimeout(() => {
      setDropFeedback(null);
    }, 600);
  };

  useEffect(() => {
    return () => {
      backsounds.forEach((audio) => audio.pause());
    };
  }, [backsounds]);

  return {
    // State
    words,
    categories,
    score,
    timer,
    incorrectAttempts,
    draggedItem,
    hoveredCategory,
    dropFeedback,
    showExit,
    gameEnded,
    finalTime,
    gameState,
    countdown,
    totalWords,
    completedWords,
    speed,
    // Actions
    setShowExit,
    startGame,
    resetGame,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
