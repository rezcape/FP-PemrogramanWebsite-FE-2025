interface GameStatsProps {
  questionNumber: number;
  totalQuestions: number;
  score: number;
  timeElapsed: number;
  incorrectGuesses: number;
  maxLives: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const GameStats: React.FC<GameStatsProps> = ({
  questionNumber,
  totalQuestions,
  score,
  timeElapsed,
  incorrectGuesses,
  maxLives,
}) => {
  const livesRemaining = maxLives - incorrectGuesses;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
      {/* Score */}
      <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-lg p-3">
        <div className="text-slate-300 text-xs uppercase tracking-wide">
          Score
        </div>
        <div className="text-2xl font-bold text-white">{score}</div>
      </div>

      {/* Lives */}
      <div className="bg-linear-to-br from-red-600 to-red-700 rounded-lg p-3">
        <div className="text-slate-300 text-xs uppercase tracking-wide">
          Lives
        </div>
        <div className="text-2xl font-bold text-white">
          {livesRemaining}/{maxLives}
        </div>
      </div>

      {/* Question Progress */}
      <div className="bg-linear-to-br from-purple-600 to-purple-700 rounded-lg p-3">
        <div className="text-slate-300 text-xs uppercase tracking-wide">
          Question
        </div>
        <div className="text-2xl font-bold text-white">
          {questionNumber}/{totalQuestions}
        </div>
      </div>

      {/* Time */}
      <div className="bg-linear-to-br from-green-600 to-green-700 rounded-lg p-3">
        <div className="text-slate-300 text-xs uppercase tracking-wide">
          Time
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {formatTime(timeElapsed)}
        </div>
      </div>

      {/* Incorrect Guesses */}
      <div className="bg-linear-to-br from-orange-600 to-orange-700 rounded-lg p-3">
        <div className="text-slate-300 text-xs uppercase tracking-wide">
          Mistakes
        </div>
        <div className="text-2xl font-bold text-white">
          {incorrectGuesses}/{maxLives}
        </div>
      </div>
    </div>
  );
};

export default GameStats;
