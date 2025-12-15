import { Heart } from "lucide-react";

interface HangmanFigureProps {
  incorrectGuesses: number;
}

const MAX_LIVES = 5;

export const HangmanFigure: React.FC<HangmanFigureProps> = ({
  incorrectGuesses,
}) => {
  const livesRemaining = MAX_LIVES - incorrectGuesses;

  // Simple SVG hangman stages
  const renderHangman = () => {
    if (incorrectGuesses === 0) {
      return (
        <svg
          width="200"
          height="250"
          viewBox="0 0 200 250"
          className="text-white"
        >
          {/* Gallows */}
          <line
            x1="10"
            y1="230"
            x2="150"
            y2="230"
            stroke="currentColor"
            strokeWidth="4"
          />
          <line
            x1="50"
            y1="230"
            x2="50"
            y2="20"
            stroke="currentColor"
            strokeWidth="4"
          />
          <line
            x1="50"
            y1="20"
            x2="130"
            y2="20"
            stroke="currentColor"
            strokeWidth="4"
          />
          <line
            x1="130"
            y1="20"
            x2="130"
            y2="50"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      );
    }

    return (
      <svg
        width="200"
        height="250"
        viewBox="0 0 200 250"
        className="text-white"
      >
        {/* Gallows */}
        <line
          x1="10"
          y1="230"
          x2="150"
          y2="230"
          stroke="currentColor"
          strokeWidth="4"
        />
        <line
          x1="50"
          y1="230"
          x2="50"
          y2="20"
          stroke="currentColor"
          strokeWidth="4"
        />
        <line
          x1="50"
          y1="20"
          x2="130"
          y2="20"
          stroke="currentColor"
          strokeWidth="4"
        />
        <line
          x1="130"
          y1="20"
          x2="130"
          y2="50"
          stroke="currentColor"
          strokeWidth="4"
        />

        {/* Head */}
        {incorrectGuesses >= 1 && (
          <circle
            cx="130"
            cy="70"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        )}

        {/* Body */}
        {incorrectGuesses >= 2 && (
          <line
            x1="130"
            y1="90"
            x2="130"
            y2="150"
            stroke="currentColor"
            strokeWidth="4"
          />
        )}

        {/* Left arm */}
        {incorrectGuesses >= 3 && (
          <line
            x1="130"
            y1="110"
            x2="100"
            y2="130"
            stroke="currentColor"
            strokeWidth="4"
          />
        )}

        {/* Right arm */}
        {incorrectGuesses >= 4 && (
          <line
            x1="130"
            y1="110"
            x2="160"
            y2="130"
            stroke="currentColor"
            strokeWidth="4"
          />
        )}

        {/* Left leg */}
        {incorrectGuesses >= 5 && (
          <>
            <line
              x1="130"
              y1="150"
              x2="110"
              y2="180"
              stroke="currentColor"
              strokeWidth="4"
            />
            <line
              x1="130"
              y1="150"
              x2="150"
              y2="180"
              stroke="currentColor"
              strokeWidth="4"
            />
          </>
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Hangman Figure */}
      <div className="relative w-full max-w-sm h-64 flex items-center justify-center">
        {renderHangman()}
      </div>

      {/* Lives Display with Hearts */}
      <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
        <span className="text-white font-semibold text-sm mr-2">Lives:</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all ${
                i < livesRemaining
                  ? "fill-red-500 text-red-500 animate-pulse"
                  : "fill-slate-600 text-slate-600 opacity-30"
              }`}
            />
          ))}
        </div>
        <span className="text-white text-sm font-mono ml-2">
          {livesRemaining}/{MAX_LIVES}
        </span>
      </div>
    </div>
  );
};

export default HangmanFigure;
