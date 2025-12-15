import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface Word {
  id: number;
  text: string;
  isShuffled: boolean;
  clickOrder?: number;
}

interface Sentence {
  sentence_text: string;
  sentence_image: string | null;
}

interface UnjumbleGame {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string | null;
  score_per_sentence: number;
  is_randomized: boolean;
  sentences: Sentence[];
}

export default function PlayUnjumble() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState<UnjumbleGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [isGameActive, setIsGameActive] = useState(true);
  const [clickCounter, setClickCounter] = useState(0);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/api/game/game-type/unjumble/${id}/play/public`,
        );
        const gameData = response.data.data;
        setGame(gameData);

        // Initialize first sentence
        if (gameData.sentences && gameData.sentences.length > 0) {
          initializeSentence(gameData.sentences[0].sentence_text);
        }
      } catch (err) {
        console.error("Failed to load unjumble game:", err);
        toast.error("Failed to load game");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id, navigate]);

  const initializeSentence = (sentenceText: string) => {
    const wordsArray = sentenceText.split(" ").map((word, index) => ({
      id: index,
      text: word,
      isShuffled: true,
      clickOrder: undefined,
    }));

    // Shuffle words
    const shuffled = [...wordsArray].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setClickCounter(0);
  };

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

  const validateAnswer = useCallback(() => {
    if (!game) return false;

    const currentSentence = game.sentences[currentSentenceIndex];

    // Construct player answer
    const playerAnswer = words
      .filter((w) => !w.isShuffled)
      .sort((a, b) => (a.clickOrder || 0) - (b.clickOrder || 0))
      .map((w) => w.text)
      .join(" ");

    // Normalize both strings: trim and collapse multiple spaces to single space
    const normalizedPlayer = playerAnswer.trim().replace(/\s+/g, " ");
    const normalizedTarget = currentSentence.sentence_text
      .trim()
      .replace(/\s+/g, " ");

    const isCorrect = normalizedPlayer === normalizedTarget;

    if (!isCorrect) {
      console.log(
        `Validation Failed: Expected '[${normalizedTarget}]', Got '[${normalizedPlayer}]'`,
      );
    }

    return isCorrect;
  }, [words, game, currentSentenceIndex]);

  const handleNextSentence = useCallback(() => {
    if (!game) return;

    const isCorrect = validateAnswer();
    const pts = Number(game.score_per_sentence) || 10;

    if (isCorrect) {
      setScore((prev) => prev + pts);
      toast.success(`Correct! +${pts} pts 🎉`);
    } else {
      toast.error("Incorrect. Moving to next sentence.");
    }

    if (currentSentenceIndex < game.sentences.length - 1) {
      // Next sentence
      const nextSentence = game.sentences[currentSentenceIndex + 1];
      setCurrentSentenceIndex((prev) => prev + 1);
      initializeSentence(nextSentence.sentence_text);
    } else {
      // Game ended
      setGameEnded(true);
      setIsGameActive(false);
    }
  }, [currentSentenceIndex, game, validateAnswer]);

  const shuffledWords = words.filter((w) => w.isShuffled);
  const sortedSentenceWords = words
    .filter((w) => !w.isShuffled)
    .sort((a, b) => (a.clickOrder || 0) - (b.clickOrder || 0));

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3">Loading game...</Typography>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Typography variant="h3" className="text-destructive">
          Game not found
        </Typography>
      </div>
    );
  }

  if (gameEnded) {
    const totalSentences = game.sentences.length;
    const maxScore = totalSentences * game.score_per_sentence;
    const percentage = Math.round((score / maxScore) * 100);

    return (
      <div className="flex flex-col min-h-screen p-4 bg-linear-to-b from-indigo-100 to-indigo-50 justify-center items-center">
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
                Skor: {score} / {maxScore}
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
                onClick={() => window.location.reload()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                Mainkan Lagi
              </Button>
              <Button
                onClick={() => navigate("/")}
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
            <span>🧩Unjumble </span>
            <span>{game.name}</span>
          </h1>
          <p className="text-sm text-indigo-600 mt-1 italic">
            Sentence {currentSentenceIndex + 1} of {game.sentences.length} —
            Arrange the words correctly
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
            variant="outline"
            onClick={() => navigate("/")}
            className="shadow-lg"
          >
            <ArrowLeft className="mr-2" />
            Exit
          </Button>
        </div>
      </header>

      <main className="grow space-y-8">
        {/* Sentence Area */}
        <Card className="p-6">
          <CardHeader>
            <h2 className="text-xl font-semibold mb-2">
              Arrange the Sentence:
            </h2>
          </CardHeader>
          <CardContent>
            <div className="min-h-20 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-wrap gap-2">
              {sortedSentenceWords.map((word) => (
                <button
                  key={word.id}
                  onClick={() => handleWordClick(word.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  {word.text}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Words Area */}
        <Card className="p-6">
          <CardHeader>
            <h2 className="text-xl font-semibold mb-2">Pick Words:</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 justify-center">
            {shuffledWords.map((word) => (
              <button
                key={word.id}
                onClick={() => handleWordClick(word.id)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors font-medium"
              >
                {word.text}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Next Button */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleNextSentence}
            className="bg-green-600 hover:bg-green-700 px-8 py-2 text-lg"
            disabled={sortedSentenceWords.length === 0}
          >
            Check Answer 🎯
          </Button>
        </div>
      </main>
    </div>
  );
}
