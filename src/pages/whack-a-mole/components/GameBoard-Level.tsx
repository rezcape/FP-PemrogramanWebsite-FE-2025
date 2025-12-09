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
  const [activeType, setActiveType] = useState<
    "enemy" | "trap" | "golden" | "phishing" | "boss"
  >("enemy");
  const [gameSpeed, setGameSpeed] = useState<number>(1100);

  // --- STATE COMBO ---
  const [combo, setCombo] = useState<number>(0);

  // --- STATE LEVEL SYSTEM ---
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [levelComplete, setLevelComplete] = useState<boolean>(false);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [bonusActive, setBonusActive] = useState<boolean>(false);
  const [bossHealth, setBossHealth] = useState<number>(0);
  const [showLevelTransition, setShowLevelTransition] =
    useState<boolean>(false);

  // Ref untuk melacak apakah mole saat ini sudah dipukul
  const isHitRef = useRef<boolean>(false);
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Level requirements
  const LEVEL_REQUIREMENTS = {
    1: 30, // Level 1: 30 poin
    2: 70, // Level 2: 70 poin total
    3: 120, // Level 3: 120 poin untuk win
  };

  const LEVEL_INFO = {
    1: { name: "DATA BREACH", desc: "Eliminate basic threats", color: "cyan" },
    2: {
      name: "PHISHING ATTACK",
      desc: "Beware of imposters!",
      color: "yellow",
    },
    3: { name: "BOSS RAID", desc: "Defeat the mega threat!", color: "red" },
  };

  // Check level completion
  useEffect(() => {
    if (!isPlaying || gameComplete) return;

    if (
      currentLevel === 1 &&
      score >= LEVEL_REQUIREMENTS[1] &&
      !levelComplete
    ) {
      setLevelComplete(true);
      setShowLevelTransition(true);
      playSound("golden");
      setTimeout(() => {
        setCurrentLevel(2);
        setLevelComplete(false);
        setTimeLeft(30);
        setShowLevelTransition(false);
      }, 3000);
    } else if (
      currentLevel === 2 &&
      score >= LEVEL_REQUIREMENTS[2] &&
      !levelComplete
    ) {
      setLevelComplete(true);
      setShowLevelTransition(true);
      playSound("golden");
      setTimeout(() => {
        setCurrentLevel(3);
        setLevelComplete(false);
        setTimeLeft(30);
        setShowLevelTransition(false);
      }, 3000);
    } else if (currentLevel === 3 && score >= LEVEL_REQUIREMENTS[3]) {
      setGameComplete(true);
      setIsPlaying(false);
      playSound("golden");
    }
  }, [
    score,
    currentLevel,
    isPlaying,
    levelComplete,
    gameComplete,
    LEVEL_REQUIREMENTS,
  ]);

  // Level 1 Bonus: Data Leak (Auto bonus setelah 15 detik)
  useEffect(() => {
    if (
      currentLevel === 1 &&
      isPlaying &&
      !isPaused &&
      timeLeft === 15 &&
      !bonusActive
    ) {
      setBonusActive(true);
      playSound("start");

      bonusTimerRef.current = setTimeout(() => {
        setBonusActive(false);
      }, 5000); // Bonus 5 detik
    }

    return () => {
      if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    };
  }, [currentLevel, isPlaying, isPaused, timeLeft, bonusActive]);

  // Level 3 Boss: Spawn boss ketika mulai
  useEffect(() => {
    if (currentLevel === 3 && isPlaying && !isPaused && bossHealth === 0) {
      setBossHealth(5); // Boss perlu 5 hit
    }
  }, [currentLevel, isPlaying, isPaused, bossHealth]);

  const startGame = () => {
    playSound("start");
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setIsPaused(false);
    setGameSpeed(1100);
    setActiveIndex(null);
    setCombo(0);
    setCurrentLevel(1);
    setLevelComplete(false);
    setGameComplete(false);
    setBonusActive(false);
    setBossHealth(0);
    setShowLevelTransition(false);
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
    if (isPlaying && !isPaused && timeLeft > 0 && !showLevelTransition) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (isPlaying && timeLeft === 0 && !gameComplete) {
      playSound("gameover");
      setIsPlaying(false);
      setActiveIndex(null);
    }
  }, [isPlaying, isPaused, timeLeft, showLevelTransition, gameComplete]);

  // Mole movement logic
  useEffect(() => {
    if (!isPlaying || isPaused || showLevelTransition) return;

    // Speed up berdasarkan level
    const baseSpeed =
      currentLevel === 1 ? 1100 : currentLevel === 2 ? 900 : 700;
    const newSpeed = Math.max(
      currentLevel === 3 ? 400 : 500,
      baseSpeed - score * 10,
    );
    setGameSpeed(newSpeed);

    const moveMole = setInterval(() => {
      // CEK MISS
      if (
        !isHitRef.current &&
        activeIndex !== null &&
        activeType !== "trap" &&
        activeType !== "boss"
      ) {
        setCombo(0);
        playSound("break");
      }

      isHitRef.current = false;

      const randomIndex = Math.floor(Math.random() * 9);
      setActiveIndex(randomIndex);

      // Level 3: Boss mode
      if (currentLevel === 3 && bossHealth > 0) {
        setActiveType("boss");
        return;
      }

      const chance = Math.random();

      // Level 1: Bonus mode - hanya enemy dan golden
      if (bonusActive) {
        if (chance > 0.7) setActiveType("golden");
        else setActiveType("enemy");
        return;
      }

      // Level 2: Ada phishing robot
      if (currentLevel === 2) {
        if (chance > 0.9) setActiveType("golden");
        else if (chance > 0.75) setActiveType("trap");
        else if (chance > 0.5)
          setActiveType("phishing"); // 25% phishing
        else setActiveType("enemy");
      } else {
        // Level 1 normal
        if (chance > 0.9) setActiveType("golden");
        else if (chance > 0.7) setActiveType("trap");
        else setActiveType("enemy");
      }
    }, gameSpeed);

    return () => clearInterval(moveMole);
  }, [
    isPlaying,
    isPaused,
    score,
    gameSpeed,
    activeIndex,
    activeType,
    currentLevel,
    bonusActive,
    bossHealth,
    showLevelTransition,
  ]);

  const handleWhack = (index: number) => {
    if (!isPlaying || isPaused || index !== activeIndex) return;

    isHitRef.current = true;

    const isRampage = combo >= 5;
    const multiplier = isRampage ? 2 : 1;

    if (activeType === "boss") {
      playSound("hit");
      setBossHealth((prev) => {
        const newHealth = prev - 1;
        if (newHealth === 0) {
          playSound("golden");
          setScore((prev) => prev + 10 * multiplier);
          setTimeLeft((prev) => prev + 10);
        }
        return newHealth;
      });
      setCombo((c) => c + 1);
    } else if (activeType === "golden") {
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
    } else if (activeType === "phishing") {
      // Phishing robot - kelihatan seperti enemy tapi palsu
      playSound("error");
      setScore((prev) => Math.max(0, prev - 5));
      setCombo(0);
    } else {
      // TRAP
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

      {/* LEVEL TRANSITION OVERLAY */}
      {showLevelTransition && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="text-center animate-pop">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-green-400 mb-2 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
              LEVEL {currentLevel} COMPLETE!
            </h2>
            <p className="text-slate-400 mb-4">
              Score: <span className="text-yellow-400 font-bold">{score}</span>
            </p>
            <div className="text-cyan-400 text-xl font-bold mb-2">
              NEXT: LEVEL {currentLevel + 1}
            </div>
            <p className="text-sm text-slate-500 font-mono">
              {LEVEL_INFO[(currentLevel + 1) as 1 | 2 | 3]?.name}
            </p>
            <p className="text-xs text-slate-600">
              {LEVEL_INFO[(currentLevel + 1) as 1 | 2 | 3]?.desc}
            </p>
          </div>
        </div>
      )}

      {/* GAME COMPLETE OVERLAY */}
      {gameComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center animate-pop max-w-md p-8">
            <div className="text-8xl mb-6 animate-bounce">🏆</div>
            <h2 className="text-5xl font-black text-yellow-400 mb-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">
              VICTORY!
            </h2>
            <p className="text-slate-300 text-lg mb-6">
              Semua ancaman berhasil dihancurkan!
            </p>
            <div className="bg-slate-900/80 border border-yellow-500/30 rounded-lg p-6 mb-6">
              <p className="text-sm text-slate-400 mb-2">Final Score</p>
              <p className="text-6xl font-black text-yellow-400">{score}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={handleExitGame}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HUD dengan Level Indicator */}
      <div className="flex justify-between w-full items-end px-2 gap-4 relative">
        {/* Level Badge */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-14 z-50 flex flex-col items-center gap-1">
          <div
            className={`px-4 py-1 rounded-full font-mono text-xs font-bold border-2 ${
              currentLevel === 1
                ? "bg-cyan-900/80 border-cyan-500 text-cyan-300"
                : currentLevel === 2
                  ? "bg-yellow-900/80 border-yellow-500 text-yellow-300"
                  : "bg-red-900/80 border-red-500 text-red-300"
            }`}
          >
            LEVEL {currentLevel}: {LEVEL_INFO[currentLevel as 1 | 2 | 3].name}
          </div>
          {bonusActive && (
            <div className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded animate-pulse">
              🎁 DATA LEAK BONUS!
            </div>
          )}
          {currentLevel === 3 && bossHealth > 0 && (
            <div className="px-3 py-1 bg-red-900 border border-red-500 text-red-300 text-xs font-bold rounded flex items-center gap-2">
              BOSS HP: {Array(bossHealth).fill("❤️").join("")}
            </div>
          )}
        </div>

        {/* --- COMBO DISPLAY --- */}
        {combo > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-24 z-50 pointer-events-none flex flex-col items-center">
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
              Score
            </span>
            <span
              className={`text-4xl font-bold ${combo >= 5 ? "text-red-400 animate-pulse" : "text-white"}`}
            >
              {score}
            </span>
          </div>
          <div className="text-[8px] text-center text-slate-500 mt-1">
            Target: {LEVEL_REQUIREMENTS[currentLevel as 1 | 2 | 3]}
          </div>
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
            </span>
          </div>
        </div>
      </div>

      {/* MAINFRAME BOARD */}
      <div
        className={`relative bg-slate-900/50 p-6 rounded-xl border transition-all duration-300 shadow-2xl backdrop-blur-sm w-full ${
          bonusActive
            ? "border-green-500/70 shadow-[0_0_40px_rgba(34,197,94,0.5)]"
            : combo >= 5
              ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              : "border-slate-700"
        }`}
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
                      : "🛡️ READY"}
                </span>
              </div>

              <div className="p-6 flex flex-col items-center text-center relative">
                {isPaused ? (
                  <>
                    <div className="text-5xl mb-4">⏸️</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      PAUSED
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
                    <div className="text-5xl mb-2">💀</div>
                    <h2 className="text-3xl font-black text-white mb-1">
                      GAME OVER
                    </h2>
                    <div className="text-slate-400 text-sm mb-2">
                      Reached Level {currentLevel}
                    </div>
                    <div className="text-yellow-400 text-2xl font-bold mb-6">
                      {score} Points
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
                      3 LEVEL CHALLENGE
                    </h2>
                    <div className="text-xs text-slate-400 space-y-1 mb-4">
                      <p>Lv1: 30 pts - Data Leak Bonus</p>
                      <p>Lv2: 70 pts - Phishing Alert</p>
                      <p>Lv3: 120 pts - Boss Raid</p>
                    </div>
                    <button
                      onClick={startGame}
                      className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition"
                    >
                      START
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
              isActive={index === activeIndex}
              type={activeType}
              onClick={() => handleWhack(index)}
              isBoss={activeType === "boss"}
              isPhishing={activeType === "phishing"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
