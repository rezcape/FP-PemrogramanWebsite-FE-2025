interface KeyboardProps {
  guessedLetters: string[];
  onGuess: (letter: string) => void;
  disabled: boolean;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const Keyboard: React.FC<KeyboardProps> = ({
  guessedLetters,
  onGuess,
  disabled,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {ALPHABET.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        return (
          <button
            key={letter}
            onClick={() => onGuess(letter)}
            disabled={isGuessed || disabled}
            className={`
              w-8 h-8 text-sm font-semibold rounded transition
              ${
                isGuessed
                  ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white active:scale-95"
              }
              ${disabled && !isGuessed ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
};

export default Keyboard;
