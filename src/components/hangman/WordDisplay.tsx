interface WordDisplayProps {
  word: string;
  guessedLetters: string[];
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  word,
  guessedLetters,
}) => {
  const displayWord = word
    .toUpperCase()
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl font-bold text-white tracking-widest font-mono">
        {displayWord}
      </div>
      <div className="text-slate-400 text-sm">
        {guessedLetters.length} letter{guessedLetters.length !== 1 ? "s" : ""}{" "}
        guessed
      </div>
    </div>
  );
};

export default WordDisplay;
