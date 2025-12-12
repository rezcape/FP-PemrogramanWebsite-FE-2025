import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, LogOut } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import api from "@/api/axios";

// Helper convert detik ke MM:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function PlayCrossword() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Hapus setIsPlaying karena tidak digunakan di kode saat ini
  const [isPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // LOGIC EXIT BUTTON
  const handleExit = async () => {
    try {
      setIsPaused(true);
      await api.post("/api/game/play-count", { game_id: id });
    } catch (error) {
      console.error("Error logging play count", error);
    } finally {
      navigate("/");
    }
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="destructive" size="sm" onClick={handleExit}>
            <LogOut className="w-4 h-4 mr-2" /> Exit Game
          </Button>

          <div className="text-xl font-mono font-bold bg-slate-100 px-3 py-1 rounded">
            {formatTime(timer)}
          </div>
        </div>

        <Button variant="outline" size="icon" onClick={handleTogglePause}>
          {isPaused ? (
            <Play className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 p-6 flex justify-center">
        {isPaused ? (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl text-center space-y-4">
              <Typography variant="h2">Game Paused</Typography>
              <Button size="lg" onClick={handleTogglePause}>
                Resume
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border p-6 min-h-[500px]">
            <Typography
              variant="h2"
              className="text-center text-slate-400 mt-20"
            >
              Crossword Grid Goes Here
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}
