import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import { formatTime } from "../hooks/useSpeedSortingGame";

interface GameHeaderProps {
  timer: number;
  score: number;
  onExit: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onClickSound?: () => void;
}

export function GameHeader({
  timer,
  score,
  onExit,
  isMuted,
  onToggleMute,
  onClickSound,
}: GameHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    onClickSound?.();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 w-full bg-white/5 backdrop-blur-xl border-b border-cyan-400/20 shadow-[0_8px_40px_-24px_rgba(0,255,255,0.5)]">
      <div className="flex justify-between items-center px-4 sm:px-8 py-4">
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="hidden md:flex text-cyan-100 hover:text-white hover:bg-cyan-500/10"
            onClick={() => {
              onClickSound?.();
              onExit();
            }}
          >
            <ArrowLeft /> Exit Game
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="block md:hidden text-cyan-100 hover:text-white hover:bg-cyan-500/10"
            onClick={() => {
              onClickSound?.();
              onExit();
            }}
          >
            <ArrowLeft />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
            {formatTime(timer)}
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold text-emerald-200">
            <span className="text-emerald-400">✓</span>
            <span>{score}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="p-2 text-cyan-100 hover:text-white hover:bg-cyan-500/10"
            onClick={() => {
              const nextMuted = !isMuted;
              onToggleMute();
              if (!nextMuted) onClickSound?.();
            }}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="p-2 text-cyan-100 hover:text-white hover:bg-cyan-500/10"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
