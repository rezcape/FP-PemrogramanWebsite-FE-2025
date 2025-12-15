import { Button } from "@/components/ui/button";
import type { SpeedSortingTheme } from "../themes";

interface StartScreenProps {
  onStart: () => void;
  title: string;
  thumbnailImage: string;
  themes: SpeedSortingTheme[];
  selectedThemeId: string;
  onThemeChange: (id: string) => void;
  theme: SpeedSortingTheme;
  onClickSound?: () => void;
}

export function StartScreen({
  onStart,
  title,
  thumbnailImage,
  themes,
  selectedThemeId,
  onThemeChange,
  theme,
  onClickSound,
}: StartScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-6 space-y-5 sm:space-y-7 lg:space-y-8 text-slate-100">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.12),transparent_45%)]" />
      <div className="relative flex flex-col items-center gap-3 sm:gap-5">
        <div className="px-4 py-2 rounded-full border border-cyan-400/40 bg-white/5 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
          Speed Sorting
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-[0_10px_40px_rgba(59,130,246,0.35)]">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl text-center px-4">
          Drag each neon card into its matching category. Beat the clock, and
          climb the score, enjoy the game!
        </p>
      </div>

      {thumbnailImage && (
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-4 blur-3xl bg-cyan-500/12 rounded-2xl" />
          <img
            src={thumbnailImage}
            alt={title}
            className="relative w-full h-40 sm:h-52 lg:h-60 object-cover rounded-2xl border border-cyan-400/30 shadow-[0_25px_90px_-40px_rgba(59,130,246,0.9)]"
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-300/90">
            Select Theme
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-3xl">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onClickSound?.();
                  onThemeChange(t.id);
                }}
                className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 ${
                  selectedThemeId === t.id
                    ? "border-white/80 shadow-[0_10px_35px_-18px_rgba(0,0,0,0.9)]"
                    : "border-white/25 opacity-85 hover:opacity-100"
                }`}
                aria-label={`Use ${t.name} theme`}
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, ${t.accentWeak}, transparent 45%), radial-gradient(circle at 75% 25%, ${t.accentStrong}, transparent 45%), linear-gradient(135deg, ${t.accentWeak}, ${t.accentStrong})`,
                }}
              >
                {selectedThemeId === t.id && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-4 w-4 rounded-full border-2 border-white bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.7)]" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            onClickSound?.();
            onStart();
          }}
          size="lg"
          className="px-9 sm:px-11 py-3.5 sm:py-4 mt-5 text-lg sm:text-xl font-semibold text-white shadow-[0_18px_70px_-28px_rgba(59,130,246,0.95)] hover:scale-[1.03] transition-transform border border-white/10"
          style={{
            backgroundImage: `linear-gradient(135deg, ${theme.accentWeak}, ${theme.accentStrong})`,
          }}
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
