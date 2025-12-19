import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGeneralGameEngine } from "./hooks/useGeneralGameEngine";
import { GameCanvas } from "./components/GameCanvas";
import { PauseModal } from "./components/UI/PauseModal";
import { GameOverModal } from "./components/UI/GameOverModal";
import { Button } from "@/components/ui/button";
import { Pause, Plane, Calculator, Globe, LogOut } from "lucide-react";
import api from "@/api/axios";

import type { GeneralQuestion } from "./types";

const AirplaneGeneralGame = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fetchedQuestions, setFetchedQuestions] = useState<GeneralQuestion[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        if (!id) return;
        const response = await api.get(`/api/game/game-type/airplane/${id}`);
        const gameData = response.data.data;

        console.log("RAW GAME DATA:", gameData);

        let questions: GeneralQuestion[] = [];

        if (gameData.game_json) {
          if (Array.isArray(gameData.game_json)) {
            questions = gameData.game_json;
          } else if (typeof gameData.game_json === "string") {
            try {
              const parsed = JSON.parse(gameData.game_json);
              if (Array.isArray(parsed)) questions = parsed;
            } catch (e) {
              console.error("Failed to parse game_json string", e);
            }
          } else if (typeof gameData.game_json === "object") {
            questions =
              (gameData.game_json as unknown as GeneralQuestion[]) || [];
          }
        }

        console.log("PARSED QUESTIONS:", questions);

        if (questions.length > 0) {
          setFetchedQuestions(questions);
        } else {
          console.warn("Questions array is empty after parsing.");
        }
      } catch (error) {
        console.error("Gagal load game data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id]);

  const {
    gameState,
    score,
    lives,
    question,
    player,
    clouds,
    pauseGame,
    resumeGame,
    startGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    hit,
    successHit,
  } = useGeneralGameEngine(fetchedQuestions);

  const handleExit = async () => {
    try {
      if (id) await api.post(`/api/game/game-type/airplane/${id}/play`);
    } catch (e) {
      console.error("Gagal update play count", e);
    } finally {
      navigate("/");
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin mb-4">
          <Plane className="w-12 h-12 text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold">Mengunduh Misi...</h2>
      </div>
    );
  }

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="bg-sky-500 p-5 rounded-full animate-bounce shadow-[0_0_30px_rgba(14,165,233,0.6)]">
              <Plane className="w-16 h-16 text-white" fill="white" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-2 tracking-wider drop-shadow-md">
            SKY ACE
          </h1>
          <p className="text-sky-200 mb-8 font-medium">
            Pilih Misi Penerbanganmu!
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => startGame("math")}
              className="w-full h-20 text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 border-b-4 border-emerald-800"
            >
              <Calculator className="mr-3 w-8 h-8" />
              Misi Matematika (Random)
            </Button>

            <Button
              disabled={fetchedQuestions.length === 0}
              onClick={() => startGame("general")}
              className="w-full h-20 text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 border-b-4 border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Globe className="mr-3 w-8 h-8" />
              {fetchedQuestions.length > 0
                ? "Misi Kustom (User)"
                : "Tidak Ada Soal"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "loading") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4 select-none">
      <div className="relative rounded-xl shadow-2xl overflow-hidden ring-8 ring-slate-700">
        <GameCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          player={player}
          clouds={clouds}
          hit={hit}
          successHit={successHit}
        />

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
          <div className="flex justify-between items-start p-6">
            <div className="flex flex-col gap-3 pointer-events-auto">
              <div className="bg-white/90 backdrop-blur border-2 border-slate-900 text-slate-900 px-4 py-2 rounded-xl font-black text-xl shadow-lg min-w-[120px]">
                ⭐ {score}
              </div>
              <div className="bg-red-500 text-white border-2 border-red-700 px-4 py-2 rounded-xl font-bold text-xl shadow-lg min-w-[120px]">
                ❤️ {lives}
              </div>
              {gameState === "playing" && (
                <Button
                  size="icon"
                  className="rounded-xl h-12 w-12 bg-amber-400 hover:bg-amber-500 text-slate-900 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 shadow-lg cursor-pointer pointer-events-auto"
                  onClick={pauseGame}
                >
                  <Pause className="h-6 w-6 fill-current" />
                </Button>
              )}
            </div>

            <div className="bg-slate-900/90 text-white border-2 border-sky-400 px-8 py-4 rounded-2xl text-2xl font-bold shadow-[0_0_20px_rgba(56,189,248,0.5)] max-w-xl text-center leading-tight backdrop-blur-md">
              {question?.question || "Loading..."}
            </div>

            <div className="pointer-events-auto">
              <Button
                variant="destructive"
                className="rounded-xl h-12 px-4 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 cursor-pointer shadow-lg"
                onClick={handleExit}
              >
                <LogOut className="mr-2 h-5 w-5" /> Keluar
              </Button>
            </div>
          </div>
        </div>

        {gameState === "paused" && (
          <PauseModal onResume={resumeGame} onExit={handleExit} />
        )}
        {gameState === "gameover" && (
          <GameOverModal
            score={score}
            onExit={handleExit}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
};

export default AirplaneGeneralGame;
