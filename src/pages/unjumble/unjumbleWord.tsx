import { Button } from "@/components/ui/button";
import { type MouseEventHandler } from "react";

// --- Interface Props ---
interface UnjumbleWordProps {
  word: string;

  onClick: MouseEventHandler<HTMLButtonElement>;

  isActive?: boolean;
}

export default function UnjumbleWord({
  word,
  onClick,
  isActive = false,
}: UnjumbleWordProps) {
  const tileVariant = isActive ? "default" : "outline";

  const tileClass = isActive
    ? "m-1 p-4 text-base sm:text-lg shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200"
    : "m-1 p-4 text-base sm:text-lg shadow-md hover:bg-gray-100 transition-all duration-200";

  return (
    <Button
      onClick={onClick}
      variant={tileVariant}
      className={tileClass}
      style={{
        cursor: "pointer",
        transform: "scale(1)",
      }}
    >
      {word}
    </Button>
  );
}
