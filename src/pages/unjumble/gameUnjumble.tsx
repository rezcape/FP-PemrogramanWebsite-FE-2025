import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UnjumbleWord from "./unjumbleWord";
import SentenceArea from "./sentence";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// --- Tipe Data ---
interface Word {
  id: number;
  text: string;
  isShuffled: boolean;
  clickOrder?: number;
}

interface Question {
  id: number;
  words: Word[];
  correctOrder: string[]; // Urutan kata yang benar
  correctAnswer: string; // Kalimat yang benar
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    words: [
      { id: 1, text: "Can", isShuffled: true },
      { id: 2, text: "she", isShuffled: true },
      { id: 3, text: "play", isShuffled: true },
      { id: 4, text: "the", isShuffled: true },
      { id: 5, text: "violin", isShuffled: true },
      { id: 6, text: "?", isShuffled: true },
    ],
    correctOrder: ["Can", "she", "play", "the", "violin", "?"],
    correctAnswer: "Can she play the violin ?",
  },
  {
    id: 2,
    words: [
      { id: 1, text: "Although", isShuffled: true },
      { id: 2, text: "it", isShuffled: true },
      { id: 3, text: "was", isShuffled: true },
      { id: 4, text: "raining", isShuffled: true },
      { id: 5, text: "he", isShuffled: true },
      { id: 6, text: "went", isShuffled: true },
      { id: 7, text: "to", isShuffled: true },
      { id: 8, text: "the", isShuffled: true },
      { id: 9, text: "market", isShuffled: true },
      { id: 10, text: ".", isShuffled: true },
    ],
    correctOrder: [
      "Although",
      "it",
      "was",
      "raining",
      "he",
      "went",
      "to",
      "the",
      "market",
      ".",
    ],
    correctAnswer: "Although it was raining he went to the market .",
  },
  {
    id: 3,
    words: [
      { id: 1, text: "If", isShuffled: true },
      { id: 2, text: "you", isShuffled: true },
      { id: 3, text: "had", isShuffled: true },
      { id: 4, text: "studied", isShuffled: true },
      { id: 5, text: "harder", isShuffled: true },
      { id: 6, text: ",", isShuffled: true },
      { id: 7, text: "you", isShuffled: true },
      { id: 8, text: "would", isShuffled: true },
      { id: 9, text: "have", isShuffled: true },
      { id: 10, text: "passed", isShuffled: true },
      { id: 11, text: ".", isShuffled: true },
    ],
    correctOrder: [
      "If",
      "you",
      "had",
      "studied",
      "harder",
      ",",
      "you",
      "would",
      "have",
      "passed",
      ".",
    ],
    correctAnswer: "If you had studied harder , you would have passed .",
  },
  {
    id: 4,
    words: [
      { id: 1, text: "Despite", isShuffled: true },
      { id: 2, text: "the", isShuffled: true },
      { id: 3, text: "fact", isShuffled: true },
      { id: 4, text: "that", isShuffled: true },
      { id: 5, text: "she", isShuffled: true },
      { id: 6, text: "was", isShuffled: true },
      { id: 7, text: "tired", isShuffled: true },
      { id: 8, text: ",", isShuffled: true },
      { id: 9, text: "she", isShuffled: true },
      { id: 10, text: "finished", isShuffled: true },
      { id: 11, text: "her", isShuffled: true },
      { id: 12, text: "homework", isShuffled: true },
      { id: 13, text: ".", isShuffled: true },
    ],
    correctOrder: [
      "Despite",
      "the",
      "fact",
      "that",
      "she",
      "was",
      "tired",
      ",",
      "she",
      "finished",
      "her",
      "homework",
      ".",
    ],
    correctAnswer:
      "Despite the fact that she was tired , she finished her homework .",
  },
];

const GAME_SLUG = "unjumble-sentence"; // Slug unik untuk game ini

// --- Komponen Utama ---

