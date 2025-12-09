import React, { useState, useEffect, useRef } from "react";
import Hole from "./Hole.tsx";
import { playSound } from "../utils/SoundManager.ts";

interface GameBoardProps {
  onExit: () => void;
  gameData?: unknown;
}

const GameBoard: React.FC<GameBoardProps> = ({ onExit }) => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<"enemy" | "trap" | "golden">(
    "enemy",
  );
  const [gameSpeed, setGameSpeed] = useState<number>(1100);

  // --- STATE COMBO ---
  const [combo, setCombo] = useState<number>(0);

  // Ref untuk melacak apakah mole saat ini sudah dipukul (untuk deteksi Miss)
  const isHitRef = useRef<boolean>(false);

  const startGame = () => {
    playSound("start");
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setIsPaused(false);
    setGameSpeed(1100); // Start speed medium
    setActiveIndex(null);
    setCombo(0);
    isHitRef.current = false;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleExitGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    onExit();
  };

  // Timer countdown
  useEffect(() => {
    if (isPlaying && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (isPlaying && timeLeft === 0) {
      playSound("gameover");
      setIsPlaying(false);
      setActiveIndex(null);
    }
  }, [isPlaying, isPaused, timeLeft]);

  // Mole movement logic
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    // Logic Speed Up - Lebih cepat tapi tetap playable
    const newSpeed = Math.max(500, 1100 - score * 18);
    setGameSpeed(newSpeed);

    const moveMole = setInterval(() => {
      // CEK MISS: Kalau mole sebelumnya musuh/golden DAN belum dipukul -> Combo Reset
      if (!isHitRef.current && activeIndex !== null && activeType !== "trap") {
        setCombo(0);
        playSound("break");
      }

      // Reset tracker hit untuk mole baru
      isHitRef.current = false;

      const randomIndex = Math.floor(Math.random() * 9);
      setActiveIndex(randomIndex);

      const chance = Math.random();
      if (chance > 0.9) setActiveType("golden");
      else if (chance > 0.7) setActiveType("trap");
      else setActiveType("enemy");
    }, gameSpeed);

    return () => clearInterval(moveMole);
  }, [isPlaying, isPaused, score, gameSpeed, activeIndex, activeType]);

  const handleWhack = (index: number) => {
    if (!isPlaying || isPaused || index !== activeIndex) return;

    // Tandai sudah dipukul (biar gak dianggap miss)
    isHitRef.current = true;

    // Cek apakah sedang RAMPAGE (Combo >= 5)
    const isRampage = combo >= 5;
    const multiplier = isRampage ? 2 : 1;

    if (activeType === "golden") {
      playSound("golden");
      setScore((prev) => prev + 5 * multiplier);
      setTimeLeft((prev) => prev + 5);
      setCombo((c) => c + 1);
    } else if (activeType === "enemy") {
      playSound("hit");
      setScore((prev) => prev + 1 * multiplier);
      setCombo((c) => {
        const newCombo = c + 1;
        if (newCombo === 5) playSound("rampage");
        return newCombo;
      });
    } else {
      // KENA JEBAKAN
      playSound("error");
      setScore((prev) => Math.max(0, prev - 3));
      setCombo(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto font-['Fredoka'] relative z-10">
      {/* PAUSE BUTTON */}
      {isPlaying && (
        <button
          onClick={togglePause}
          className="fixed top-6 right-6 z-50 group flex items-center gap-3 px-5 py-3 
          bg-slate-900/80 border border-cyan-500/50 text-cyan-400 font-mono text-xs tracking-widest uppercase rounded-sm backdrop-blur-sm
          hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
        </button>
      )}

      {/* HUD SCORE & COMBO */}
      <div className="flex justify-between w-full items-end px-2 gap-4 relative">
        {/* --- COMBO DISPLAY --- */}
        {combo > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-50 pointer-events-none flex flex-col items-center">
            <span
              className={`text-4xl font-black italic tracking-tighter animate-bounce ${combo >= 5 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" : "text-cyan-400"}`}
            >
              {combo}x COMBO
            </span>
            {combo >= 5 && (
              <span className="text-xs font-mono text-red-500 font-bold bg-black/50 px-2 rounded animate-pulse">
                🔥 RAMPAGE MODE (2x SCORE) 🔥
              </span>
            )}
          </div>
        )}

        {/* Score Panel */}
        <div className="flex-1 relative group">
          <div
            className={`absolute -inset-[1px] bg-gradient-to-b ${combo >= 5 ? "from-red-600 via-yellow-500" : "from-yellow-500"} to-transparent rounded opacity-20 transition-all`}
          ></div>
          <div
            className={`relative bg-slate-900/90 border-l-4 ${combo >= 5 ? "border-red-500" : "border-yellow-500"} px-4 py-2 flex justify-between items-center transition-colors`}
          >
            <span className="text-[10px] text-yellow-500/80 font-mono tracking-widest uppercase">
              Bugs
              <br />
              Fixed
            </span>
            <span
              className={`text-4xl font-bold ${combo >= 5 ? "text-red-400 animate-pulse" : "text-white"}`}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Speed Info */}
        <div className="hidden sm:flex flex-col items-center justify-center opacity-50">
          <span className="text-[8px] font-mono text-cyan-400">SPEED</span>
          <span className="text-xs font-mono text-white">{gameSpeed}ms</span>
        </div>

        {/* Time Panel */}
        <div className="flex-1 relative group">
          <div
            className={`absolute -inset-[1px] bg-gradient-to-b ${timeLeft <= 10 ? "from-red-500" : "from-cyan-500"} to-transparent rounded opacity-20`}
          ></div>
          <div
            className={`relative bg-slate-900/90 border-r-4 ${timeLeft <= 10 ? "border-red-500" : "border-cyan-500"} px-4 py-2 flex justify-between items-center text-right`}
          >
            <span
              className={`text-4xl font-bold font-mono ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}
            >
              {timeLeft}
              <span className="text-sm">s</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Time
              <br />
              Left
            </span>
          </div>
        </div>
      </div>

      {/* MAINFRAME BOARD */}
      <div
        className={`relative bg-slate-900/50 p-6 rounded-xl border transition-all duration-300 shadow-2xl backdrop-blur-sm w-full ${combo >= 5 ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]" : "border-slate-700"}`}
      >
        {/* Dekorasi Sudut */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-lg"></div>

        {/* OVERLAY Start/End/Pause */}
        {(!isPlaying || isPaused) && (
          <div className="absolute inset-0 z-20 flex justify-center items-center backdrop-blur-sm bg-slate-950/60 rounded-xl">
            <div className="relative bg-slate-900 border border-slate-600 w-[90%] p-1 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden animate-pop">
              <div
                className={`px-4 py-1 flex justify-between items-center ${timeLeft === 0 ? "bg-red-900/50" : isPaused ? "bg-yellow-900/50" : "bg-cyan-900/50"} border-b border-white/10`}
              >
                <span className="text-[10px] font-mono text-white/70 tracking-widest">
                  {timeLeft === 0
                    ? "⚠️ SYSTEM_FAILURE"
                    : isPaused
                      ? "⏸ PAUSED"
                      : "🛡️ SYSTEM_ALERT"}
                </span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/20"></div>
                </div>
              </div>

              <div className="p-6 flex flex-col items-center text-center relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>

                {isPaused ? (
                  <>
                    <div className="text-5xl mb-4">⏸️</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      GAME PAUSED
                    </h2>
                    <div className="flex gap-3">
                      <button
                        onClick={togglePause}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition"
                      >
                        ▶ RESUME
                      </button>
                      <button
                        onClick={handleExitGame}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition"
                      >
                        EXIT
                      </button>
                    </div>
                  </>
                ) : timeLeft === 0 ? (
                  <>
                    <div className="text-5xl mb-2 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                      💀
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1">
                      GAME OVER
                    </h2>
                    <div className="text-slate-400 text-sm mb-6 font-mono">
                      Final Score:{" "}
                      <span className="text-yellow-400 text-lg font-bold">
                        {score}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-slate-500 mb-4 px-4">
                      <span className="text-green-400 border border-green-900 px-2 rounded">
                        Hit: +1
                      </span>
                      <span className="text-yellow-400 border border-yellow-900 px-2 rounded">
                        Boss: +5
                      </span>
                      <span className="text-red-400 border border-red-900 px-2 rounded">
                        Trap: -3
                      </span>
                      <span className="text-cyan-400 border border-cyan-900 px-2 rounded">
                        5x Combo = 2x Score
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={startGame}
                        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition"
                      >
                        RETRY
                      </button>
                      <button
                        onClick={handleExitGame}
                        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition"
                      >
                        EXIT
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4 animate-bounce">🛡️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      SECURITY BREACH!
                    </h2>
                    <p className="text-slate-400 text-xs mb-6 max-w-[220px]">
                      Hancurkan Robot (🤖). Cari King Ransomware (👺).
                      <br />
                      <span className="text-cyan-400 font-bold">
                        Jaga Combo &gt; 5x untuk Double Score!
                      </span>
                    </p>
                    <button
                      onClick={startGame}
                      className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition"
                    >
                      START GAME
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GRID LUBANG */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {Array.from({ length: 9 }).map((_, index) => (
            <Hole
              key={index}
              isActive={activeIndex === index && isPlaying && !isPaused}
              type={activeType}
              onClick={() => handleWhack(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
