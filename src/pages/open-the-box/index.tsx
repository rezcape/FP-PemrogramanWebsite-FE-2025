import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trophy,
  Pause,
  Sparkles,
  Sun,
  Moon,
  Play,
} from "lucide-react";
import {
  BoxItem,
  QuestionModal,
  SettingsModal,
  type BoxContent,
  type BoxStatus,
} from "./GameComponents";
import api from "../../api/axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = any;

export default function OpenTheBoxGame() {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- AUDIO REFS ---
  const correctSfx = useRef(new Audio("/sound/correct.wav"));
  const wrongSfx = useRef(new Audio("/sound/wrong.mp3"));
  const tickSfx = useRef(new Audio("/sound/tiktok.mp3"));
  const chillSfx = useRef(new Audio("/sound/chill.mp3"));
  const vibingSfx = useRef(new Audio("/sound/vibing.mp3"));

  const playOneShot = (
    audioRef: React.MutableRefObject<HTMLAudioElement>,
    volume = 0.5,
  ) => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.volume = volume;

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => console.warn("Audio play error:", error));
    }
  };

  // --- STATE ---
  const [items, setItems] = useState<BoxContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState("");

  const [boxStatus, setBoxStatus] = useState<BoxStatus[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- AUDIO SETTINGS ---
  useEffect(() => {
    // FIX: Simpan ref ke variabel lokal agar lint aman
    const vibing = vibingSfx.current;
    const chill = chillSfx.current;
    const tick = tickSfx.current;

    vibing.loop = true;
    vibing.volume = 0.4;
    chill.loop = true;
    chill.volume = 0.3;
    tick.loop = true;
    tick.volume = 0.6;

    vibing.load();
    chill.load();
    tick.load();

    return () => {
      vibing.pause();
      chill.pause();
      tick.pause();
    };
  }, []);

  // --- LOGIC AUDIO ---
  useEffect(() => {
    // FIX: Simpan ref ke variabel lokal agar lint aman
    const vibing = vibingSfx.current;
    const chill = chillSfx.current;
    const tick = tickSfx.current;

    if (!isGameStarted || isGameOver || isSettingsOpen) {
      vibing.pause();
      chill.pause();
      tick.pause();
      return;
    }
    if (isTimerRunning && timeLeft <= 10) {
      vibing.pause();
      chill.pause();
      if (tick.paused) tick.play().catch(() => {});
      return;
    }
    tick.pause();
    const isSafeState = timeLeft === 30 && activeItemIndex === null;
    if (isSafeState) {
      chill.pause();
      if (vibing.paused) vibing.play().catch(() => {});
    } else {
      vibing.pause();
      if (chill.paused) chill.play().catch(() => {});
    }
  }, [
    isGameStarted,
    activeItemIndex,
    timeLeft,
    isGameOver,
    isSettingsOpen,
    isTimerRunning,
  ]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Add timestamp to prevent cache
        const timestamp = Date.now();
        const res = await api.get(
          `/api/game/game-type/open-the-box/${id}?t=${timestamp}`,
        );
        let targetData = res.data?.data || res.data;
        if (!targetData.game_json) targetData = res.data;

        if (targetData && targetData.game_json) {
          setGameTitle(targetData.name);
          const allItems = targetData.game_json.items.map(
            (item: AnyObject) => ({
              id: item.id,
              text: item.text,
              options: item.options,
              answer: item.answer,
            }),
          );
          const shuffled = [...allItems].sort(() => 0.5 - Math.random());
          setItems(shuffled.slice(0, 10));
          setBoxStatus(new Array(shuffled.slice(0, 10).length).fill("closed"));
        }
      } catch (err) {
        console.error("Failed to fetch game:", err);
        setError("Failed to load game. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [id]);

  // --- TIMER ---
  useEffect(() => {
    if (
      !loading &&
      isGameStarted &&
      !isGameOver &&
      !isSettingsOpen &&
      isTimerRunning
    ) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isGameStarted, isGameOver, isSettingsOpen, isTimerRunning]);

  // --- HANDLERS ---
  const handleStartGame = () => {
    setIsGameStarted(true);
    vibingSfx.current.play().catch(() => {});
  };
  const handleBoxClick = (index: number) => {
    if (!isGameStarted || boxStatus[index] !== "closed" || isGameOver) return;
    setActiveItemIndex(index);
    setIsTimerRunning(true);
  };
  const handleAnswer = (answerText: string) => {
    if (activeItemIndex === null) return;
    const currentItem = items[activeItemIndex];
    const isCorrect = answerText === currentItem.answer;
    const newStatus = [...boxStatus];

    if (isCorrect) {
      playOneShot(correctSfx);
      newStatus[activeItemIndex] = "correct";
      setScore((p) => p + 100);
      setCorrectCount((p) => p + 1);
      setTimeLeft(30);
      setIsTimerRunning(false);
      setActiveItemIndex(null);
    } else {
      playOneShot(wrongSfx, 1.0);
      newStatus[activeItemIndex] = "wrong";
      setActiveItemIndex(null);
    }
    setBoxStatus(newStatus);
    if (newStatus.every((s) => s !== "closed")) handleGameOver();
  };
  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const handleResume = () => setIsSettingsOpen(false);
  const handleRestart = () => window.location.reload();
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const handleGameOver = () => {
    setIsGameOver(true);
    setIsTimerRunning(false);
    setActiveItemIndex(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F3F1E8] dark:bg-black flex items-center justify-center text-stone-400 font-mono font-bold tracking-widest">
        INITIALIZING...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#F3F1E8] dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1a1a1a] border border-red-500 rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error Loading Game
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/")}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen font-sans flex flex-col relative bg-[#F3F1E8] dark:bg-black text-stone-800 dark:text-stone-200 overflow-hidden transition-colors duration-500">
        {/* Background Patterns - UPDATED: Gold Theme for Dark Mode */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 dark:opacity-30 pointer-events-none z-0"></div>
        {/* Amber/Gold Blobs instead of Violet/Cyan */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/40 dark:bg-amber-900/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-200/40 dark:bg-yellow-900/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

        {/* MODAL SETTINGS */}
        {isSettingsOpen && (
          <SettingsModal onResume={handleResume} onRestart={handleRestart} />
        )}

        {/* GAME OVER SCREEN */}
        {isGameOver && (
          <div className="fixed inset-0 z-50 bg-stone-100/50 dark:bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="bg-[#F3F1E8] dark:bg-[#1a1a1a] border border-stone-300 dark:border-amber-900/50 p-10 rounded-xl text-center max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-900/10 pointer-events-none"></div>
              <Trophy className="w-24 h-24 mx-auto text-amber-500 mb-6 drop-shadow-md" />
              <h1 className="text-3xl font-serif font-bold text-stone-800 dark:text-amber-100 mb-2 uppercase tracking-wider">
                {timeLeft === 0 ? "Time's Up" : "Complete!"}
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mb-6 font-serif italic">
                Accuracy:{" "}
                {items.length > 0
                  ? Math.round((correctCount / items.length) * 100)
                  : 0}
                %
              </p>
              <div className="text-6xl font-black text-amber-600 dark:text-amber-400 mb-8 font-mono">
                {score}
              </div>
              <div className="flex gap-4 relative z-10">
                <Button
                  onClick={() => navigate("/")}
                  variant="ghost"
                  className="flex-1 py-6 border border-stone-300 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400 font-serif"
                >
                  Exit
                </Button>
                <Button
                  onClick={handleRestart}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white py-6 font-bold shadow-lg font-serif"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* START SCREEN */}
        {!isGameStarted && (
          <div className="fixed inset-0 z-50 bg-[#F3F1E8]/90 dark:bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-5xl font-serif font-bold text-stone-800 dark:text-amber-100 mb-6 tracking-wide">
                Ready to Play?
              </h1>
              <Button
                onClick={handleStartGame}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white py-8 px-12 text-xl font-bold rounded-xl shadow-2xl transition-transform hover:scale-[1.03] active:scale-95 font-serif"
              >
                <Play className="w-6 h-6 mr-3 fill-current" /> Start Game
              </Button>
            </div>
          </div>
        )}

        {/* MODAL SOAL */}
        {activeItemIndex !== null && (
          <QuestionModal
            content={items[activeItemIndex]}
            timeLeft={timeLeft}
            onAnswer={handleAnswer}
          />
        )}

        {/* HEADER - UPDATED ALIGNMENT */}
        <div className="absolute top-0 left-0 w-full pt-4 px-4 md:pt-6 md:px-6 flex justify-between items-start z-20">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800/50"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </Button>

          {/* KANAN: Theme + Timer (Alignment Fixed) */}
          <div className="flex items-end gap-3">
            {" "}
            {/* items-end agar tombol sejajar bawah dengan kotak timer */}
            {/* Tombol Theme diperkecil agar proporsional */}
            <Button
              onClick={toggleTheme}
              size="icon"
              className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-stone-700 shadow-sm hover:scale-105 transition-transform"
            >
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-amber-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-600" />
              )}
            </Button>
            {/* Timer Display */}
            <div className="flex flex-col items-end gap-1">
              <div className="text-[10px] font-bold tracking-widest text-stone-400 dark:text-stone-500 uppercase">
                Time Left
              </div>
              <div
                className={`text-2xl font-mono font-black px-4 py-1 rounded-lg border-2 transition-all ${
                  timeLeft <= 10
                    ? "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-500 animate-pulse"
                    : "bg-white/80 dark:bg-[#1a1a1a] border-stone-300 dark:border-stone-700 text-stone-700 dark:text-amber-400"
                }`}
              >
                {timeLeft}
                <span className="text-sm ml-1 opacity-50">s</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT - HEADLINE REDESIGN */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 w-full h-full pt-20 md:pt-0 pb-20 md:pb-0">
          <div className="text-center mb-8">
            {/* Judul: Serif, Besar, Gold Theme */}
            <h1 className="text-xl md:text-3xl font-serif font-bold text-stone-800 dark:text-amber-100 uppercase tracking-widest mb-2 drop-shadow-md">
              {gameTitle || "Loading..."}
            </h1>

            {/* Garis Pemisah Mistis */}
            <div className="flex items-center justify-center gap-4 mb-4 opacity-50">
              <div className="h-[1px] w-12 bg-stone-400 dark:bg-amber-700"></div>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div className="h-[1px] w-12 bg-stone-400 dark:bg-amber-700"></div>
            </div>

            {/* Score: Lebih Kecil & Minimalis */}
            <div className="text-xl font-mono font-medium text-stone-500 dark:text-stone-400">
              SCORE:{" "}
              <span className="text-stone-800 dark:text-amber-400 font-bold">
                {score}
              </span>
            </div>
          </div>

          <div className="w-full max-w-5xl">
            <div
              className={`grid gap-3 md:gap-6 place-items-center ${
                items.length <= 2
                  ? "grid-cols-1 md:grid-cols-2"
                  : items.length <= 4
                    ? "grid-cols-2 md:grid-cols-2"
                    : items.length <= 6
                      ? "grid-cols-2 md:grid-cols-3"
                      : items.length <= 8
                        ? "grid-cols-2 md:grid-cols-4"
                        : "grid-cols-2 md:grid-cols-5"
              }`}
            >
              {items.map((item, index) => (
                <div key={item.id} className="w-full max-w-[200px]">
                  <BoxItem
                    index={index}
                    text={item.text}
                    status={boxStatus[index]}
                    onClick={() => handleBoxClick(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAUSE BUTTON */}
        <div className="fixed bottom-6 left-6 z-40">
          <Button
            size="icon"
            onClick={handleOpenSettings}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white shadow-xl transition-all active:scale-95"
          >
            <Pause className="h-5 w-5 md:h-6 md:w-6 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
}
