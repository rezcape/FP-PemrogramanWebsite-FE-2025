import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, RotateCcw, Trophy } from "lucide-react";

interface GameOverModalProps {
  score: number;
  onExit: () => void;
  onRestart: () => void;
}

export const GameOverModal = ({
  score,
  onExit,
  onRestart,
}: GameOverModalProps) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-[450px] p-8 flex flex-col items-center gap-8 animate-in zoom-in-95 border-destructive/50">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-black text-destructive uppercase tracking-widest">
            Game Over
          </h2>
          <p className="text-muted-foreground text-lg">Good effort!</p>
        </div>

        <div className="flex flex-col items-center bg-secondary/50 p-6 rounded-xl w-full">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Final Score
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <span className="text-5xl font-black text-primary">{score}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button
            size="lg"
            onClick={onRestart}
            className="w-full text-lg font-bold"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Play Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onExit}
            className="w-full text-lg font-bold"
          >
            <LogOut className="mr-2 h-5 w-5" /> Exit
          </Button>
        </div>
      </Card>
    </div>
  );
};
