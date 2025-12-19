import type { MathQuestion } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart, Trophy } from "lucide-react";

interface HUDProps {
  score: number;
  lives: number;
  question: MathQuestion | null;
}

export const HUD = ({ score, lives, question }: HUDProps) => {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
      {/* Stats */}
      <div className="flex gap-4">
        <Badge
          variant="secondary"
          className="text-lg px-4 py-2 flex gap-2 items-center"
        >
          <Trophy className="w-5 h-5 text-yellow-500" />
          {score}
        </Badge>
        <Badge
          variant="destructive"
          className="text-lg px-4 py-2 flex gap-2 items-center"
        >
          <Heart className="w-5 h-5 fill-current" />
          {lives}
        </Badge>
      </div>
      {/* Question */}
      {question && (
        <Card className="px-8 py-4 bg-white/90 shadow-lg border-2 border-primary">
          <h2 className="text-3xl font-bold text-primary tracking-wider">
            {question.question} = ?
          </h2>
        </Card>
      )}
      <div className="w-[100px]"></div> {/* Spacer for balance if needed */}
    </div>
  );
};
