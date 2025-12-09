import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import GameBoard from "./components/GameBoard.tsx";
import Home from "./components/Home.tsx";

interface GameData {
  name?: string;
  description?: string;
}

function WhackAMoleGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<"home" | "game">("home");
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch game data from backend
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        // Use the correct whack-a-mole specific endpoint
        const response = await api.get(
          `/api/game/game-type/whack-a-mole/${gameId}/play/public`,
        );
        setGameData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch game data:", error);
        // Set dummy data for testing if fetch fails
        setGameData({
          name: "Whack-a-Robo (Test Mode)",
          description: "Test mode - Backend not connected",
        });
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGameData();
    } else {
      // Allow testing without gameId
      setGameData({
        name: "Whack-a-Robo (Demo)",
        description: "Demo mode - No backend required",
      });
      setLoading(false);
    }
  }, [gameId]);

  // Handle exit - increment play count and navigate to home
  const handleExit = async () => {
    if (gameId) {
      try {
        await api.post(
          `/api/game/game-type/whack-a-mole/${gameId}/play/public`,
        );
      } catch (error) {
        console.error("Failed to update play count:", error);
      }
    }
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-green-500 font-mono text-lg animate-pulse">
          LOADING GAME DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="whack-a-mole-container fixed inset-0 w-full h-full bg-slate-950 flex flex-col items-center font-['Fredoka'] text-slate-200 overflow-y-auto selection:bg-green-500 selection:text-black">
      {/* Background Grid Pattern - Fixed */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Efek Vignette - Fixed */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none"></div>

      {/* Content Container dengan padding untuk scroll */}
      <div className="relative z-10 w-full flex flex-col items-center py-12 px-4 min-h-full">
        {/* --- LOGIKA PERPINDAHAN HALAMAN --- */}
        {view === "home" ? (
          <Home
            onStart={() => setView("game")}
            gameData={gameData ?? undefined}
          />
        ) : (
          <>
            {/* EXIT BUTTON (FIXED POSITION) */}
            <button
              onClick={handleExit}
              className="fixed top-6 left-6 z-50 group flex items-center gap-3 px-5 py-3 
            bg-slate-900/80 border border-red-500/50 text-red-400 font-mono text-xs tracking-widest uppercase rounded-sm backdrop-blur-sm
            hover:bg-red-500 hover:text-black hover:border-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              <span className="text-lg group-hover:-translate-x-1 transition-transform">
                «
              </span>
              EXIT_GAME // HOME
            </button>

            <GameBoard onExit={handleExit} gameData={gameData ?? undefined} />
          </>
        )}

        {/* Footer */}
        <p className="fixed bottom-4 text-slate-600 text-[10px] font-mono opacity-50 z-10 pointer-events-none">
          SECURE_CONNECTION_ESTABLISHED | WORDIT_GAME_SYSTEM
        </p>
      </div>
    </div>
  );
}

export default WhackAMoleGame;
