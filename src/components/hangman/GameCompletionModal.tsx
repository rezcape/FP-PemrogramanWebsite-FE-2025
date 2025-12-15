import { Trophy, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameCompletionModalProps {
  isOpen: boolean;
  isWon: boolean;
  score: number;
  timeElapsed: number;
  totalQuestions: number;
  correctAnswers: number;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
  onShowAnswers: () => void;
  onClose: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  isOpen,
  isWon,
  score,
  timeElapsed,
  totalQuestions,
  correctAnswers,
  onPlayAgain,
  onLeaderboard,
  onShowAnswers,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 rounded-2xl">
      <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90%] overflow-y-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy
              className={`w-6 h-6 ${isWon ? "text-yellow-400" : "text-red-400"}`}
            />
            <h2 className="text-2xl font-bold text-white">
              {isWon ? "Game Complete! 🎉" : "Game Over 💀"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-600 rounded-lg p-4 text-center">
              <div className="text-slate-300 text-sm uppercase">Score</div>
              <div className="text-3xl font-bold text-white">{score}</div>
            </div>
            <div className="bg-green-600 rounded-lg p-4 text-center">
              <div className="text-slate-300 text-sm uppercase">Time</div>
              <div className="text-3xl font-bold text-white font-mono">
                {formatTime(timeElapsed)}
              </div>
            </div>
            <div className="bg-purple-600 rounded-lg p-4 text-center">
              <div className="text-slate-300 text-sm uppercase">Correct</div>
              <div className="text-3xl font-bold text-white">
                {correctAnswers}/{totalQuestions}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-center text-slate-300">
            <p className="text-sm">
              Accuracy:{" "}
              <span className="font-bold text-white">
                {Math.round((correctAnswers / totalQuestions) * 100)}%
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onPlayAgain}
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onShowAnswers}
                variant="outline"
                className="gap-2 bg-white text-slate-800 border-slate-600 hover:bg-slate-200 hover:scale-105 transition-transform"
              >
                Show Answers
              </Button>
              <Button
                onClick={onLeaderboard}
                variant="outline"
                className="gap-2 bg-white text-slate-800 border-slate-600 hover:bg-slate-200 hover:scale-105 transition-transform"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCompletionModal;
