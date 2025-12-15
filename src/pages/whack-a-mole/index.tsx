import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import GameBoard from "./components/GameBoard.tsx";
import Home from "./components/Home.tsx";
import AnimatedBackground from "./components/AnimatedBackground.tsx";
import NightmareBackground from "./components/NightmareBackground.tsx";
import { useGameAudio } from "./hooks/useGameAudio.ts";
import "./whack-a-mole.css";
import "./nightmare-mode.css";

interface GameData {
  name?: string;
  description?: string;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  time_taken: number | null;
  created_at: string;
  user: {
    username: string;
    profile_picture: string | null;
  } | null;
}

function WhackAMoleGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<"home" | "game">("home");
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNightmareMode, setIsNightmareMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Initialize audio system
  const { isMuted, toggleMute } = useGameAudio({
    isNightmareMode,
    isPlaying,
    isPaused,
    isOnHomeScreen: view === "home", // Pass home screen state
  });

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

  // Handle exit from game board - return to game home screen
  const handleExitGame = async () => {
    if (gameId) {
      try {
        // Note: This endpoint might not exist yet, which is okay
        await api.post(
          `/api/game/game-type/whack-a-mole/${gameId}/play/public`,
        );
      } catch {
        // Silently fail - play count update is not critical for gameplay
        // console.log("Play count update skipped (endpoint may not be implemented)");
      }
    }
    // Stop music and return to game home screen
    setIsPlaying(false);
    setIsPaused(false);
    setShowLeaderboard(false);
    setView("home");
  };

  // Handle score submission
  const handleScoreSubmit = async (score: number, timeLeft: number) => {
    if (!gameId) return;

    try {
      const token = localStorage.getItem("token");
      // Submit score
      await api.post(
        `/api/game/game-type/whack-a-mole/${gameId}/score`,
        {
          score: score,
          time_taken: 30 - timeLeft, // Calculate time taken
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      // Fetch leaderboard
      const response = await api.get(
        `/api/game/game-type/whack-a-mole/${gameId}/leaderboard`,
      );
      setLeaderboard(response.data.data || []);
      setShowLeaderboard(true);
    } catch (error) {
      console.error("Failed to submit score or fetch leaderboard:", error);
      // Still show leaderboard even if score submission fails
      try {
        const response = await api.get(
          `/api/game/game-type/whack-a-mole/${gameId}/leaderboard`,
        );
        setLeaderboard(response.data.data || []);
        setShowLeaderboard(true);
      } catch {
        console.error("Failed to fetch leaderboard");
      }
    }
  };

  // Handle back to main homepage
  const handleBackToHome = () => {
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
    <div
      className={`whack-a-mole-container fixed inset-0 w-full h-full flex flex-col items-center font-['Fredoka'] overflow-y-auto transition-colors duration-700 ${
        isNightmareMode
          ? "bg-red-950 text-red-100 selection:bg-red-600 selection:text-black"
          : "bg-slate-950 text-slate-200 selection:bg-green-500 selection:text-black"
      }`}
    >
      {/* Animated Background Component */}
      <AnimatedBackground />
      <NightmareBackground isActive={isNightmareMode} />

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className={`fixed bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 z-50 group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12
          bg-slate-900/80 border rounded-full backdrop-blur-sm transition-all duration-300 ${
            isNightmareMode
              ? "border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
              : "border-slate-500/50 text-slate-400 hover:bg-slate-700 hover:border-slate-400"
          }`}
        title={isMuted ? "Unmute Music" : "Mute Music"}
      >
        {isMuted ? (
          <span className="text-base sm:text-lg md:text-xl">🔇</span>
        ) : (
          <span className="text-base sm:text-lg md:text-xl">🔊</span>
        )}
      </button>

      {/* Content Container dengan padding untuk scroll */}
      <div className="relative z-10 w-full flex flex-col items-center py-6 sm:py-8 md:py-12 px-2 sm:px-3 md:px-4 min-h-full">
        {/* --- LOGIKA PERPINDAHAN HALAMAN --- */}
        {view === "home" ? (
          <>
            {/* BACK TO MAIN HOMEPAGE BUTTON */}
            <button
              onClick={handleBackToHome}
              className="fixed top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 z-50 group flex items-center gap-1 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-3 
            bg-slate-900/80 border border-slate-500/50 text-slate-400 font-mono text-[9px] sm:text-[10px] md:text-xs tracking-wider sm:tracking-widest uppercase rounded-sm backdrop-blur-sm
            hover:bg-slate-700 hover:text-white hover:border-slate-400 transition-all duration-300"
            >
              <span className="text-xs sm:text-sm md:text-lg group-hover:-translate-x-1 transition-transform">
                ←
              </span>
              <span className="hidden sm:inline">BACK_TO_HOME</span>
              <span className="inline sm:hidden">BACK</span>
            </button>

            <Home
              onStart={() => {
                setView("game");
                // isPlaying will be set by GameBoard's startGame()
              }}
              gameData={gameData ?? undefined}
              isNightmareMode={isNightmareMode}
              onToggleMode={() => setIsNightmareMode(!isNightmareMode)}
            />
          </>
        ) : (
          <>
            {/* EXIT BUTTON (FIXED POSITION) - Return to game home */}
            <button
              onClick={handleExitGame}
              className="fixed top-6 left-6 z-50 group flex items-center gap-3 px-5 py-3 
            bg-slate-900/80 border border-red-500/50 text-red-400 font-mono text-xs tracking-widest uppercase rounded-sm backdrop-blur-sm
            hover:bg-red-500 hover:text-black hover:border-red-500 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              <span className="text-lg group-hover:-translate-x-1 transition-transform">
                «
              </span>
              EXIT_GAME
            </button>

            <GameBoard
              onExit={handleExitGame}
              gameData={gameData ?? undefined}
              isNightmareMode={isNightmareMode}
              isPlaying={isPlaying}
              isPaused={isPaused}
              onPlayingChange={setIsPlaying}
              onPausedChange={setIsPaused}
              gameId={gameId}
              onScoreSubmit={handleScoreSubmit}
            />

            {/* Leaderboard Overlay */}
            {showLeaderboard && leaderboard.length > 0 && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center">
                    🏆 LEADERBOARD
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border border-slate-700"
                      >
                        <span className="text-xl font-bold text-slate-400 w-8">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="text-white font-semibold">
                            {entry.user?.username || "Anonymous"}
                          </div>
                          <div className="text-xs text-slate-400">
                            Score: {entry.score} | Time:{" "}
                            {entry.time_taken ? `${entry.time_taken}s` : "N/A"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="mt-4 w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            )}
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
