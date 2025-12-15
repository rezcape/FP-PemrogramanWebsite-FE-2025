import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CategoryBuckets } from "./components/CategoryBuckets";
import { CountdownScreen } from "./components/CountdownScreen";
import { GameEndScreen } from "./components/GameEndScreen";
import { GameHeader } from "./components/GameHeader";
import { StartScreen } from "./components/StartScreen";
import { WordCardsAnimation } from "./components/WordCardsAnimation";
import { useGetPlaySpeedSorting } from "./hooks/useGetPlaySpeedSorting";
import {
  getScrollAnimation,
  useSpeedSortingGame,
} from "./hooks/useSpeedSortingGame";
import { themes, type SpeedSortingTheme } from "./themes";

const THEME_STORAGE_KEY = "speed-sorting-theme";

export default function SpeedSorting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading, error } = useGetPlaySpeedSorting(id!);

  const [isMuted, setIsMuted] = useState(false);
  const game = useSpeedSortingGame(detail, isMuted);
  const scrollAnimation = getScrollAnimation();
  const [theme, setTheme] = useState<SpeedSortingTheme>(() => {
    const pool = themes.length ? themes : [themes[0]];
    const storedId = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedId) {
      const found = pool.find((t) => t.id === storedId);
      if (found) return found;
    }
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }, [theme]);

  const handleThemeChange = (id: string) => {
    const found = themes.find((t) => t.id === id);
    if (found) setTheme(found);
  };

  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  const playClickSound = useCallback(() => {
    if (isMuted) return;
    if (!clickSoundRef.current) {
      clickSoundRef.current = new Audio(
        new URL(
          "../../assets/game/speed-sorting/effects/click-effect.mp3",
          import.meta.url,
        ).toString(),
      );
      clickSoundRef.current.volume = 0.35;
      clickSoundRef.current.preload = "auto";
    }

    const audio = clickSoundRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      /* ignore play errors */
    });
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    if (!startSoundRef.current) {
      startSoundRef.current = new Audio(
        new URL(
          "../../assets/game/speed-sorting/backsounds/Skeletoni.mp3",
          import.meta.url,
        ).toString(),
      );
      startSoundRef.current.loop = true;
      startSoundRef.current.volume = 1;
      startSoundRef.current.preload = "auto";
    }

    const audio = startSoundRef.current;
    if (!audio) return;
    audio.muted = isMuted;

    const tryPlay = () => {
      if (audio.paused) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          /* autoplay blocked until user gesture */
        });
      }
    };

    // Attempt play when entering waiting state
    if (game.gameState === "waiting") {
      tryPlay();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    // Fallback: once-per-session resume on first user interaction
    const resumeOnInteract = () => {
      if (game.gameState === "waiting") tryPlay();
      document.removeEventListener("pointerdown", resumeOnInteract);
      document.removeEventListener("keydown", resumeOnInteract);
    };
    document.addEventListener("pointerdown", resumeOnInteract, { once: true });
    document.addEventListener("keydown", resumeOnInteract, { once: true });

    return () => {
      audio.pause();
      document.removeEventListener("pointerdown", resumeOnInteract);
      document.removeEventListener("keydown", resumeOnInteract);
    };
  }, [game.gameState, isMuted]);

  useEffect(() => {
    if (clickSoundRef.current) {
      clickSoundRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  if (error || !detail)
    return (
      <div className="flex justify-center items-center min-h-screen">
        {error || "Game not found"}
      </div>
    );

  if (game.gameEnded) {
    return (
      <>
        <style>{scrollAnimation}</style>
        <GameEndScreen
          finalTime={game.finalTime}
          totalWords={game.totalWords}
          incorrectAttempts={game.incorrectAttempts}
          onPlayAgain={() => {
            playClickSound();
            game.resetGame();
          }}
          onBackToHome={() => {
            playClickSound();
            window.location.href = "/";
          }}
          theme={theme}
          onClickSound={playClickSound}
        />
      </>
    );
  }

  return (
    <>
      <style>{scrollAnimation}</style>
      <div
        className="relative w-full min-h-screen text-slate-100 flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--bg-base)",
          ["--bg-base" as string]: theme.base,
          ["--bg-radials" as string]: theme.radials,
          ["--bg-linear" as string]: theme.linear,
          ["--card-bg" as string]: theme.cardBg,
          ["--card-overlay" as string]: theme.cardOverlay,
          ["--card-bottom" as string]: theme.cardBottomFade,
          ["--accent-strong" as string]: theme.accentStrong,
          ["--accent-weak" as string]: theme.accentWeak,
          ["--progress-glow" as string]: theme.progressGlow,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ backgroundImage: "var(--bg-radials)" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "var(--bg-linear)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-52"
          style={{
            backgroundImage:
              "linear-gradient(to top, var(--bg-base) 0%, rgba(0,0,0,0.6) 65%, transparent 100%)",
          }}
        />

        <GameHeader
          timer={game.timer}
          score={game.score}
          isMuted={isMuted}
          onToggleMute={() => {
            toggleMute();
          }}
          onExit={() => {
            playClickSound();
            navigate(-1);
          }}
          onClickSound={playClickSound}
        />

        <div className="relative w-full flex-1 p-2 sm:p-4 lg:p-6 flex justify-center items-center">
          <div className="w-full max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">
            <div
              className="relative overflow-hidden w-full p-4 sm:p-8 lg:p-12 text-center space-y-6 sm:space-y-8 lg:space-y-10 rounded-xl lg:rounded-2xl border border-cyan-400/20 shadow-[0_20px_80px_-40px_rgba(0,255,255,0.6)] min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex flex-col justify-center backdrop-blur-xl"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{ backgroundImage: "var(--card-overlay)" }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
                style={{ backgroundImage: "var(--card-bottom)" }}
              />
              {game.gameState === "waiting" && (
                <StartScreen
                  onStart={() => {
                    playClickSound();
                    game.startGame();
                  }}
                  title={detail.name}
                  thumbnailImage={`${import.meta.env.VITE_API_URL}/${detail.thumbnail_image}`}
                  themes={themes}
                  selectedThemeId={theme.id}
                  onThemeChange={(id) => {
                    playClickSound();
                    handleThemeChange(id);
                  }}
                  theme={theme}
                  onClickSound={playClickSound}
                />
              )}

              {game.gameState === "countdown" && (
                <CountdownScreen countdown={game.countdown} />
              )}

              {game.gameState === "playing" && (
                <>
                  <WordCardsAnimation
                    words={game.words}
                    speed={game.speed}
                    draggedItem={game.draggedItem}
                    onDragStart={game.handleDragStart}
                    onDragEnd={game.handleDragEnd}
                  />

                  <CategoryBuckets
                    categories={game.categories}
                    hoveredCategory={game.hoveredCategory}
                    dropFeedback={game.dropFeedback}
                    onDragOver={game.handleDragOver}
                    onDragEnter={game.handleDragEnter}
                    onDragLeave={game.handleDragLeave}
                    onDrop={game.handleDrop}
                  />

                  <div
                    className="text-lg sm:text-xl lg:text-2xl font-bold mt-4 sm:mt-6 lg:mt-8"
                    style={{
                      color: "#ffffff",
                      textShadow:
                        "0 0 22px rgba(0,0,0,0.45), 0 0 14px rgba(255,255,255,0.35)",
                    }}
                  >
                    <div className="w-full flex justify-center mb-3">
                      <div
                        className="h-px w-2/3"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent)",
                        }}
                      />
                    </div>
                    <div className="inline-block px-4 py-2 rounded-lg bg-black/35 backdrop-blur-sm">
                      {game.completedWords} of {game.totalWords} words completed
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
