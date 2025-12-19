import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, LogOut } from "lucide-react";

interface PauseModalProps {
  onResume: () => void;
  onExit: () => void;
}

export const PauseModal = ({ onResume, onExit }: PauseModalProps) => {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-[400px] p-8 flex flex-col items-center gap-6 animate-in zoom-in-95">
        <h2 className="text-4xl font-black text-primary uppercase tracking-widest">
          Paused
        </h2>

        <div className="flex flex-col gap-4 w-full">
          <Button
            size="lg"
            onClick={onResume}
            className="w-full text-lg font-bold"
          >
            <Play className="mr-2 h-5 w-5" /> Resume Game
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onExit}
            className="w-full text-lg font-bold text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-5 w-5" /> Exit Game
          </Button>
        </div>
      </Card>
    </div>
  );
};
