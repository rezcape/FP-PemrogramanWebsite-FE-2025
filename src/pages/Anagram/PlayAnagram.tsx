import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  Check,
  Maximize,
  Minimize,
  Menu,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Home,
  X,
  Lightbulb,
  Pause,
  Play,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/useAuthStore";

const TOTAL_QUESTIONS_PLACEHOLDER = 15;

interface BackendQuestion {
  question_id: string;
  image_url: string;
  shuffled_letters: string[];
  hint_limit: number;
  correct_word: string;
}

interface BackendGamePlayData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  is_published: boolean;
  questions: BackendQuestion[];
}

interface Question {
  question_id: string;
  correct_word: string;
  scrambled_letters: string[];
  image_url: string;
  hint_limit: number;
}

interface GamePlayData {
  game_id: string;
  name: string;
  questions: Question[];
}

const PlayAnagram = () => {
  const { id: game_id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // STATE DATA & UI
  const [gameData, setGameData] = useState<GamePlayData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameFinished, setGameFinished] = useState(false);

  // State Game Logic
  const [answerSlots, setAnswerSlots] = useState<(string | null)[]>([]);
  const [availableLetters, setAvailableLetters] = useState<
    { letter: string; used: boolean }[]
  >([]);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [earnedScore, setEarnedScore] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorSlotIndex, setErrorSlotIndex] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [globalHintsUsed, setGlobalHintsUsed] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Track which questions have been answered (by question_id)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(
    new Set(),
  );

  // Prevent double fetch in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Track previous question index to prevent unnecessary re-initialization
  const prevQuestionIndexRef = useRef<number>(-1);

  // AUTH CHECK
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // LOGIC STOPWATCH
  useEffect(() => {
    if (!isLoading && !gameFinished && !isPaused) {
      const timer = setInterval(() => {
        setTimeElapsed((prevTime: number) => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoading, gameFinished, isPaused]);

  // SOUND EFFECTS
  const playSound = (type: "pop" | "error" | "success") => {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch((err) => console.error("Error playing sound:", err));
  };

  const formatTime = (t: number) => {
    const minutes = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (t % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const fetchGameData = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/game/game-type/anagram/${id}/play/public`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load Anagram game data.",
          );
        }

        const backendData: BackendGamePlayData = result.data;

        const transformedData: GamePlayData = {
          game_id: backendData.id,
          name: backendData.name,
          questions: backendData.questions.map((q) => ({
            question_id: q.question_id,
            correct_word: q.correct_word,
            scrambled_letters: q.shuffled_letters,
            image_url: q.image_url,
            hint_limit: q.hint_limit,
          })),
        };

        setGameData(transformedData);
      } catch (err: unknown) {
        console.error("Fetch Game Error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error during data fetch.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (game_id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchGameData(game_id);
    } else if (!game_id) {
      setError("Game ID not found in URL.");
      setIsLoading(false);
    }
  }, [game_id, fetchGameData]);

  // Initialize letters when question changes
  useEffect(() => {
    if (gameData && gameData.questions[currentQuestionIndex]) {
      // Only initialize if question index actually changed
      if (prevQuestionIndexRef.current === currentQuestionIndex) {
        return;
      }

      prevQuestionIndexRef.current = currentQuestionIndex;
      const currentQuestion = gameData.questions[currentQuestionIndex];

      // Check if this question was already answered
      const isAlreadyAnswered = answeredQuestions.has(
        currentQuestion.question_id,
      );

      if (isAlreadyAnswered) {
        // If already answered, show the correct answer filled in and disable interaction
        const correctWordNoSpaces = currentQuestion.correct_word.replace(
          /\s/g,
          "",
        );
        setAnswerSlots(correctWordNoSpaces.split(""));
        setAvailableLetters([]);
      } else {
        // Filter out spaces from scrambled letters
        const lettersNoSpaces = currentQuestion.scrambled_letters.filter(
          (letter: string) => letter !== " ",
        );
        const letters = lettersNoSpaces.map((letter: string) => ({
          letter,
          used: false,
        }));
        setAvailableLetters(letters);
        setAnswerSlots(
          new Array(lettersNoSpaces.length).fill(null) as (string | null)[],
        );
      }

      setIsChecking(false);
      setShowCorrect(false);
      setShowWrong(false);
      setEarnedScore(0);
      setHintsUsed(0);
    }
  }, [currentQuestionIndex, gameData, answeredQuestions]);

  // Validate if letter is correct for given position
  const isLetterCorrect = useCallback(
    (letter: string, position: number): boolean => {
      if (!gameData?.questions[currentQuestionIndex]?.correct_word) return true;
      const correctWordNoSpaces = gameData.questions[
        currentQuestionIndex
      ].correct_word.replace(/\s/g, "");
      return (
        letter.toUpperCase() === correctWordNoSpaces[position].toUpperCase()
      );
    },
    [gameData, currentQuestionIndex],
  );

  // Track if user made any mistakes during this question
  const [hadWrongInput, setHadWrongInput] = useState(false);

  const findNextUnansweredQuestionIndex = useCallback(
    (startIndex: number) => {
      if (!gameData) return -1;

      const total = gameData.questions.length;

      // Cari pertanyaan yang belum dijawab, mulai dari index saat ini + 1
      for (let i = startIndex + 1; i < total; i++) {
        const questionId = gameData.questions[i].question_id;
        if (!answeredQuestions.has(questionId)) {
          return i; // Ditemukan pertanyaan selanjutnya yang belum dijawab
        }
      }

      // Jika tidak ada di depan, cari dari awal (misal Page 1 belum dijawab)
      for (let i = 0; i < startIndex; i++) {
        const questionId = gameData.questions[i].question_id;
        if (!answeredQuestions.has(questionId)) {
          return i; // Ditemukan pertanyaan sebelumnya yang belum dijawab
        }
      }

      return -1; // Semua sudah dijawab
    },
    [gameData, answeredQuestions],
  );

  // AUTO-CHECK AND HANDLE ANSWER
  useEffect(() => {
    const checkAnswer = () => {
      // FIRST: Check if already answered (prevent re-checking)
      if (!gameData || !gameData.questions[currentQuestionIndex]) {
        return;
      }
      const currentQuestion = gameData.questions[currentQuestionIndex];

      if (answeredQuestions.has(currentQuestion.question_id)) {
        return;
      }

      // Then check other conditions
      if (isChecking || showWrong || showCorrect) {
        return;
      }

      const allFilled =
        answerSlots.length > 0 && answerSlots.every((slot) => slot !== null);
      if (!allFilled) return;

      // Filter spaces from correct word for accurate letter count
      const correctWordNoSpaces = currentQuestion.correct_word.replace(
        /\s/g,
        "",
      );

      if (
        answerSlots.join("").toUpperCase() !== correctWordNoSpaces.toUpperCase()
      ) {
        return;
      }

      setIsChecking(true);
      playSound("success");

      const letterCount = correctWordNoSpaces.length;

      // Calculate score based on hints and mistakes
      // 1. Perfect (no hints, no mistakes): letterCount × 2
      // 2. Used hints: letterCount - hintsUsed
      // 3. Made mistakes but no hints: letterCount × 1
      let points = 0;
      if (hintsUsed > 0) {
        points = letterCount - hintsUsed;
      } else if (hadWrongInput) {
        points = letterCount * 1;
      } else {
        points = letterCount * 2;
      }

      setEarnedScore(points);
      setScore((prev: number) => prev + points);
      setCorrectAnswers((prev: number) => prev + 1);
      setShowCorrect(true);

      setAnsweredQuestions((prev) =>
        new Set(prev).add(currentQuestion.question_id),
      );

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#eab308", "#3b82f6", "#ef4444"],
      });

      // Auto next question
      setTimeout(() => {
        setShowCorrect(false);
        setHadWrongInput(false);
        const nextIndex = findNextUnansweredQuestionIndex(currentQuestionIndex);
        if (nextIndex !== -1) {
          // Pindah ke pertanyaan berikutnya yang belum dijawab
          setCurrentQuestionIndex(nextIndex);
        } else {
          // Jika nextIndex adalah -1, berarti SEMUA sudah dijawab. Game selesai.
          setGameFinished(true);
        }
      }, 800);
    };

    checkAnswer();
  }, [
    answerSlots,
    currentQuestionIndex,
    gameData,
    isChecking,
    showWrong,
    showCorrect,
    hadWrongInput,
    hintsUsed,
    answeredQuestions,
    findNextUnansweredQuestionIndex,
  ]);

  const handleLetterClick = useCallback(
    (index: number) => {
      if (
        availableLetters[index].used ||
        isChecking ||
        showWrong ||
        showCorrect
      )
        return;

      const firstEmptySlot = answerSlots.findIndex(
        (slot: string | null) => slot === null,
      );
      if (firstEmptySlot === -1) return;

      const clickedLetter = availableLetters[index].letter;

      if (!isLetterCorrect(clickedLetter, firstEmptySlot)) {
        setErrorSlotIndex(firstEmptySlot);
        setShowError(true);
        playSound("error");
        setHadWrongInput(true);
        setTimeout(() => {
          setShowError(false);
          setErrorSlotIndex(null);
        }, 500);
        return;
      }

      const newAnswerSlots = [...answerSlots];
      newAnswerSlots[firstEmptySlot] = availableLetters[index].letter;
      setAnswerSlots(newAnswerSlots);

      const newAvailableLetters = [...availableLetters];
      newAvailableLetters[index].used = true;
      setAvailableLetters(newAvailableLetters);
      playSound("pop");
    },
    [
      availableLetters,
      answerSlots,
      isChecking,
      showWrong,
      showCorrect,
      isLetterCorrect,
    ],
  );

  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      if (
        answerSlots[slotIndex] === null ||
        isChecking ||
        showWrong ||
        showCorrect
      )
        return;

      const letterToRemove = answerSlots[slotIndex];
      const letterIndex = availableLetters.findIndex(
        (item: { letter: string; used: boolean }, idx: number) =>
          item.letter === letterToRemove &&
          item.used &&
          availableLetters
            .slice(0, idx + 1)
            .filter(
              (l: { letter: string; used: boolean }) =>
                l.letter === letterToRemove && l.used,
            ).length ===
            answerSlots
              .slice(0, slotIndex + 1)
              .filter((s: string | null) => s === letterToRemove).length,
      );

      if (letterIndex !== -1) {
        const newAvailableLetters = [...availableLetters];
        newAvailableLetters[letterIndex].used = false;
        setAvailableLetters(newAvailableLetters);
      }

      const newAnswerSlots = [...answerSlots];
      newAnswerSlots[slotIndex] = null;
      for (let i = slotIndex; i < newAnswerSlots.length - 1; i++) {
        newAnswerSlots[i] = newAnswerSlots[i + 1];
      }
      newAnswerSlots[newAnswerSlots.length - 1] = null;
      setAnswerSlots(newAnswerSlots);
    },
    [answerSlots, availableLetters, isChecking, showWrong, showCorrect],
  );

  const handleHint = useCallback(() => {
    if (!gameData || isChecking || showWrong || showCorrect) return;

    // 1. Hitung Limit Hint
    const currentQuestion = gameData.questions[currentQuestionIndex];
    const correctWordNoSpaces = currentQuestion.correct_word.replace(/\s/g, "");
    const wordLength = correctWordNoSpaces.length;

    // Logic: Setiap 5 huruf = 1 hint (dibulatkan ke atas)
    // Length 1-5 -> 1 hint
    // Length 6-10 -> 2 hints
    // Length 11-15 -> 3 hints
    const maxHints = Math.ceil(wordLength / 5);

    if (hintsUsed >= maxHints) return; // Limit reached

    // 2. Cari semua slot kosong dan pilih satu secara random
    const emptySlotIndices = answerSlots
      .map((slot, idx) => (slot === null ? idx : -1))
      .filter((idx) => idx !== -1);

    if (emptySlotIndices.length === 0) return; // Semua slot sudah terisi

    // Pilih random slot dari yang kosong
    const randomEmptySlot =
      emptySlotIndices[Math.floor(Math.random() * emptySlotIndices.length)];

    // 3. Tentukan huruf yang benar untuk slot tersebut
    const correctLetter = correctWordNoSpaces[randomEmptySlot];

    // 4. Cari huruf tersebut di availableLetters yang belum terpakai
    const availableIndex = availableLetters.findIndex(
      (l) => l.letter.toUpperCase() === correctLetter.toUpperCase() && !l.used,
    );

    if (availableIndex !== -1) {
      // Update State
      const newAnswerSlots = [...answerSlots];
      newAnswerSlots[randomEmptySlot] = availableLetters[availableIndex].letter;
      setAnswerSlots(newAnswerSlots);

      const newAvailableLetters = [...availableLetters];
      newAvailableLetters[availableIndex].used = true;
      setAvailableLetters(newAvailableLetters);

      setHintsUsed((prev) => prev + 1);
      setGlobalHintsUsed(true); // Mark global score as dirty
      playSound("pop");
    }
  }, [
    gameData,
    currentQuestionIndex,
    hintsUsed,
    answerSlots,
    availableLetters,
    isChecking,
    showCorrect,
    showWrong,
  ]);

  // Keyboard support dengan validasi
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isChecking || gameFinished || !gameData || showWrong || showCorrect)
        return;

      const key = e.key.toUpperCase();

      const letterIndex = availableLetters.findIndex(
        (item: { letter: string; used: boolean }) =>
          item.letter.toUpperCase() === key && !item.used,
      );

      if (letterIndex !== -1) {
        const firstEmptySlot = answerSlots.findIndex(
          (slot: string | null) => slot === null,
        );

        if (firstEmptySlot !== -1 && !isLetterCorrect(key, firstEmptySlot)) {
          setErrorSlotIndex(firstEmptySlot); // Tentukan slot mana yang error
          setShowError(true);
          playSound("error");
          setHadWrongInput(true); // Mark that user made a mistake
          setTimeout(() => setShowError(false), 500);
          return;
        }

        handleLetterClick(letterIndex);
      } else if (e.key === "Backspace") {
        let lastFilledIndex = -1;
        for (let i = answerSlots.length - 1; i >= 0; i--) {
          if (answerSlots[i] !== null) {
            lastFilledIndex = i;
            break;
          }
        }
        if (lastFilledIndex !== -1) {
          handleSlotClick(lastFilledIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    availableLetters,
    answerSlots,
    isChecking,
    gameFinished,
    gameData,
    showWrong,
    showCorrect,
    isLetterCorrect,
    handleLetterClick,
    handleSlotClick,
  ]);

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0 && !isChecking && !showWrong && !showCorrect) {
      setCurrentQuestionIndex((prevIndex: number) => prevIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (
      currentQuestionIndex < (gameData?.questions.length || 0) - 1 &&
      !isChecking &&
      !showWrong &&
      !showCorrect
    ) {
      setCurrentQuestionIndex((prevIndex: number) => prevIndex + 1);
    }
  };

  // FULLSCREEN LOGIC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleExit = () => {
    setIsPaused(true);
    setShowExitDialog(true);
  };

  const confirmExit = async () => {
    setShowExitDialog(false);
    // Note: No need to resume paused state as we are navigating away

    // POST request to increment play count
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/game/play-count`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_id }),
      });
    } catch (error) {
      console.error("Failed to update play count:", error);
      // Continue navigation even if request fails
    }

    navigate("/");
  };

  const cancelExit = () => {
    setShowExitDialog(false);
    setIsPaused(false);
  };

  const handlePlayAgain = () => {
    // Reset Logic State
    setAnswerSlots([]);
    setAvailableLetters([]);
    prevQuestionIndexRef.current = -1;

    // Reset Game State
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeElapsed(0);
    setGameFinished(false);
    setIsChecking(false);
    setShowCorrect(false);
    setShowWrong(false);
    setAnsweredQuestions(new Set());
    setHadWrongInput(false);
  };

  // RENDER DINAMIC CONTENT
  const currentQuestion = gameData?.questions[currentQuestionIndex];
  const totalQuestions =
    gameData?.questions.length || TOTAL_QUESTIONS_PLACEHOLDER;
  const isPerfect = correctAnswers === totalQuestions && !globalHintsUsed;

  let maxHints = 0;
  if (currentQuestion) {
    const len = currentQuestion.correct_word.replace(/\s/g, "").length;
    maxHints = Math.ceil(len / 5);
  }

  // LOADING & ERROR SCREEN
  if (isLoading)
    return (
      <div className="w-full h-screen flex justify-center items-center text-xl text-slate-600">
        Loading Anagram Game...
      </div>
    );
  if (error || !gameData)
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center p-10 text-red-600 text-xl">
        <h2 className="mb-4 font-bold">Error Loading Game</h2>
        <p>{error || "Game data not found."}</p>
        <Button onClick={() => navigate("/")} className="mt-6">
          Back to Home
        </Button>
      </div>
    );

  // GAME FINISHED SCREEN
  if (gameFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          {isPerfect ? (
            <>
              <div className="mb-6">
                <Trophy className="w-24 h-24 mx-auto text-yellow-500" />
              </div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
                PERFECT!
              </h1>
              <p className="text-2xl text-slate-700 mb-2">🎉 Amazing! 🎉</p>
              <p className="text-lg text-slate-600 mb-6">
                You got all {totalQuestions} questions correct!
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <Check className="w-24 h-24 mx-auto text-green-500" />
              </div>
              <h1 className="text-4xl font-bold text-slate-800 mb-4">
                Game Complete!
              </h1>
              <p className="text-lg text-slate-600 mb-6">
                You got {correctAnswers} out of {totalQuestions} correct
              </p>
            </>
          )}

          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-6">
            <p className="text-white text-lg mb-2">Your Score</p>
            <p className="text-6xl font-bold text-white">{score}</p>
          </div>

          <div className="bg-slate-100 rounded-xl p-4 mb-8">
            <p className="text-slate-600 text-sm">Time Taken</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatTime(timeElapsed)}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={handlePlayAgain}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-xl"
            >
              Play Again
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="px-8 py-6 text-lg rounded-xl"
            >
              <Home className="w-5 h-5 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // GAME PLAY SCREEN
  if (!currentQuestion) {
    return (
      <div className="w-full h-screen flex justify-center items-center text-xl text-slate-600">
        No question available
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isFullScreen ? "bg-white" : "relative bg-gradient-to-br from-blue-50 to-pink-50"} flex flex-col justify-between items-center p-6 md:p-10 transition-all`}
    >
      {/* Feedback Overlay */}
      {(showCorrect || showWrong) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className={`${showCorrect ? "bg-green-500" : "bg-red-500"} rounded-3xl p-12 shadow-2xl animate-bounce`}
          >
            {showCorrect ? (
              <div className="text-center">
                <Check className="w-32 h-32 text-white mx-auto mb-4" />
                <p className="text-white text-4xl font-bold mb-2">Correct!</p>
                <p className="text-white text-6xl font-bold">+{earnedScore}</p>
              </div>
            ) : (
              <div className="text-center">
                <X className="w-32 h-32 text-white mx-auto mb-4" />
                <p className="text-white text-4xl font-bold">Wrong!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center text-slate-700 mb-6 relative">
        {/* Pause Button */}
        <button
          onClick={() => setIsPaused(true)}
          className="p-2 rounded-full bg-white shadow-sm hover:bg-slate-100 transition text-slate-600"
          title="Pause Game"
        >
          <Pause className="w-6 h-6" />
        </button>

        {/* Stopwatch */}
        <div className="flex items-center gap-2 font-mono text-xl bg-white px-4 py-2 rounded-lg shadow-sm">
          <Clock className="w-5 h-5 text-slate-500" />
          <span>{formatTime(timeElapsed)}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 font-mono text-xl bg-white px-4 py-2 rounded-lg shadow-sm">
          <Check className="w-5 h-5 text-green-600" />
          <span className="font-bold text-green-700">{score}</span>
        </div>
      </div>

      {/* ALREADY ANSWERED INDICATOR */}
      {currentQuestion &&
        answeredQuestions.has(currentQuestion.question_id) && (
          <div className="w-full max-w-lg bg-green-100 border-2 border-green-500 rounded-lg p-3 mb-4">
            <p className="text-green-700 font-bold text-center">
              ✅ This question has been answered!
            </p>
          </div>
        )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col items-center justify-center w-full max-w-lg my-8">
        {/* Gambar Hint */}
        <div className="w-full h-64 bg-white rounded-2xl mb-8 flex items-center justify-center shadow-lg overflow-hidden">
          <img
            src={`${import.meta.env.VITE_API_URL}/${currentQuestion.image_url}`}
            alt="Question Hint"
            onError={(e) => {
              console.error("Image failed to load:", currentQuestion.image_url);
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'%3EImage not found%3C/text%3E%3C/svg%3E";
            }}
            className="max-h-full max-w-full object-contain p-4"
          />
        </div>

        {/* HINT BUTTON */}
        <div className="w-full flex justify-end mb-2">
          <Button
            onClick={handleHint}
            disabled={
              hintsUsed >= maxHints ||
              answeredQuestions.has(currentQuestion.question_id)
            }
            className={`flex items-center gap-2 transition-all ${
              hintsUsed >= maxHints
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-300"
            }`}
          >
            <Lightbulb
              className={`w-4 h-4 ${hintsUsed < maxHints ? "fill-amber-500" : ""}`}
            />
            <span className="text-sm font-bold">
              Hint ({hintsUsed}/{maxHints})
            </span>
          </Button>
        </div>

        {/* Slot Jawaban dengan support multi-word */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {(() => {
            if (!currentQuestion) return null;

            // Split correct word by spaces to get word groups
            const words = currentQuestion.correct_word.split(" ");
            let slotIndex = 0;

            return words.map((word, wordIdx) => (
              <div key={`word-${wordIdx}`} className="flex gap-2">
                {word.split("").map(() => {
                  const i = slotIndex++;
                  const letter = answerSlots[i];

                  return (
                    <div
                      key={`slot-${i}`}
                      onClick={() => handleSlotClick(i)}
                      className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl transition-all ${
                        i === errorSlotIndex && showError
                          ? "border-red-500 bg-red-100 animate-shake cursor-not-allowed"
                          : letter
                            ? showWrong
                              ? "bg-red-500 text-white shadow-md"
                              : showCorrect
                                ? "bg-green-500 text-white shadow-md"
                                : "bg-blue-500 text-white shadow-md hover:bg-blue-600 cursor-pointer"
                            : "border-4 border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {/* X ICON KALO SALAH PENCET */}
                      {i === errorSlotIndex && showError ? (
                        <X className="w-10 h-10 text-red-600 absolute inset-0 m-auto" />
                      ) : (
                        letter || ""
                      )}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* Huruf acak - dikelompokkan per kata */}
        <div className="w-full max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-3 mb-4">
            {(() => {
              if (!currentQuestion) return null;

              // Split correct word by spaces to get word groups
              const words = currentQuestion.correct_word.split(" ");
              let letterIndex = 0;

              return words.map((word, wordIdx) => {
                const wordLetterCount = word.length;
                const wordLetters = availableLetters.slice(
                  letterIndex,
                  letterIndex + wordLetterCount,
                );
                letterIndex += wordLetterCount;

                return (
                  <div
                    key={`word-group-${wordIdx}`}
                    className="flex gap-2 justify-center"
                  >
                    {wordLetters.map((item, localIdx) => {
                      const globalIdx =
                        letterIndex - wordLetterCount + localIdx;
                      return (
                        <button
                          key={`scramble-${globalIdx}`}
                          onClick={() => handleLetterClick(globalIdx)}
                          disabled={
                            item.used || isChecking || showWrong || showCorrect
                          }
                          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg transition-all ${
                            item.used || showWrong || showCorrect
                              ? "bg-slate-300 text-slate-400 cursor-not-allowed opacity-50"
                              : "bg-slate-700 text-white hover:bg-slate-800 hover:scale-110 cursor-pointer active:scale-95"
                          }`}
                        >
                          {item.letter}
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-sm text-slate-500 text-center">
          💡 Tip: You can also type using your keyboard!
        </p>
      </div>

      {/* FOOTER */}
      <div className="w-full max-w-2xl flex justify-between items-center">
        {/* Exit */}
        <button
          onClick={handleExit}
          disabled={showWrong || showCorrect}
          className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition bg-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline">Exit Game</span>
        </button>

        {/* Page Counter */}
        <div className="flex items-center gap-4 text-lg font-semibold text-slate-700 bg-white px-4 py-2 rounded-lg shadow-sm">
          <button
            onClick={handlePrevQuestion}
            disabled={
              currentQuestionIndex === 0 ||
              isChecking ||
              showWrong ||
              showCorrect
            }
            className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span>
            {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={
              currentQuestionIndex === totalQuestions - 1 ||
              isChecking ||
              showWrong ||
              showCorrect
            }
            className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600 transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullScreen}
          disabled={showWrong || showCorrect}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-800 bg-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFullScreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-slate-800">
              Exit Game?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600">
              Are you sure you want to exit the game? Your current score will be
              lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel onClick={cancelExit} className="px-6 py-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExit}
              className="bg-red-600 hover:bg-red-700 px-6 py-2"
            >
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PAUSE OVERLAY */}
      {isPaused && !showExitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center m-4 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Pause className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Game Paused
            </h2>
            <p className="text-slate-500 mb-8">
              Take a break! Your progress is saved.
            </p>

            <Button
              onClick={() => setIsPaused(false)}
              className="w-full py-6 text-lg rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              Resume Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayAnagram;
