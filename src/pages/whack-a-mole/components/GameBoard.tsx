import React, { useState, useEffect, useRef, useMemo } from "react";
import Hole from "./Hole.tsx";
import { playSound } from "../utils/SoundManager.ts";

interface GameBoardProps {
  onExit: () => void;
  gameData?: unknown;
  isNightmareMode?: boolean;
  isPlaying?: boolean;
  isPaused?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onPausedChange?: (paused: boolean) => void;
  gameId?: string;
  onScoreSubmit?: (score: number, timeLeft: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  onExit,
  isNightmareMode = false,
  onPlayingChange,
  onPausedChange,
  gameId,
  onScoreSubmit,
}) => {
  // Nightmare mode speed multiplier
  const speedMultiplier = isNightmareMode ? 0.8 : 1; // 0.8 = 1.25x faster
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
  const [bossHealth, setBossHealth] = useState<number>(0);
  const [showLevelTransition, setShowLevelTransition] =
    useState<boolean>(false);
  const [showLevel2Tutorial, setShowLevel2Tutorial] = useState<boolean>(false);
  const [showLevel3Tutorial, setShowLevel3Tutorial] = useState<boolean>(false);

  // Ref untuk melacak apakah mole saat ini sudah dipukul
  const isHitRef = useRef<boolean>(false);
  const hasStartedRef = useRef<boolean>(false);

  // Level requirements (wrapped in useMemo to prevent recreation)
  const LEVEL_REQUIREMENTS = useMemo(
    () => ({
      1: 30, // Level 1: 30 poin
      2: 70, // Level 2: 70 poin total
      3: 120, // Level 3: 120 poin untuk win
    }),
    [],
  );

  const LEVEL_INFO = {
    1: { name: "DATA BREACH", desc: "Eliminate basic threats", color: "cyan" },
    2: {
      name: "PHISHING ATTACK",
      desc: "Beware of imposters!",
      color: "yellow",
    },
    3: { name: "JACKPOT RAID", desc: "Defeat the mega threat!", color: "red" },
  };

  // Auto-start game when component mounts (when user clicks INITIALIZE_GAME)
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        startGame();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setShowLevelTransition(false);
        setShowLevel2Tutorial(true); // Show tutorial dulu
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
        setShowLevelTransition(false);
        setShowLevel3Tutorial(true); // Show tutorial Level 3
      }, 3000);
    } else if (currentLevel === 3 && score >= LEVEL_REQUIREMENTS[3]) {
      setGameComplete(true);
      setIsPlaying(false);
      playSound("golden");
      // Submit score when all levels completed
      if (onScoreSubmit && gameId) {
        onScoreSubmit(score, timeLeft);
      }
    }
  }, [
    score,
    currentLevel,
    isPlaying,
    levelComplete,
    gameComplete,
    LEVEL_REQUIREMENTS,
    onScoreSubmit,
    gameId,
    timeLeft,
  ]);

  const startGame = () => {
    playSound("start");
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setIsPaused(false);
    setGameSpeed(1100 * speedMultiplier); // Apply nightmare mode speed
    setActiveIndex(null);
    setCombo(0);
    setCurrentLevel(1);
    setLevelComplete(false);
    setGameComplete(false);
    setBossHealth(0);
    setShowLevelTransition(false);
    setShowLevel2Tutorial(false);
    setShowLevel3Tutorial(false);
    isHitRef.current = false;
    // Notify parent that game is playing
    if (onPlayingChange) onPlayingChange(true);
    if (onPausedChange) onPausedChange(false);
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    // Notify parent about pause state change
    if (onPausedChange) onPausedChange(newPausedState);
  };

  const handleExitGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    // Notify parent that game stopped
    if (onPlayingChange) onPlayingChange(false);
    if (onPausedChange) onPausedChange(false);
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
      // Submit score when game over
      if (onScoreSubmit && gameId) {
        onScoreSubmit(score, 0);
      }
    }
  }, [
    isPlaying,
    isPaused,
    timeLeft,
    showLevelTransition,
    gameComplete,
    onScoreSubmit,
    gameId,
    score,
  ]);

  // Mole movement logic
  useEffect(() => {
    if (!isPlaying || isPaused || showLevelTransition) return;

    // Speed up berdasarkan level dan kondisi
    let newSpeed;
    if (currentLevel === 1) {
      newSpeed = Math.max(700, 1200 - score * 8);
    } else if (currentLevel === 2) {
      newSpeed = Math.max(650, 1100 - score * 7);
    } else if (currentLevel === 3) {
      // Level 3: Lebih cepat tapi tidak extreme
      if (activeType === "boss") {
        // Jackpot: Mengikuti kecepatan level 3, tapi sedikit lebih lambat
        newSpeed = Math.max(700, 1100 - score * 5);
      } else {
        newSpeed = Math.max(550, 950 - score * 5);
      }
    } else {
      newSpeed = Math.max(600, 1000 - score * 6);
    }
    // Apply nightmare mode speed multiplier
    setGameSpeed(newSpeed * speedMultiplier);

    const moveMole = setInterval(() => {
      // CEK MISS
      if (!isHitRef.current && activeIndex !== null) {
        if (activeType === "boss") {
          // JACKPOT MISS: -30 poin!
          setScore((prev) => Math.max(0, prev - 30));
          playSound("error");
        } else if (activeType !== "trap") {
          setCombo(0);
          playSound("break");
        }
      }

      isHitRef.current = false;

      const randomIndex = Math.floor(Math.random() * 9);
      setActiveIndex(randomIndex);

      const chance = Math.random();
      const isDataLeak = timeLeft < 10; // Bonus spawn rate when time is low

      // Level 1 normal: Robot 60%, Shield 21%, Ransomware 19%
      // Data Leak: Ransomware 29% (+10%), Shield 21%, Robot 50%
      if (currentLevel === 1) {
        if (isDataLeak) {
          if (chance >= 0.71)
            setActiveType("golden"); // 29% ransomware (+10%)
          else if (chance >= 0.5)
            setActiveType("trap"); // 21% shield
          else setActiveType("enemy"); // 50% robot
        } else {
          if (chance >= 0.81)
            setActiveType("golden"); // 19% ransomware
          else if (chance >= 0.6)
            setActiveType("trap"); // 21% shield
          else setActiveType("enemy"); // 60% normal robot
        }
      }
      // Level 2: Robot normal paling banyak, impostor kedua, ransomware, shield
      // Data Leak: Ransomware 35% (+10%), Impostor 27%, Shield 10%, Robot 28%
      else if (currentLevel === 2) {
        if (isDataLeak) {
          if (chance >= 0.65)
            setActiveType("golden"); // 35% ransomware (+10%)
          else if (chance >= 0.38)
            setActiveType("phishing"); // 27% impostor
          else if (chance >= 0.28)
            setActiveType("trap"); // 10% shield
          else setActiveType("enemy"); // 28% robot
        } else {
          if (chance >= 0.75)
            setActiveType("golden"); // 25% ransomware
          else if (chance >= 0.65)
            setActiveType("trap"); // 10% shield (paling sedikit)
          else if (chance >= 0.38)
            setActiveType("phishing"); // 27% impostor
          else setActiveType("enemy"); // 38% robot normal (terbanyak!)
        }
      }
      // Level 3: Robot 40%, Ransomware 20%, Shield 15%, Impostor 15%, Jackpot 10%
      // Data Leak: Ransomware 30% (+10%), Jackpot 10%, Shield 15%, Impostor 15%, Robot 30%
      else if (currentLevel === 3) {
        if (isDataLeak) {
          if (chance >= 0.9)
            setActiveType("boss"); // 10% JACKPOT!
          else if (chance >= 0.6)
            setActiveType("golden"); // 30% ransomware (+10%)
          else if (chance >= 0.45)
            setActiveType("trap"); // 15% shield
          else if (chance >= 0.3)
            setActiveType("phishing"); // 15% impostor
          else setActiveType("enemy"); // 30% robot
        } else {
          if (chance >= 0.9)
            setActiveType("boss"); // 10% JACKPOT!
          else if (chance >= 0.7)
            setActiveType("golden"); // 20% ransomware
          else if (chance >= 0.55)
            setActiveType("trap"); // 15% shield
          else if (chance >= 0.4)
            setActiveType("phishing"); // 15% impostor
          else setActiveType("enemy"); // 40% robot normal
        }
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
    bossHealth,
    showLevelTransition,
    speedMultiplier,
    timeLeft,
  ]);

  const handleWhack = (index: number) => {
    if (!isPlaying || isPaused || index !== activeIndex) return;

    isHitRef.current = true;

    // MULTIPLIER SYSTEM
    const isRampage = combo >= 5;
    const isDataLeak = timeLeft < 10; // DATA LEAK: Bonus x2 saat waktu < 10 detik
    const multiplier = (isRampage ? 2 : 1) * (isDataLeak ? 2 : 1); // Bisa stack jadi 4x!

    // Clear active target immediately untuk avoid double click
    const currentType = activeType;
    setActiveIndex(null);

    if (currentType === "boss") {
      // JACKPOT: Single click = +30 poin!
      playSound("golden");
      setScore((prev) => prev + 30 * multiplier); // JACKPOT: +30 poin!
      setCombo((c) => c + 1);
    } else if (currentType === "golden") {
      playSound("golden");
      setScore((prev) => prev + 5 * multiplier);
      setTimeLeft((prev) => prev + 5);
      setCombo((c) => c + 1);
    } else if (currentType === "enemy") {
      playSound("hit");
      setScore((prev) => prev + 1 * multiplier);
      setCombo((c) => {
        const newCombo = c + 1;
        if (newCombo === 5) playSound("rampage");
        return newCombo;
      });
    } else if (currentType === "phishing") {
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
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto font-['Fredoka'] relative z-10 pt-16">
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

      {/* LEVEL 2 TUTORIAL OVERLAY */}
      {showLevel2Tutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center animate-pop max-w-lg p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-black text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">
              LEVEL 2: PHISHING ATTACK!
            </h2>
            <div className="bg-slate-900/80 border border-yellow-500/30 rounded-lg p-6 mb-6 text-left space-y-3">
              <p className="text-slate-300 text-sm">
                <span className="text-yellow-400 font-bold">
                  ⚠️ PERINGATAN:
                </span>{" "}
                Impostor robots telah menyusup!
              </p>
              <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border-2 border-cyan-400/30">
                <span className="text-4xl">🤖</span>
                <div className="text-xs">
                  <p className="text-cyan-400 font-bold">Robot Asli</p>
                  <p className="text-slate-400">
                    Lingkaran BIRU terang = +1 poin ✅
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border-2 border-red-500/50">
                <span className="text-4xl opacity-90">🤖</span>
                <div className="text-xs">
                  <p className="text-red-400 font-bold">⚠️ Impostor Robot</p>
                  <p className="text-slate-400">
                    Lingkaran MERAH terang = -5 poin ❌
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-xs italic mt-3">
                💡 Tip: Perhatikan warna lingkaran border saat target muncul!
              </p>
              <div className="bg-red-900/20 border border-red-500/30 rounded p-2 mt-2">
                <p className="text-red-400 text-xs font-bold">
                  🚨 HATI-HATI: Impostor sangat mirip dengan robot asli!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowLevel2Tutorial(false);
                setCurrentLevel(2);
                setLevelComplete(false);
                setTimeLeft(30);
              }}
              className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition"
            >
              MULAI LEVEL 2
            </button>
          </div>
        </div>
      )}

      {/* LEVEL 3 TUTORIAL OVERLAY */}
      {showLevel3Tutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center animate-pop max-w-lg p-8">
            <div className="text-6xl mb-4">💎</div>
            <h2 className="text-3xl font-black text-purple-400 mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
              LEVEL 3: JACKPOT RAID!
            </h2>
            <div className="bg-slate-900/80 border border-purple-500/30 rounded-lg p-6 mb-6 text-left space-y-3">
              <p className="text-slate-300 text-sm">
                <span className="text-purple-400 font-bold">💎 INFO:</span>{" "}
                Level terakhir dengan Jackpot langka!
              </p>
              <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded border-2 border-purple-500/50">
                <span className="text-5xl">💎</span>
                <div className="text-xs">
                  <p className="text-purple-400 font-bold">
                    🎯 JACKPOT (10% spawn)
                  </p>
                  <p className="text-green-400">Klik: +30 poin ✅</p>
                  <p className="text-red-400">Miss: -30 poin ❌</p>
                </div>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 space-y-2">
                <p className="text-slate-300 text-xs font-bold">
                  Target lainnya:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <span className="text-slate-400">Robot: 40%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👺</span>
                    <span className="text-slate-400">Ransomware: 20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-slate-400">Shield: 15%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span>
                    <span className="text-red-400">Impostor: 15%</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs italic mt-3">
                💡 Tip: Level 3 lebih cepat! Fokus pada Jackpot untuk bonus
                besar!
              </p>
              <div className="bg-red-900/20 border border-red-500/30 rounded p-2 mt-2">
                <p className="text-red-400 text-xs font-bold">
                  ⚠️ PERINGATAN: Jackpot memiliki risiko tinggi (-15 jika miss)!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowLevel3Tutorial(false);
                setCurrentLevel(3);
                setLevelComplete(false);
                setTimeLeft(30);
              }}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition"
            >
              MULAI LEVEL 3
            </button>
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
          {timeLeft < 10 && !levelComplete && (
            <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
              🚨 DATA LEAK! 2x POINTS!
            </div>
          )}
        </div>

        {/* --- COMBO DISPLAY --- */}
        {combo > 1 && !levelComplete && !gameComplete && (
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
            className={`absolute -inset-[1px] bg-gradient-to-b ${isNightmareMode ? "from-red-600 via-red-800" : combo >= 5 ? "from-red-600 via-yellow-500" : "from-yellow-500"} to-transparent rounded opacity-20 transition-all`}
          ></div>
          <div
            className={`relative bg-slate-900/90 border-l-4 ${isNightmareMode ? "border-red-600" : combo >= 5 ? "border-red-500" : "border-yellow-500"} px-3 py-3 flex flex-col items-center justify-center transition-colors min-h-[60px]`}
          >
            <span
              className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${isNightmareMode ? "text-red-500/80" : "text-yellow-500/80"}`}
            >
              Score
            </span>
            <span
              className={`text-3xl font-bold ${isNightmareMode ? "text-red-400 animate-pulse" : combo >= 5 ? "text-red-400 animate-pulse" : "text-white"}`}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Target Panel */}
        <div className="flex-1 relative group">
          <div
            className={`absolute -inset-[1px] bg-gradient-to-b ${isNightmareMode ? "from-red-500" : "from-green-500"} to-transparent rounded opacity-20`}
          ></div>
          <div
            className={`relative bg-slate-900/90 border-t-4 border-b-4 ${isNightmareMode ? "border-red-500" : "border-green-500"} px-3 py-3 flex flex-col items-center justify-center min-h-[60px]`}
          >
            <span
              className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${isNightmareMode ? "text-red-500/80" : "text-green-500/80"}`}
            >
              Target
            </span>
            <span
              className={`text-3xl font-bold ${isNightmareMode ? "text-red-400" : "text-green-400"}`}
            >
              {LEVEL_REQUIREMENTS[currentLevel as 1 | 2 | 3]}
            </span>
          </div>
        </div>

        {/* Time Panel */}
        <div className="flex-1 relative group">
          <div
            className={`absolute -inset-[1px] bg-gradient-to-b ${isNightmareMode ? "from-red-600" : timeLeft <= 10 ? "from-red-500" : "from-cyan-500"} to-transparent rounded opacity-20`}
          ></div>
          <div
            className={`relative bg-slate-900/90 border-r-4 ${isNightmareMode ? "border-red-600" : timeLeft <= 10 ? "border-red-500" : "border-cyan-500"} px-3 py-3 flex flex-col items-center justify-center min-h-[60px]`}
          >
            <span
              className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${isNightmareMode ? "text-red-400" : "text-slate-400"}`}
            >
              Time
            </span>
            <span
              className={`text-3xl font-bold font-mono ${isNightmareMode ? "text-red-400 animate-pulse" : timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`}
            >
              {timeLeft}
              <span className="text-sm">s</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAINFRAME BOARD */}
      <div
        className={`relative bg-slate-900/50 p-6 rounded-xl border transition-all duration-300 shadow-2xl backdrop-blur-sm w-full ${
          isNightmareMode
            ? "border-red-600/70 shadow-[0_0_40px_rgba(220,38,38,0.5)]"
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
                      <p>Lv1: 30 pts - Data Breach</p>
                      <p>Lv2: 70 pts - Phishing Attack</p>
                      <p>Lv3: 120 pts - Jackpot Raid</p>
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
