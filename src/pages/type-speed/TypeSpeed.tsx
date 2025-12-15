"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "@/api/axios";
import toast from "react-hot-toast";

interface TypeSpeedText {
  id: string;
  content: string;
  difficulty: "easy" | "medium" | "hard";
}

interface TypingResult {
  total_characters: number;
  correct_characters: number;
  incorrect_characters: number;
  wpm: number;
  accuracy: number;
  time_taken: number;
}

export default function TypeSpeed() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [gameMode, setGameMode] = useState<"time" | "word">("time");
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [wordCount, setWordCount] = useState<number>(30);
  const [generatedText, setGeneratedText] = useState<TypeSpeedText | null>(
    null,
  );

  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [wordsTyped, setWordsTyped] = useState(0);

  const [result, setResult] = useState<TypingResult | null>(null);

  const [characterStatus, setCharacterStatus] = useState<
    ("correct" | "incorrect" | "pending")[]
  >([]);

  const [showLowAccuracyPopup, setShowLowAccuracyPopup] = useState(false);
  const [lowAccuracyMessage, setLowAccuracyMessage] = useState("");
  const [hasShownLowAccuracyWarning, setHasShownLowAccuracyWarning] =
    useState(false);

  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (generatedText) {
      setCharacterStatus(
        new Array(generatedText.content.length).fill("pending"),
      );
    }
  }, [generatedText]);

  /**
   * Fungsi untuk menghitung hasil dan menyelesaikan game.
   * Parameter 'timeIsUp' (line 86) telah dihapus karena tidak digunakan.
   */
  const handleFinishGame = useCallback(async () => {
    if (!generatedText || !gameStartTime) return;

    setGameStarted(false);
    setGameFinished(true);

    let timeTaken = Math.floor((Date.now() - gameStartTime) / 1000);
    if (timeTaken < 1) timeTaken = 1;

    const originalText = generatedText.content;
    const finalInput = userInput;

    let totalChars = 0;
    let correctChars = 0;
    let incorrectChars = 0;

    for (let i = 0; i < finalInput.length && i < originalText.length; i++) {
      if (originalText[i] !== " ") {
        totalChars++;
        if (finalInput[i] === originalText[i]) {
          correctChars++;
        } else {
          incorrectChars++;
        }
      }
    }

    const accuracy =
      totalChars === 0 ? 0 : Math.round((correctChars / totalChars) * 100);
    const timeInMinutes = timeTaken / 60;
    const wpm = Math.round(finalInput.length / 5 / timeInMinutes);

    const localResult: TypingResult = {
      total_characters: totalChars,
      correct_characters: correctChars,
      incorrect_characters: incorrectChars,
      wpm,
      accuracy,
      time_taken: timeTaken,
    };

    setResult(localResult);
    toast.success("Results calculated!");

    try {
      if (!id || (generatedText.id && generatedText.id.startsWith("auto-"))) {
        return;
      }

      await api.post(`/api/game/game-type/type-speed/${id}/check`, {
        text_id: generatedText.id,
        user_input: finalInput,
        time_taken: timeTaken,
      });
    } catch (err) {
      console.error(err);
    }
  }, [generatedText, gameStartTime, userInput, id]);

  /**
   * useEffect untuk mengelola timer game.
   * Menambahkan 'handleFinishGame' ke dependency array untuk mengatasi warning 'react-hooks/exhaustive-deps'.
   */
  useEffect(() => {
    let timer: number | null = null;
    if (
      gameMode === "time" &&
      gameStarted &&
      !gameFinished &&
      !isPaused &&
      timeRemaining > 0
    ) {
      timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer!);
            handleFinishGame(); // Panggilan tanpa argumen
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timer) {
      clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [
    gameMode,
    gameStarted,
    gameFinished,
    isPaused,
    timeRemaining,
    generatedText,
    handleFinishGame,
  ]);

  const regenerateTextMidGame = async () => {
    try {
      const params =
        gameMode === "time"
          ? { time_limit: timeRemaining }
          : { word_count: wordCount };

      const res = await api.get("/api/game/game-type/type-speed/generate", {
        params,
      });

      const textData = res.data.data?.text;
      if (!textData) return;

      setGeneratedText(textData);
      setUserInput("");
      setWordsTyped(0);
      setCharacterStatus(new Array(textData.content.length).fill("pending"));
    } catch (err) {
      console.error("Failed to regenerate text", err);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (value.length < userInput.length) {
      setUserInput(value);

      setCharacterStatus((prev) => {
        const updated = [...prev];
        for (let i = value.length; i < prev.length; i++) {
          updated[i] = "pending";
        }
        return updated;
      });

      return;
    }

    if (isPaused && value.length > userInput.length) {
      setIsPaused(false);
    }

    if (!gameStarted && generatedText && value.length > 0) {
      setGameStartTime(Date.now());
      setGameStarted(true);
      setGameFinished(false);
      setIsPaused(false);
    }

    setUserInput(value);

    if (generatedText) {
      const originalText = generatedText.content;
      const newStatus = [...characterStatus];

      for (let i = 0; i < originalText.length; i++) {
        if (i < value.length) {
          if (originalText[i] === " ") {
            newStatus[i] = value[i] === " " ? "correct" : "incorrect";
          } else {
            newStatus[i] =
              value[i] === originalText[i] ? "correct" : "incorrect";
          }
        } else {
          newStatus[i] = "pending";
        }
      }

      setCharacterStatus(newStatus);

      let totalChars = 0;
      let correctChars = 0;

      for (let i = 0; i < value.length && i < originalText.length; i++) {
        if (originalText[i] !== " ") {
          totalChars++;
          if (value[i] === originalText[i]) {
            correctChars++;
          }
        }
      }

      const currentAccuracy =
        totalChars === 0 ? 100 : Math.round((correctChars / totalChars) * 100);

      // Show popup if accuracy is below 10% and we have typed at least 20 characters (letters only)
      if (
        currentAccuracy < 10 &&
        totalChars >= 20 &&
        !hasShownLowAccuracyWarning &&
        gameStarted
      ) {
        const messages = [
          "Whoaaa what a nice play fellas? can you do any worse?",
          "Are you typing with your eyes closed or just testing my patience?",
          "Is your keyboard broken or is this performance art?",
          "I've seen cats walk on keyboards with better accuracy!",
        ];
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        setLowAccuracyMessage(randomMessage);
        setShowLowAccuracyPopup(true);
        setHasShownLowAccuracyWarning(true);

        // Hide popup after animation completes (slide down + shake + 4s stay + slide up = ~5s total)
        setTimeout(() => {
          setShowLowAccuracyPopup(false);
        }, 5000);
      }

      const typedWords = value
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      setWordsTyped(typedWords);

      if (gameMode === "word" && typedWords >= wordCount) {
        handleFinishGame(); // Panggilan tanpa argumen
      } else if (value.length >= originalText.length) {
        if (gameMode === "time" && timeRemaining > 0) {
          regenerateTextMidGame();
        } else {
          handleFinishGame(); // Panggilan tanpa argumen
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setGameStarted(false);
    setGameFinished(false);
    setUserInput("");
    setResult(null);
    setWordsTyped(0);

    try {
      const params =
        gameMode === "time"
          ? { time_limit: timeLimit }
          : { word_count: wordCount };

      const res = await api.get("/api/game/game-type/type-speed/generate", {
        params,
      });

      const payload = res.data.data;
      const textData = payload?.text;

      if (textData) {
        setGeneratedText(textData);
        if (payload.time_limit && typeof payload.time_limit === "number") {
          setTimeLimit(payload.time_limit);
          setTimeRemaining(payload.time_limit);
        } else {
          setTimeRemaining(timeLimit);
        }
      } else {
        throw new Error("Invalid text structure returned.");
      }
      toast.success("Text generated successfully. Start typing to begin!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate text");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi handleStart telah dihapus karena tidak digunakan (issue line 312)

  const handleReset = () => {
    setGameStartTime(null);
    setGameStarted(false);
    setGameFinished(false);
    setIsPaused(false);
    setUserInput("");
    setTimeRemaining(timeLimit);
    setWordsTyped(0);
    setResult(null);
    setHasShownLowAccuracyWarning(false);
    setShowLowAccuracyPopup(false);
    if (generatedText) {
      setCharacterStatus(
        new Array(generatedText.content.length).fill("pending"),
      );
    }
    toast.success("Game reset. Start typing to begin again!");
  };

  const handleExit = () => navigate(-1);

  const renderText = () => {
    if (!generatedText) return null;

    const originalText = generatedText.content;

    return originalText.split("").map((char, index) => {
      let colorClass = "text-slate-500";

      if (characterStatus[index] === "correct") {
        colorClass = "text-blue-600";
      } else if (characterStatus[index] === "incorrect") {
        colorClass = "text-red-600 font-bold";
      }

      if (index === userInput.length && !gameFinished) {
        colorClass += " border-b-4 border-blue-700";
      }

      return (
        <span key={index} className={`transition duration-100 ${colorClass}`}>
          {char === " "
            ? characterStatus[index] === "incorrect"
              ? "_"
              : "\u00A0"
            : char}
        </span>
      );
    });
  };

  if (loading && !generatedText) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      {showLowAccuracyPopup && (
        <div
          className="fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl font-mono text-sm max-w-sm z-50 animate-slideDownShake"
          style={{
            animation: "slideDown 0.4s ease-out, shake 0.5s ease-in-out 0.4s",
          }}
        >
          {lowAccuracyMessage}
        </div>
      )}

      <style>
        {`
    @keyframes slideDown {
      from { transform: translateY(-100px); opacity: 0;}
      to { transform: translateY(0); opacity: 1;}
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0);}
      10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
      20%, 40%, 60%, 80% { transform: translateX(8px); }
    }
  `}
      </style>
      <h1 className="text-3xl font-bold mb-4 text-blue-900">
        Type Speed Challenge
      </h1>

      <div className="flex gap-4 mb-4 p-4 border-2 border-blue-300 rounded-lg bg-white/90 backdrop-blur items-center shadow-md flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-blue-900">
            Game Mode
          </label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as "time" | "word")}
            className="border-2 border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
            disabled={loading || gameStarted}
          >
            <option value="time">Time Mode</option>
            <option value="word">Word Mode</option>
          </select>
        </div>

        {gameMode === "time" ? (
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-blue-900">
              Duration (s)
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="border-2 border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
              disabled={loading || gameStarted}
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>120s</option>
              <option value={240}>240s</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-blue-900">
              Word Count
            </label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="border-2 border-blue-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
              disabled={loading || gameStarted}
            >
              <option value={15}>15 words</option>
              <option value={30}>30 words</option>
              <option value={60}>60 words</option>
              <option value={120}>120 words</option>
              <option value={240}>240 words</option>
            </select>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || gameStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Loading..." : "Generate Text"}
        </Button>

        <Button
          variant="outline"
          onClick={handleExit}
          className="border-red-400 text-red-700 hover:bg-blue-50 bg-transparent"
        >
          Exit
        </Button>
      </div>

      {generatedText && (
        <div className="flex justify-between items-center mb-4 p-4 border-2 border-blue-300 rounded-lg bg-white/90 backdrop-blur shadow-md">
          <div>
            <span className="text-lg font-semibold text-blue-900">Mode: </span>
            <span className="font-bold text-blue-700">
              {gameMode === "time"
                ? `${timeLimit}s Timer`
                : `${wordCount} Words`}
            </span>
          </div>
          <div>
            {gameMode === "time" ? (
              <>
                <span className="text-lg font-semibold text-blue-900">
                  Time Left:{" "}
                </span>
                <span className="text-2xl font-mono text-blue-700 font-bold">
                  {timeRemaining}s
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-semibold text-blue-900">
                  Progress:{" "}
                </span>
                <span className="text-2xl font-mono text-blue-700 font-bold">
                  {wordsTyped}/{wordCount} words
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-4 bg-white/80 backdrop-blur p-6 rounded-lg border-2 border-blue-300 min-h-[150px] overflow-hidden shadow-md">
        {generatedText ? (
          <div className="text-lg font-mono leading-relaxed tracking-wide whitespace-pre-wrap break-words">
            {renderText()}
          </div>
        ) : (
          <div className="text-blue-400 italic">
            Press "Generate Text" to start the challenge.
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        {gameStarted && !gameFinished && (
          <Button
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className="border-blue-400 text-blue-700 hover:bg-blue-50"
          >
            {isPaused ? "Paused, type again to continue" : "Pause"}
          </Button>
        )}

        {generatedText && (gameStarted || gameFinished) && (
          <Button
            variant="destructive"
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700"
          >
            Reset Game
          </Button>
        )}
      </div>

      <textarea
        className="w-full p-4 border-2 border-blue-300 rounded-lg font-mono resize-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition duration-150 bg-white/90 backdrop-blur shadow-md"
        rows={4}
        placeholder={
          gameStarted
            ? "Keep typing..."
            : "Start typing here to begin the challenge..."
        }
        value={userInput}
        onChange={handleInput}
        disabled={gameFinished || !generatedText}
      />

      {gameFinished && result && (
        <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-400 text-blue-900 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-3 text-blue-800">
            Results (WPM & Accuracy)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <p>
              <strong>Words Per Minute (WPM):</strong> {result.wpm}
            </p>
            <p>
              <strong>Accuracy:</strong> {result.accuracy}%
            </p>
            <p>
              <strong>Correct Characters (Letters Only):</strong>{" "}
              {result.correct_characters}
            </p>
            <p>
              <strong>Incorrect Characters (Typo):</strong>{" "}
              {result.incorrect_characters}
            </p>
            <p>
              <strong>Time Taken:</strong> {result.time_taken}s
            </p>
          </div>
        </div>
      )}
      {gameFinished && !result && (
        <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-400 text-blue-700 rounded-lg shadow-md">
          Calculating results...
        </div>
      )}
    </div>
  );
}
