import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Typography } from "@/components/ui/typography";
import {
  ArrowLeft,
  Trophy,
  Pause,
  Play,
  X,
  Timer as TimerIcon,
} from "lucide-react";
import * as Progress from "@radix-ui/react-progress";
import { InteractiveBackground } from "@/components/ui/interactive-background";
import { useAuthStore } from "@/store/useAuthStore";

interface Question {
  question_text: string;
  correct_answer: string;
  question_index: number;
}

interface TypeTheAnswerData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  is_published: boolean;
  questions: Question[];
  time_limit_seconds: number;
  score_per_question: number;
}

function TypeTheAnswer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<TypeTheAnswerData | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<
    {
      question_index: number;
      user_answer: string;
    }[]
  >([]);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [result, setResult] = useState<{
    correct_answers: number;
    total_questions: number;
    max_score: number;
    score: number;
    percentage: number;
  } | null>(null);

  // Animation states
  const [answerFeedback, setAnswerFeedback] = useState<
    "correct" | "wrong" | null
  >(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [completionTime, setCompletionTime] = useState<number>(0);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<
    {
      player_name: string;
      score: number;
      completion_time: number;
      percentage: number;
    }[]
  >([]);

  const timerRef = useRef<number | null>(null);

  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);

        let response;

        // Try private endpoint first if user is authenticated (for owner preview or published game)
        if (token) {
          try {
            response = await api.get(
              `/api/game/game-type/type-the-answer/${id}/play/private`,
            );
          } catch (privateErr: unknown) {
            // If private fails (user not owner), try public endpoint
            const err = privateErr as { response?: { status?: number } };
            if (
              err?.response?.status === 403 ||
              err?.response?.status === 401
            ) {
              response = await api.get(
                `/api/game/game-type/type-the-answer/${id}/play/public`,
              );
            } else {
              throw privateErr;
            }
          }
        } else {
          // No token, use public endpoint directly
          response = await api.get(
            `/api/game/game-type/type-the-answer/${id}/play/public`,
          );
        }

        setGame(response.data.data);
        setTimeRemaining(response.data.data.time_limit_seconds);
      } catch (err) {
        setError("Failed to load game.");
        console.error(err);
        toast.error("Failed to load game.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchGame();
  }, [id, token]);

  // Timer logic
  useEffect(() => {
    if (!gameStarted || isPaused || finished) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          toast.error("Time's up!");
          submitGame(userAnswers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isPaused, finished, userAnswers]);

  const startGame = () => {
    setGameStarted(true);
    setStartTime(Date.now());
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleNext = () => {
    if (!userAnswer.trim()) {
      toast.error("Please enter an answer!");
      return;
    }

    // Check if answer is correct for immediate feedback
    const currentQ = game!.questions[currentQuestion];
    const isCorrect =
      userAnswer.trim().toLowerCase() ===
      currentQ.correct_answer?.toLowerCase();

    // Show feedback animation
    setAnswerFeedback(isCorrect ? "correct" : "wrong");
    setTimeout(() => setAnswerFeedback(null), 600);

    const updatedAnswers = [
      ...userAnswers,
      {
        question_index: game!.questions[currentQuestion].question_index,
        user_answer: userAnswer.trim(),
      },
    ];

    setUserAnswers(updatedAnswers);

    const isLastQuestion = currentQuestion === game!.questions.length - 1;

    // Delay navigation to show animation
    setTimeout(() => {
      setUserAnswer("");
      if (!isLastQuestion) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        submitGame(updatedAnswers);
      }
    }, 600);
  };

  const handleExit = async () => {
    if (!finished) {
      const confirm = window.confirm(
        "Are you sure you want to exit? Your progress will be lost.",
      );
      if (!confirm) return;
    }

    navigate("/");
  };

  const submitGame = async (finalAnswers: typeof userAnswers) => {
    try {
      setLoading(true);

      // Calculate completion time
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setCompletionTime(timeSpent);

      const response = await api.post(
        `/api/game/game-type/type-the-answer/${id}/check`,
        {
          answers: finalAnswers,
          completion_time: timeSpent,
        },
      );

      setResult(response.data.data);

      // Fetch leaderboard
      await fetchLeaderboard();

      setFinished(true);
    } catch (err) {
      console.error(err);
      setError("Failed to submit game.");
      toast.error("Failed to submit game.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Fetch leaderboard from API
      const response = await api.get(
        `/api/game/game-type/type-the-answer/${id}/leaderboard`,
      );
      console.log("Leaderboard response:", response.data);
      const leaderboardData = response.data.data || [];
      console.log("Leaderboard data:", leaderboardData);
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      // Don't show error toast, leaderboard is optional
    }
  };

  if (loading && !game) {
    return (
      <>
        <InteractiveBackground variant="purple" />
        <div className="w-full h-screen flex justify-center items-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-300 border-t-transparent"></div>
        </div>
      </>
    );
  }

  if (error || !game) {
    return (
      <>
        <InteractiveBackground variant="purple" />
        <div className="w-full h-screen flex flex-col justify-center items-center gap-4 relative z-10">
          <Typography variant="h3" className="text-red-300">
            {error ?? "Game not found"}
          </Typography>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="bg-white/90 hover:bg-white"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Home
          </Button>
        </div>
      </>
    );
  }

  const questions = game.questions;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  // Result Screen
  if (finished && result) {
    const { correct_answers, total_questions, max_score, score, percentage } =
      result;

    const starCount = (percentage / 100) * 5;
    const fullStars = Math.floor(starCount);
    const halfStar = starCount - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let feedback = "Good effort!";
    if (percentage === 100) feedback = "Perfect Score! 🎉";
    else if (percentage >= 80) feedback = "Great job! 👏";
    else if (percentage >= 50) feedback = "Nice try! 💪";
    else feedback = "Keep practicing! 📚";

    return (
      <>
        <InteractiveBackground variant="gradient" />
        <div className="w-full min-h-screen flex justify-center items-center relative z-10 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 text-center max-w-md w-full space-y-6 shadow-2xl border border-purple-200">
            <Trophy className="mx-auto text-yellow-500" size={80} />
            <Typography variant="h2" className="text-indigo-600">
              {feedback}
            </Typography>
            <div className="space-y-2">
              <Typography variant="h1" className="text-5xl font-bold">
                {correct_answers}/{total_questions}
              </Typography>
              <Typography variant="p" className="text-gray-600">
                Correct Answers
              </Typography>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg space-y-1">
              <Typography variant="h4" className="text-indigo-700">
                Score: {score} / {max_score}
              </Typography>
              <Typography variant="p" className="text-gray-600">
                {percentage}% Accuracy
              </Typography>
            </div>
            <div className="flex justify-center gap-1 text-4xl">
              {Array.from({ length: fullStars }).map((_, i) => (
                <span key={`full-${i}`} className="text-yellow-500">
                  ★
                </span>
              ))}
              {halfStar && <span className="text-yellow-500">☆</span>}
              {Array.from({ length: emptyStars }).map((_, i) => (
                <span key={`empty-${i}`} className="text-gray-300">
                  ★
                </span>
              ))}
            </div>

            {/* Completion Time */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <Typography variant="small" className="text-gray-600">
                Completion Time
              </Typography>
              <Typography variant="h4" className="text-blue-700">
                {Math.floor(completionTime / 60)}m {completionTime % 60}s
              </Typography>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl space-y-4 border-2 border-indigo-200">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="text-indigo-600" size={24} />
                  <Typography variant="h3" className="text-indigo-700">
                    Leaderboard
                  </Typography>
                </div>
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        entry.player_name === "You"
                          ? "bg-yellow-100 border-2 border-yellow-400 shadow-md scale-105"
                          : "bg-white border border-indigo-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xl font-bold ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                                ? "text-gray-400"
                                : index === 2
                                  ? "text-orange-600"
                                  : "text-gray-500"
                          }`}
                        >
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : `#${index + 1}`}
                        </span>
                        <div className="text-left">
                          <Typography
                            variant="small"
                            className={`font-semibold ${
                              entry.player_name === "You"
                                ? "text-indigo-700"
                                : "text-gray-700"
                            }`}
                          >
                            {entry.player_name}
                          </Typography>
                          <Typography
                            variant="small"
                            className="text-gray-500 text-xs"
                          >
                            {Math.floor(entry.completion_time / 60)}m{" "}
                            {entry.completion_time % 60}s
                          </Typography>
                        </div>
                      </div>
                      <div className="text-right">
                        <Typography
                          variant="small"
                          className="font-bold text-indigo-700"
                        >
                          {entry.score} pts
                        </Typography>
                        <Typography
                          variant="small"
                          className="text-gray-500 text-xs"
                        >
                          {entry.percentage}%
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  setFinished(false);
                  setResult(null);
                  setCurrentQuestion(0);
                  setUserAnswers([]);
                  setUserAnswer("");
                  setTimeRemaining(game.time_limit_seconds);
                  setGameStarted(false);
                  setLeaderboard([]);
                  setCompletionTime(0);
                }}
              >
                Play Again
              </Button>
              <Button className="w-full" variant="outline" onClick={handleExit}>
                <ArrowLeft className="mr-2" size={16} />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Start Screen
  if (!gameStarted) {
    return (
      <>
        <InteractiveBackground variant="purple" />
        <div className="w-full min-h-screen flex justify-center items-center relative z-10 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 text-center max-w-lg w-full space-y-6 shadow-2xl border border-purple-200">
            {game.thumbnail_image && (
              <img
                src={`${import.meta.env.VITE_API_URL}/${game.thumbnail_image}`}
                alt={game.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <Typography variant="h1" className="text-indigo-600">
              {game.name}
            </Typography>
            <Typography variant="p" className="text-gray-600">
              {game.description}
            </Typography>
            <div className="bg-indigo-50 p-4 rounded-lg space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-700">Questions:</span>
                <span className="font-semibold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Time Limit:</span>
                <span className="font-semibold">
                  {Math.floor(game.time_limit_seconds / 60)}:
                  {String(game.time_limit_seconds % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Points per Question:</span>
                <span className="font-semibold">{game.score_per_question}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
                onClick={startGame}
              >
                Start Game
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Game Screen
  return (
    <>
      <InteractiveBackground variant="gradient" />
      <div className="w-full min-h-screen relative z-10 p-4">
        <div className="max-w-3xl mx-auto py-8">
          {/* Header with Timer and Controls */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-lg border border-purple-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <TimerIcon className="text-indigo-600" size={24} />
                <Typography variant="h3" className="text-indigo-600">
                  {Math.floor(timeRemaining / 60)}:
                  {String(timeRemaining % 60).padStart(2, "0")}
                </Typography>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  className="flex items-center gap-1"
                >
                  {isPaused ? (
                    <>
                      <Play size={16} /> Resume
                    </>
                  ) : (
                    <>
                      <Pause size={16} /> Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleExit}
                  className="flex items-center gap-1"
                >
                  <X size={16} /> Exit
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress.Root
                className="relative overflow-hidden bg-gray-200 rounded-full w-full h-3"
                value={progress}
              >
                <Progress.Indicator
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </Progress.Root>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-lg space-y-6 border border-purple-200">
            {isPaused ? (
              <div className="text-center py-16">
                <Pause className="mx-auto text-gray-400 mb-4" size={64} />
                <Typography variant="h3" className="text-gray-600">
                  Game Paused
                </Typography>
                <Typography variant="p" className="text-gray-500 mt-2">
                  Click Resume to continue
                </Typography>
              </div>
            ) : (
              <>
                <div>
                  <Typography variant="h4" className="text-gray-500 mb-2">
                    Question {currentQ.question_index}
                  </Typography>
                  <Typography variant="h2" className="text-gray-800">
                    {currentQ.question_text}
                  </Typography>
                </div>

                <div className="space-y-3">
                  <Typography variant="p" className="text-gray-600">
                    Type your answer below:
                  </Typography>
                  <div className="relative">
                    <Input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNext();
                      }}
                      placeholder="Enter your answer here..."
                      className={`w-full text-lg p-4 border-2 rounded-lg transition-all duration-300 ${
                        answerFeedback === "correct"
                          ? "border-green-500 bg-green-50 animate-[bounce_0.5s_ease-in-out]"
                          : answerFeedback === "wrong"
                            ? "border-red-500 bg-red-50 animate-[shake_0.5s_ease-in-out]"
                            : "border-indigo-200 focus:border-indigo-500"
                      }`}
                      autoFocus
                      disabled={loading || answerFeedback !== null}
                    />
                    {answerFeedback === "correct" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-2xl animate-[bounce_0.5s_ease-in-out]">
                        ✓
                      </div>
                    )}
                    {answerFeedback === "wrong" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 text-2xl animate-[shake_0.5s_ease-in-out]">
                        ✗
                      </div>
                    )}
                  </div>
                  <Typography variant="small" className="text-gray-500">
                    Press Enter or click Next to submit
                  </Typography>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={loading || !userAnswer.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
                >
                  {loading
                    ? "Submitting..."
                    : isLastQuestion
                      ? "Submit"
                      : "Next Question"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TypeTheAnswer;