export default function Unjumble() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [words, setWords] = useState<Word[]>(
    [...QUESTIONS[0].words].sort(() => Math.random() - 0.5),
  );
  const [isGameActive, setIsGameActive] = useState(true);
  const [clickCounter, setClickCounter] = useState(0);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  /**
   * @description Validasi apakah jawaban benar
   */
  const validateAnswer = useCallback(() => {
    const playerAnswer = words
      .filter((w) => !w.isShuffled)
      .sort((a, b) => (a.clickOrder || 0) - (b.clickOrder || 0))
      .map((w) => w.text)
      .join(" ");

    const isCorrect = playerAnswer === currentQuestion.correctAnswer;
    return isCorrect;
  }, [words, currentQuestion.correctAnswer]);

  /**
   * @description Menangani pemindahan kata antara area acak dan area tersusun saat diklik.
   */
  const handleWordClick = useCallback(
    (id: number) => {
      if (!isGameActive) return;

      setWords((prevWords) =>
        prevWords.map((word) => {
          if (word.id === id) {
            if (word.isShuffled) {
              setClickCounter((prev) => prev + 1);
              return {
                ...word,
                isShuffled: false,
                clickOrder: clickCounter + 1,
              };
            } else {
              return {
                ...word,
                isShuffled: true,
                clickOrder: undefined,
              };
            }
          }
          return word;
        }),
      );
    },
    [isGameActive, clickCounter],
  );

  /**
   * @description Lanjut ke soal berikutnya atau selesai
   */
  const handleNextQuestion = useCallback(() => {
    const isCorrect = validateAnswer();

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      // Ada soal berikutnya
      const nextQuestion = QUESTIONS[currentQuestionIndex + 1];
      setCurrentQuestionIndex((prev) => prev + 1);
      setWords([...nextQuestion.words].sort(() => Math.random() - 0.5));
      setClickCounter(0);
    } else {
      // Game selesai
      setGameEnded(true);
    }
  }, [currentQuestionIndex, validateAnswer]);

  /**
   * @description Keluar dari game
   */
  const handleExitGame = useCallback(async () => {
    setIsGameActive(false);

    try {
      await fetch("http://localhost:4000/api/game/increment-playcount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameSlug: GAME_SLUG,
          userId: "current_user_id",
        }),
      });
      console.log(
        `POST Request berhasil: Play count untuk ${GAME_SLUG} bertambah.`,
      );
    } catch (error) {
      console.error("Gagal mengirim play count:", error);
    }

    navigate("/");
  }, [navigate]);

  const shuffledWords = words.filter((w) => w.isShuffled);
  const sortedSentenceWords = words
    .filter((w) => !w.isShuffled)
    .sort((a, b) => (a.clickOrder || 0) - (b.clickOrder || 0));

  // --- Screen: Game Selesai ---
  if (gameEnded) {
    const totalQuestions = QUESTIONS.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="flex flex-col min-h-screen p-4 bg-gradient-to-b from-indigo-100 to-indigo-50 justify-center items-center">
        <Card className="w-full max-w-md p-8 text-center shadow-2xl">
          <CardHeader>
            <h1 className="text-4xl font-bold text-indigo-700 mb-4">
              🎉 Game Selesai!
            </h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-6xl font-bold text-indigo-600">
                {percentage}%
              </div>
              <div className="text-2xl font-semibold text-gray-700">
                Skor: {score} / {totalQuestions}
              </div>
              <p className="text-gray-700 text-lg">
                {percentage >= 90
                  ? "Wah, juara! 🏆 Kamu keren banget!"
                  : percentage >= 70
                    ? "Keren! Terus ya, makin jago! 🎉"
                    : percentage >= 50
                      ? "Not bad — latihan sedikit lagi pasti naik! 💪"
                      : "Ayo coba lagi, yuk semangat! 🔁"}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setWords(
                    [...QUESTIONS[0].words].sort(() => Math.random() - 0.5),
                  );
                  setClickCounter(0);
                  setScore(0);
                  setGameEnded(false);
                  setIsGameActive(true);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Mainkan Lagi
              </Button>
              <Button
                onClick={handleExitGame}
                variant="outline"
                className="flex-1"
              >
                Kembali ke Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-100">
      <header className="flex justify-between items-center p-4 bg-white shadow-md rounded-lg mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
            <span>🧩</span>
            <span>Unjumble — Yuk Susun, Seru Banget! 🎉</span>
          </h1>
          <p className="text-sm text-indigo-600 mt-1 italic">
            Soal {currentQuestionIndex + 1} dari {QUESTIONS.length} — Pilih kata
            dan susun kalimat yang benar
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <span className="text-sm text-gray-600">Score</span>
            <span className="text-2xl font-bold text-indigo-600 block">
              {score}
            </span>
          </div>

          <Button
            variant="destructive"
            onClick={handleExitGame}
            disabled={!isGameActive}
            className="shadow-lg"
          >
            Keluar
          </Button>
        </div>
      </header>

      <main className="grow space-y-8">
        {/* --- Area Kalimat Tersusun --- */}
        <Card className="p-6">
          <CardHeader>
            <h2 className="text-xl font-semibold mb-2">
              Susun Kalimat di Bawah Ini:
            </h2>
          </CardHeader>
          <CardContent>
            <SentenceArea
              words={sortedSentenceWords}
              onWordClick={handleWordClick}
            />
          </CardContent>
        </Card>

        {/* --- Area Kata Acak --- */}
        <Card className="p-6">
          <CardHeader>
            <h2 className="text-xl font-semibold mb-2">Pilih Kata-kata:</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 justify-center">
            {shuffledWords.map((word) => (
              <UnjumbleWord
                key={word.id}
                word={word.text}
                onClick={() => handleWordClick(word.id)}
              />
            ))}
          </CardContent>
        </Card>

        {/* --- Tombol Next --- */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleNextQuestion}
            className="bg-green-600 hover:bg-green-700 px-8 py-2 text-lg"
            disabled={sortedSentenceWords.length === 0}
          >
            Yuk Cek! 🎯
          </Button>
        </div>
      </main>

      <footer className="mt-6 text-center text-gray-500">
        <p>Proyek Pemrograman Web - Template Game Unjumble</p>
      </footer>
    </div>
  );
}
