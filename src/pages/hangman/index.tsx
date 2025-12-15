import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { HangmanFigure } from "@/components/hangman/HangmanFigure";
import { WordDisplay } from "@/components/hangman/WordDisplay";
import { Keyboard } from "@/components/hangman/Keyboard";
import { GameCompletionModal } from "@/components/hangman/GameCompletionModal";
import { ShowAnswersModal } from "@/components/hangman/ShowAnswersModal";
import "./hangman.css";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  getHangmanLeaderboard,
  saveGameResult,
  type LeaderboardEntry,
} from "@/api/hangman";

interface Question {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface CompletedQuestion {
  question: string;
  answer: string;
  playerAnswer: string;
  isCorrect: boolean;
}

const MAX_LIVES = 5;
const POINTS_PER_CORRECT = 10;

function HangmanGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Game State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing",
  );
  const [isShowAnswersOpen, setIsShowAnswersOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<
    CompletedQuestion[]
  >([]);
  const [completedIndexes, setCompletedIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameTitle, setGameTitle] = useState("");
  const [creatorUsername, setCreatorUsername] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isGameOverPreview, setIsGameOverPreview] = useState(false);

  // Per-question state storage
  const [questionStates, setQuestionStates] = useState<
    Map<
      number,
      {
        guessedLetters: string[];
        incorrectGuesses: number;
      }
    >
  >(new Map());

  // Audio refs
  const correctSound = new Audio("/src/assets/game/hangman/audio/correct.mp3");
  const wrongSound = new Audio("/src/assets/game/hangman/audio/wrong.mp3");
  const completeSound = new Audio("/src/assets/game/hangman/audio/win.mp3");
  const gameOverSound = new Audio("/src/assets/game/hangman/audio/lose.mp3");

  // Increment play count
  const addPlayCount = async (gameId: string) => {
    try {
      await api.post("/api/game/play-count", {
        game_id: gameId,
      });
    } catch (err) {
      console.error("Failed to update play count:", err);
    }
  };

  // Fetch game template on mount
  useEffect(() => {
    const fetchGameTemplate = async () => {
      try {
        let endpoint = `/api/game/game-type/hangman/${id}`;

        // Use public endpoint if not authenticated
        if (!token) {
          endpoint = `/api/game/game-type/hangman/${id}/play/public`;
        }

        const response = await api.get(endpoint);
        const gameData = response.data.data;

        // Handle both full game data and public game data
        const questionsData =
          gameData.questions || gameData.game_json?.questions || [];
        setQuestions(questionsData);
        setGameTitle(gameData.name);
        setCreatorUsername(
          gameData.creator_username || gameData.creator?.username || "Unknown",
        );
        setLoading(false);
      } catch (error) {
        console.error("Error fetching game:", error);
        toast.error("Failed to load game");
        navigate("/");
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const data = await getHangmanLeaderboard(id!);
        console.log("Leaderboard data:", data); // Debug log
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    if (id) {
      fetchGameTemplate();
      fetchLeaderboard();
    }
  }, [id, navigate, token]);

  // Timer effect
  useEffect(() => {
    if (gameStatus === "playing" && gameStarted && !isPauseModalOpen) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus, gameStarted, isPauseModalOpen]);

  const currentQuestion = questions[currentQuestionIndex];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSolvedLetters = (index: number) => {
    if (!questions[index]) return [] as string[];
    // If question is completed, return all letters
    if (completedIndexes.has(index)) {
      return [
        ...new Set(
          questions[index].answer
            .toUpperCase()
            .split("")
            .filter((letter) => letter !== " "),
        ),
      ];
    }
    // Otherwise return stored guessed letters
    return questionStates.get(index)?.guessedLetters || [];
  };

  const getIncorrectGuesses = (index: number) => {
    return questionStates.get(index)?.incorrectGuesses || 0;
  };

  const playSound = (audio: HTMLAudioElement) => {
    if (!isAudioMuted) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const toggleFullscreen = () => {
    const gameCard = document.getElementById("hangman-game-card");
    if (!gameCard) return;

    if (!document.fullscreenElement) {
      gameCard.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for F11 key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleKeyPress);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle letter guess
  const handleGuess = (letter: string) => {
    if (gameStatus !== "playing" || !currentQuestion) return;
    if (completedIndexes.has(currentQuestionIndex)) return;

    // Update guessed letters
    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    const correctLetters = currentQuestion.answer.toUpperCase().split("");
    const uniqueCorrectLetters = [
      ...new Set(correctLetters.filter((l) => l !== " ")),
    ];
    const isCorrect = correctLetters.includes(letter);

    if (!isCorrect) {
      playSound(wrongSound);
      const newIncorrectGuesses = incorrectGuesses + 1;
      setIncorrectGuesses(newIncorrectGuesses);

      // Store state
      setQuestionStates((prev) =>
        new Map(prev).set(currentQuestionIndex, {
          guessedLetters: newGuessedLetters,
          incorrectGuesses: newIncorrectGuesses,
        }),
      );

      if (newIncorrectGuesses >= MAX_LIVES) {
        playSound(gameOverSound);
        // Game over - record wrong answer
        const completedQuestion: CompletedQuestion = {
          question: currentQuestion.question,
          answer: currentQuestion.answer,
          playerAnswer: "",
          isCorrect: false,
        };
        setCompletedQuestions((prev) => [...prev, completedQuestion]);
        setGameStatus("lost");
        setIsGameOverPreview(true);
        // Save score to backend with time and refresh leaderboard
        const savePromises = [addPlayCount(id!)];
        if (score > 0) {
          savePromises.push(saveGameResult(id!, score, timeElapsed));
        }

        Promise.all(savePromises)
          .then(() => {
            // Auto-refresh leaderboard after save
            return getHangmanLeaderboard(id!, 10);
          })
          .then((updatedLeaderboard) => {
            setLeaderboard(updatedLeaderboard);
            if (score > 0) {
              toast.success("Score saved!", { duration: 2000 });
            }
          })
          .catch((err) => {
            console.error("Failed to save game result:", err);
            // Only show error if we actually tried to save score
            if (score > 0) {
              toast.error("Failed to save score");
            }
          });
        // Briefly show hangman hanged before modal
        setTimeout(() => {
          setIsCompletionModalOpen(true);
          setIsGameOverPreview(false);
        }, 2500);
      }
      return;
    }

    // Play correct sound
    playSound(correctSound);

    // Store state
    setQuestionStates((prev) =>
      new Map(prev).set(currentQuestionIndex, {
        guessedLetters: newGuessedLetters,
        incorrectGuesses,
      }),
    );

    // Check if word is complete (all unique letters guessed)
    const wordComplete = uniqueCorrectLetters.every((letter) =>
      newGuessedLetters.includes(letter),
    );

    if (wordComplete) {
      playSound(completeSound);
      // Add points and move to next question or end game
      const newScore = score + POINTS_PER_CORRECT;
      setScore(newScore);

      const completedQuestion: CompletedQuestion = {
        question: currentQuestion.question,
        answer: currentQuestion.answer,
        playerAnswer: currentQuestion.answer,
        isCorrect: true,
      };

      // Mark current question completed and decide next step
      const nextCompletedQuestions = [...completedQuestions, completedQuestion];
      const nextCompletedIndexes = new Set(completedIndexes);
      nextCompletedIndexes.add(currentQuestionIndex);

      const hasFinishedAll = nextCompletedIndexes.size === questions.length;

      if (hasFinishedAll) {
        setCompletedQuestions(nextCompletedQuestions);
        setCompletedIndexes(nextCompletedIndexes);
        setGameStatus("won");
        setIsCompletionModalOpen(true);
        // Save score to backend with time and refresh leaderboard
        const savePromises = [addPlayCount(id!)];
        if (newScore > 0) {
          savePromises.push(saveGameResult(id!, newScore, timeElapsed));
        }

        Promise.all(savePromises)
          .then(() => {
            // Auto-refresh leaderboard after save
            return getHangmanLeaderboard(id!, 10);
          })
          .then((updatedLeaderboard) => {
            setLeaderboard(updatedLeaderboard);
            if (newScore > 0) {
              toast.success("Score saved!", { duration: 2000 });
            }
          })
          .catch((err) => {
            console.error("Failed to save game result:", err);
            // Only show error if we actually tried to save score
            if (newScore > 0) {
              toast.error("Failed to save score");
            }
          });
        return;
      }

      // Jump to the first unanswered question
      const nextIndex = questions.findIndex(
        (_, idx) => !nextCompletedIndexes.has(idx),
      );

      setTimeout(() => {
        setCompletedQuestions(nextCompletedQuestions);
        setCompletedIndexes(nextCompletedIndexes);
        const targetIndex = nextIndex >= 0 ? nextIndex : currentQuestionIndex;
        setCurrentQuestionIndex(targetIndex);
        // Load stored state for next question
        const nextState = questionStates.get(targetIndex);
        setGuessedLetters(nextState?.guessedLetters || []);
        setIncorrectGuesses(nextState?.incorrectGuesses || 0);
      }, 500);
    }
  };

  // Handle question navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const target = currentQuestionIndex - 1;
      setCurrentQuestionIndex(target);
      // Load stored state
      setGuessedLetters(getSolvedLetters(target));
      setIncorrectGuesses(getIncorrectGuesses(target));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const target = currentQuestionIndex + 1;
      setCurrentQuestionIndex(target);
      // Load stored state
      setGuessedLetters(getSolvedLetters(target));
      setIncorrectGuesses(getIncorrectGuesses(target));
    }
  };

  const handlePlayAgain = () => {
    // Reset to first question
    setCurrentQuestionIndex(0);
    setGuessedLetters([]);
    setIncorrectGuesses(0);
    setScore(0);
    setTimeElapsed(0);
    setGameStatus("playing");
    setCompletedQuestions([]);
    setCompletedIndexes(new Set());
    setQuestionStates(new Map());
    setIsCompletionModalOpen(false);
    setGameStarted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">No questions found</div>
      </div>
    );
  }

  const wordComplete = [
    ...new Set(
      currentQuestion.answer
        .toUpperCase()
        .split("")
        .filter((letter) => letter !== " "),
    ),
  ].every((letter) => guessedLetters.includes(letter));

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit Game
          </button>
        </div>

        {/* Main Container */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column: Game Card + Project Info */}
          <div>
            {/* Main Game Card - Fullscreen Black */}
            <div
              id="hangman-game-card"
              className="relative bg-black rounded-2xl shadow-2xl overflow-hidden"
              style={{ minHeight: "600px" }}
            >
              {/* Modals INSIDE GAME CARD */}
              <GameCompletionModal
                isOpen={isCompletionModalOpen}
                isWon={gameStatus === "won"}
                score={score}
                timeElapsed={timeElapsed}
                totalQuestions={questions.length}
                correctAnswers={
                  completedQuestions.filter((q) => q.isCorrect).length
                }
                onPlayAgain={handlePlayAgain}
                onLeaderboard={() => {
                  setIsCompletionModalOpen(false);
                  setIsLeaderboardModalOpen(true);
                }}
                onShowAnswers={() => setIsShowAnswersOpen(true)}
                onClose={() => {
                  handlePlayAgain();
                }}
              />

              <ShowAnswersModal
                isOpen={isShowAnswersOpen}
                completedQuestions={completedQuestions}
                onClose={() => setIsShowAnswersOpen(false)}
              />

              {/* Leaderboard Overlay */}
              {isLeaderboardModalOpen && (
                <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-50 rounded-2xl">
                  <div className="bg-slate-900 rounded-2xl shadow-2xl w-[90%] max-w-4xl border border-slate-700">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/80 rounded-t-2xl">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />{" "}
                        Leaderboard
                      </h3>
                      <button
                        onClick={() => setIsLeaderboardModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="max-h-[65vh] overflow-y-auto">
                      <div className="grid grid-cols-4 text-xs uppercase text-slate-400 px-6 py-3 border-b border-slate-800">
                        <span>Rank</span>
                        <span>User</span>
                        <span>Score</span>
                        <span>Time</span>
                      </div>
                      {leaderboard.length === 0 && (
                        <div className="text-center text-slate-500 py-8">
                          No scores yet.
                        </div>
                      )}
                      {leaderboard.map((entry, index) => (
                        <div
                          key={`${entry.userId}-${index}`}
                          className="grid grid-cols-4 items-center px-6 py-3 border-b border-slate-800 text-sm text-white bg-slate-900/40"
                        >
                          <span className="font-semibold text-slate-300">
                            #{index + 1}
                          </span>
                          <span className="font-semibold">
                            {entry.username}
                          </span>
                          <span className="text-slate-200">
                            {entry.score} pts
                          </span>
                          <span className="text-slate-300 text-xs">
                            {entry.timeTaken !== null &&
                            entry.timeTaken !== undefined
                              ? `⏱️ ${formatTime(entry.timeTaken)}`
                              : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pause Overlay */}
              {isPauseModalOpen && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 rounded-2xl">
                  <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/80 rounded-t-2xl">
                      <h3 className="text-lg font-bold text-white">
                        Game Paused
                      </h3>
                      <button
                        onClick={() => setIsPauseModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 space-y-3">
                      <button
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        onClick={() => {
                          setIsPauseModalOpen(false);
                          handlePlayAgain();
                        }}
                      >
                        Retry
                      </button>
                      <button
                        className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700"
                        onClick={() => setIsPauseModalOpen(false)}
                      >
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Start Game Overlay */}
              {!gameStarted && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 rounded-2xl">
                  <div className="text-center space-y-6">
                    <h1 className="text-5xl font-bold text-white">Hangman</h1>
                    <h2 className="text-4xl font-semibold text-white">
                      {gameTitle}
                    </h2>
                    <button
                      onClick={() => setGameStarted(true)}
                      className="mt-8 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition transform hover:scale-105"
                    >
                      START
                    </button>
                  </div>
                </div>
              )}

              {/* Game Over Focus Overlay */}
              {isGameOverPreview && (
                <div
                  className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
                  style={{
                    animation: "hangman-focus-overlay 0.5s ease-out forwards",
                  }}
                >
                  <div className="text-center text-red-200 text-sm uppercase tracking-[0.2em] mb-4 opacity-90">
                    Game Over
                  </div>
                  <div
                    className="scale-110 md:scale-125"
                    style={{
                      animation: "hangman-figure-pop 0.55s ease-out forwards",
                    }}
                  >
                    <HangmanFigure incorrectGuesses={incorrectGuesses} />
                  </div>
                  <div className="mt-6">
                    <WordDisplay
                      word={currentQuestion.answer}
                      guessedLetters={guessedLetters}
                    />
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    Letters guessed shown before final drop
                  </div>
                </div>
              )}

              {/* Timer Top-Left */}
              <div className="absolute top-6 left-6 text-white text-2xl font-bold font-mono">
                {formatTime(timeElapsed)}
              </div>

              {/* Score Top-Right */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <span className="text-white text-xl">✓</span>
                <span className="text-white text-2xl font-bold">{score}</span>
              </div>

              {/* Center Content */}
              <div className="flex flex-col items-center justify-center h-full px-8 py-20">
                {/* Question Text */}
                <div className="text-center mb-8">
                  <h2 className="text-white text-3xl font-bold mb-2">
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Hangman Figure */}
                <div
                  className={`mb-6 transition duration-600 ease-out ${
                    isGameOverPreview
                      ? "scale-110 drop-shadow-[0_0_25px_rgba(239,68,68,0.45)]"
                      : ""
                  }`}
                >
                  <HangmanFigure incorrectGuesses={incorrectGuesses} />
                </div>

                {/* Word Display */}
                <div className="mb-8">
                  <WordDisplay
                    word={currentQuestion.answer}
                    guessedLetters={guessedLetters}
                  />
                </div>

                {/* Keyboard */}
                <div className="mb-6">
                  <Keyboard
                    guessedLetters={guessedLetters}
                    onGuess={handleGuess}
                    disabled={
                      gameStatus !== "playing" || wordComplete || !gameStarted
                    }
                  />
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                {/* Menu Button (left) */}
                <button
                  className="text-white hover:bg-white/10 p-2 rounded transition"
                  onClick={() => setIsPauseModalOpen(true)}
                  title="Pause"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>

                {/* Navigation Center */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0 || !gameStarted}
                    className="text-white hover:bg-white/10 p-2 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-white font-mono text-lg">
                    {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <button
                    onClick={handleNextQuestion}
                    disabled={
                      currentQuestionIndex === questions.length - 1 ||
                      !gameStarted
                    }
                    className="text-white hover:bg-white/10 p-2 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Mute & Fullscreen (right) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className="text-white hover:text-blue-400 transition p-2 rounded-lg hover:bg-white/10"
                    title={isAudioMuted ? "Unmute sound" : "Mute sound"}
                  >
                    {isAudioMuted ? (
                      <VolumeX size={24} />
                    ) : (
                      <Volume2 size={24} />
                    )}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-blue-400 transition p-2 rounded-lg hover:bg-white/10"
                    title={
                      isFullscreen
                        ? "Exit fullscreen (F11)"
                        : "Enter fullscreen (F11)"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize size={24} />
                    ) : (
                      <Maximize size={24} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Project Info Below Card */}
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-slate-900">{gameTitle}</h3>
              <p className="text-slate-600 text-sm mt-1">
                by {creatorUsername}
              </p>
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h3>

            {/* Podium Top 3 */}
            {leaderboard.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-3 items-end text-center">
                  {/* 2nd place */}
                  {leaderboard[1] ? (
                    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 shadow-md">
                      <div className="text-lg font-bold text-slate-500">#2</div>
                      <div
                        className="text-base font-semibold text-slate-800 mt-1 truncate max-w-full block"
                        title={leaderboard[1].username}
                      >
                        {leaderboard[1].username}
                      </div>
                      <div className="text-sm text-slate-600">
                        {leaderboard[1].score} pts
                      </div>
                      <div className="text-xs text-slate-500">
                        {leaderboard[1].timeTaken !== null &&
                        leaderboard[1].timeTaken !== undefined
                          ? `⏱️ ${formatTime(leaderboard[1].timeTaken)}`
                          : "-"}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 text-slate-300">
                      #2
                    </div>
                  )}

                  {/* 1st place */}
                  <div className="bg-gradient-to-br from-amber-300 via-amber-200 to-amber-100 rounded-2xl p-5 border border-amber-200 shadow-xl scale-[1.07]">
                    <div className="text-2xl font-black text-amber-800">#1</div>
                    <div
                      className="text-lg font-bold text-amber-900 mt-1 truncate max-w-full block"
                      title={leaderboard[0]?.username}
                    >
                      {leaderboard[0]?.username || "-"}
                    </div>
                    <div className="text-base text-amber-800 font-semibold">
                      {leaderboard[0] ? `${leaderboard[0].score} pts` : "-"}
                    </div>
                    <div className="text-xs text-amber-700">
                      {leaderboard[0]?.timeTaken !== null &&
                      leaderboard[0]?.timeTaken !== undefined
                        ? `⏱️ ${formatTime(leaderboard[0].timeTaken!)}`
                        : "-"}
                    </div>
                  </div>

                  {/* 3rd place */}
                  {leaderboard[2] ? (
                    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 shadow-md">
                      <div className="text-lg font-bold text-slate-500">#3</div>
                      <div
                        className="text-base font-semibold text-slate-800 mt-1 truncate max-w-full block"
                        title={leaderboard[2].username}
                      >
                        {leaderboard[2].username}
                      </div>
                      <div className="text-sm text-slate-600">
                        {leaderboard[2].score} pts
                      </div>
                      <div className="text-xs text-slate-500">
                        {leaderboard[2].timeTaken !== null &&
                        leaderboard[2].timeTaken !== undefined
                          ? `⏱️ ${formatTime(leaderboard[2].timeTaken)}`
                          : "-"}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 text-slate-300">
                      #3
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            {leaderboard.length > 3 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {leaderboard.slice(3).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-bold text-slate-400 w-8">
                        #{index + 4}
                      </span>
                      <span
                        className="font-medium text-slate-700 truncate block max-w-[150px]"
                        title={entry.username}
                      >
                        {entry.username}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
                      <span className="font-semibold">{entry.score} pts</span>
                      {entry.timeTaken !== null &&
                      entry.timeTaken !== undefined ? (
                        <span className="text-xs text-slate-500">
                          ⏱️ {formatTime(entry.timeTaken)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {leaderboard.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                No scores yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals now rendered inside game card, see main game card div above */}
    </div>
  );
}

export default HangmanGame;
