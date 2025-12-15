import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ArrowLeft, Menu, RotateCcw } from "lucide-react";
import api from "@/api/axios";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tile = {
  label: string;
  flipped: boolean;
  removed: boolean;
  id: string;
  color: string; // tailwind color class
  justRemoved?: boolean;
  justRestored?: boolean;
  justUnflipped?: boolean;
};

type GameData = {
  id: string;
  title: string;
  description: string;
  thumbnail_image: string | null;
  tiles: { label: string }[];
};

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function FlipTiles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [spinnerTarget, setSpinnerTarget] = useState<string | null>(null);
  const [zoomedTile, setZoomedTile] = useState<string | null>(null);
  const [zoomFromRect, setZoomFromRect] = useState<DOMRect | null>(null);
  const [zoomLeaving, setZoomLeaving] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Ref for spinner interval cleanup
  const spinnerIntervalRef = useRef<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scheduleTimeout = (cb: () => void, delay: number) => {
    const t = setTimeout(cb, delay);
    timeoutsRef.current.push(t);
    return t;
  };

  // Cleanup spinner on unmount
  useEffect(() => {
    return () => {
      if (spinnerIntervalRef.current) {
        clearInterval(spinnerIntervalRef.current);
      }
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        // Try to fetch game detail (auth required for now)
        const gameResponse = await api.get(
          `/api/game/game-type/flip-tiles/${id}`,
        );
        const game = gameResponse.data.data;
        setGameData(game);

        if (game.tiles) {
          const palette = [
            "bg-red-500",
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-yellow-500",
            "bg-orange-500",
            "bg-teal-500",
            "bg-fuchsia-500",
            "bg-cyan-500",
            "bg-lime-500",
          ];
          setTiles(
            game.tiles.map((t: { label: string }, idx: number) => ({
              id: randomId(),
              label: t.label,
              flipped: false,
              removed: false,
              color: palette[idx % palette.length],
            })),
          );
        }

        try {
          await api.post("/api/game/play-count", { game_id: id });
        } catch (playErr) {
          console.warn("Play count update failed", playErr);
        }
      } catch (err: unknown) {
        console.error("Failed to load Flip Tiles game:", err);
        setError("Failed to load Flip Tiles game. Please try again.");
        toast.error("Failed to load Flip Tiles game");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGame();
    } else {
      // Fallback: show demo tiles so page isn't stuck loading
      const demoTiles = Array.from({ length: 12 }, (_, i) => ({
        label: `Demo ${i + 1}`,
      }));
      const palette = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-yellow-500",
        "bg-orange-500",
        "bg-teal-500",
        "bg-fuchsia-500",
        "bg-cyan-500",
        "bg-lime-500",
      ];
      setGameData({
        id: "demo",
        title: "Flip Tiles Demo",
        description: "Demo mode (no game id provided).",
        thumbnail_image: null,
        tiles: demoTiles,
      });
      setTiles(
        demoTiles.map((t, idx) => ({
          id: randomId(),
          label: t.label,
          flipped: false,
          removed: false,
          color: palette[idx % palette.length],
        })),
      );
      setLoading(false);
    }
  }, [id]);

  // Auto-hide intro sequence
  useEffect(() => {
    if (!loading && gameData) {
      const timer = scheduleTimeout(() => {
        setShowIntro(false);
      }, 3500); // 3.5s total intro duration
      return () => clearTimeout(timer);
    }
  }, [loading, gameData]);

  // Inject intro keyframes once while intro is visible
  useEffect(() => {
    if (!showIntro) return;
    const existing = document.getElementById("intro-styles");
    if (existing) return;
    const styleSheet = document.createElement("style");
    styleSheet.id = "intro-styles";
    styleSheet.innerText = `
      @keyframes spin-3d-enter {
        0% { transform: scale(0) rotateY(-90deg); opacity: 0; }
        100% { transform: scale(1) rotateY(0deg); opacity: 1; }
      }
      .letter-3d {
        transform-style: preserve-3d;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .letter-3d:hover {
        transform: scale(1.1) rotateY(180deg) !important;
      }
      .backface-hidden {
        backface-visibility: hidden !important;
        -webkit-backface-visibility: hidden !important;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      styleSheet.remove();
    };
  }, [showIntro]);

  const [tileHeight, setTileHeight] = useState(100);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute columns to fill available width. Use rounding to reduce unused right space.
  const [columns, setColumns] = useState(4);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const prevPositionsRef = useRef<Record<string, DOMRect>>({});

  // Responsive columns based on width
  useLayoutEffect(() => {
    function computeColumns() {
      const w = window.innerWidth; // full viewport width for better fill
      const minTile = 190; // target min width per tile
      const raw = Math.max(1, Math.min(tiles.length, Math.round(w / minTile)));
      const clamped = Math.min(5, raw); // enforce max 5 columns but stretch width
      setColumns(clamped);
    }
    computeColumns();
    window.addEventListener("resize", computeColumns);
    return () => window.removeEventListener("resize", computeColumns);
  }, [tiles.length]);

  // Width-based rectangular height (undo vertical fill)
  useEffect(() => {
    function computeRectangularHeight() {
      const viewportW = window.innerWidth - 48; // approximate horizontal padding
      if (columns === 0) return;
      const gap = 12;
      const tileWidth = (viewportW - (columns - 1) * gap) / columns;
      // Use the previous ratio 0.45 with sensible min
      const height = Math.max(88, Math.round(tileWidth * 0.45));
      setTileHeight(height);
    }
    computeRectangularHeight();
    window.addEventListener("resize", computeRectangularHeight);
    return () => window.removeEventListener("resize", computeRectangularHeight);
  }, [columns]);

  const flipTile = (tileId: string) => {
    setTiles((prev) =>
      prev.map((t) => {
        if (t.id !== tileId) return t;
        if (t.flipped) {
          return { ...t, flipped: false, justUnflipped: true };
        }
        return { ...t, flipped: true, justUnflipped: false };
      }),
    );
    // clear the one-shot unflip flag
    scheduleTimeout(() => {
      setTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, justUnflipped: false } : t)),
      );
    }, 400);
    // REMOVED: setZoomedTile(null); -> Keep modal open!
  };

  const removeTile = (tileId: string) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, justRemoved: true } : t)),
    );
    scheduleTimeout(() => {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === tileId ? { ...t, removed: true, justRemoved: false } : t,
        ),
      );
    }, 380);
    setZoomedTile(null); // Remove closes standardly
  };

  const restoreAll = () => {
    setTiles((prev) =>
      prev.map((t) =>
        t.removed
          ? { ...t, flipped: false, removed: false, justRestored: true }
          : { ...t, flipped: false },
      ),
    );
    scheduleTimeout(() => {
      setTiles((prev) => prev.map((t) => ({ ...t, justRestored: false })));
    }, 420);
    setSpinnerTarget(null);
    setZoomedTile(null);
  };

  const shuffleTiles = () => {
    // Capture current positions for FLIP (all tiles, including removed)
    const currentPositions: Record<string, DOMRect> = {};
    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (el) currentPositions[id] = el.getBoundingClientRect();
    });
    prevPositionsRef.current = currentPositions;
    setTiles((prev) => {
      // Shuffle entire array so removed placeholders also move
      const shuffled = shuffleArray(prev);
      return shuffled;
    });
  };

  const showAllFronts = () => {
    setTiles((prev) =>
      prev.map((t) => ({ ...t, flipped: false, justUnflipped: t.flipped })),
    );
    scheduleTimeout(() => {
      setTiles((prev) => prev.map((t) => ({ ...t, justUnflipped: false })));
    }, 400);
  };

  const showAllBacks = () => {
    setTiles((prev) => prev.map((t) => ({ ...t, flipped: true })));
  };

  const startAgain = () => {
    if (!gameData?.tiles) return;

    // Re-initialize tiles from gameData
    const palette = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-fuchsia-500",
      "bg-cyan-500",
      "bg-lime-500",
    ];
    setTiles(
      gameData.tiles.map((t: { label: string }, idx: number) => ({
        id: randomId(),
        label: t.label,
        flipped: false,
        removed: false,
        color: palette[idx % palette.length],
      })),
    );
    setZoomedTile(null);
    toast.success("Game restarted");
  };

  // Perform FLIP animation after reorder
  useLayoutEffect(() => {
    const prevPositions = prevPositionsRef.current;
    if (!Object.keys(prevPositions).length) return;
    const newPositions: Record<string, DOMRect> = {};
    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (el) newPositions[id] = el.getBoundingClientRect();
    });
    Object.entries(newPositions).forEach(([id, newRect]) => {
      const prev = prevPositions[id];
      if (!prev) return;
      const dx = prev.left - newRect.left;
      const dy = prev.top - newRect.top;
      if (dx === 0 && dy === 0) return;
      const el = cardRefs.current[id];
      if (!el) return;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = "none";
      requestAnimationFrame(() => {
        el.style.transform = "translate(0,0)";
        el.style.transition = "transform 600ms cubic-bezier(.4,.2,.2,1)";
      });
    });
    prevPositionsRef.current = {};
  }, [tiles]);

  const spinRandom = () => {
    // Clear any existing spin
    if (spinnerIntervalRef.current) clearInterval(spinnerIntervalRef.current);

    const candidates = tiles.filter((t) => !t.removed);
    if (candidates.length === 0) return;
    const spins = 20;
    let idx = 0;

    spinnerIntervalRef.current = setInterval(() => {
      const pick = candidates[idx % candidates.length];
      setSpinnerTarget(pick.id);
      idx++;
      if (idx >= spins) {
        if (spinnerIntervalRef.current)
          clearInterval(spinnerIntervalRef.current);
        const finalPick =
          candidates[Math.floor(Math.random() * candidates.length)];
        setSpinnerTarget(finalPick.id);

        // Get the tile's position for zoom animation
        const tileElement = cardRefs.current[finalPick.id];
        if (tileElement) {
          const rect = tileElement.getBoundingClientRect();
          setZoomFromRect(rect);
        }

        setZoomedTile(finalPick.id); // auto-open after random spin finishes
      }
    }, 100);
  };

  const zoomedTileData = tiles.find((t) => t.id === zoomedTile);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center gap-4">
        <Typography variant="p">{error ?? "Game not found"}</Typography>
        <Button onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  // --- PHASE 1: INTRO SCREEN (NEW 3D TEXTURE DESIGN) ---
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden perspective-[1200px]">
        {/* Animated Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]"></div>

        {/* Moving Gradient blobs for atmosphere */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* FLIP Text */}
        <div
          className="flex gap-4 mb-8 relative z-10"
          style={{ perspective: "1000px" }}
        >
          {["F", "L", "I", "P"].map((char, i) => (
            <div
              key={i}
              className="letter-3d w-20 h-24 md:w-32 md:h-40 relative group cursor-default"
              style={{
                animation: `spin-3d-enter 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.15}s backwards`,
              }}
            >
              {/* Front Face */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-6xl md:text-8xl font-black text-white shadow-[0_0_25px_rgba(6,182,212,0.6),inset_0_2px_4px_rgba(255,255,255,0.5)] border-t border-white/40 backface-hidden z-20">
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 bg-repeat rounded-2xl mix-blend-overlay"></div>
                <span className="drop-shadow-2xl filter">{char}</span>
              </div>

              {/* Back Face Content (When flipped by hover) */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl flex items-center justify-center text-6xl md:text-8xl font-black text-white backface-hidden z-20"
                style={{ transform: "rotateY(180deg)" }}
              >
                ?
              </div>
            </div>
          ))}
        </div>

        {/* TILES Text */}
        <div
          className="flex gap-3 relative z-10"
          style={{ perspective: "1000px" }}
        >
          {["T", "I", "L", "E", "S"].map((char, i) => (
            <div
              key={i}
              className="letter-3d w-16 h-20 md:w-24 md:h-32 relative"
              style={{
                animation: `spin-3d-enter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.6 + i * 0.15}s backwards`,
              }}
            >
              {/* Custom colors for each letter */}
              <div
                className={`absolute inset-0 rounded-xl flex items-center justify-center text-4xl md:text-6xl font-black text-white shadow-[0_0_15px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.4)] border-t border-white/30 backface-hidden z-20 ${
                  [
                    "bg-gradient-to-br from-red-500 to-rose-700",
                    "bg-gradient-to-br from-amber-400 to-orange-600",
                    "bg-gradient-to-br from-emerald-400 to-green-700",
                    "bg-gradient-to-br from-violet-500 to-purple-700",
                    "bg-gradient-to-br from-fuchsia-400 to-pink-700",
                  ][i]
                }`}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-20 rounded-xl mix-blend-overlay"></div>
                <span className="drop-shadow-md">{char}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 relative z-10 animate-pulse">
          <div className="px-8 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/20 text-white font-bold tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] text-lg animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[1.5s] fill-mode-both">
            GET READY...
          </div>
        </div>
      </div>
    );
  }

  // --- PHASE 2: GAMEPLAY (Rendered after intro) RESTORED TO LIGHT THEME ---
  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-700 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-slate-600 hover:text-orange-600 font-medium transition-colors"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Exit Game
          </Button>

          {/* MENU BUTTON */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shadow-sm border-slate-300"
              >
                <Menu className="h-5 w-5 text-slate-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 shadow-xl border-slate-200"
            >
              <DropdownMenuLabel>FLIP TILES OPTIONS</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={showAllFronts}>
                Show all tile fronts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={showAllBacks}>
                Show all tile backs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shuffleTiles}>
                Shuffle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={spinRandom}>
                Random spinner
              </DropdownMenuItem>
              <DropdownMenuItem onClick={restoreAll}>
                Restore eliminated
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={startAgain}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start again
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="mb-8 text-center">
          <Typography
            variant="h1"
            className="mb-2 border-none text-4xl font-black tracking-tight text-slate-800 drop-shadow-sm"
          >
            {gameData.title}
          </Typography>
          <Typography variant="muted" className="text-lg">
            {gameData.description}
          </Typography>

          <div className="flex justify-center gap-3 mt-6">
            <Button
              variant="outline"
              className="shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border-slate-300 bg-white"
              onClick={shuffleTiles}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                <polyline points="21 12 16.5 14.6 16.5 19.79" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Shuffle
            </Button>
            <Button
              variant="outline"
              className="shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border-slate-300 bg-white"
              onClick={spinRandom}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Random Spinner
            </Button>
          </div>
        </div>

        {/* Tiles Grid with 3D animation */}
        <div
          className="w-full border-0 bg-transparent p-4 h-[calc(100vh-260px)] overflow-visible"
          style={{ perspective: "1000px" }}
        >
          <div
            ref={containerRef}
            className="grid w-full h-full content-start"
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: 16,
            }}
          >
            {tiles.map((tile) => {
              if (tile.justRemoved) {
                return (
                  <div
                    key={tile.id}
                    ref={(r) => {
                      cardRefs.current[tile.id] = r;
                    }}
                    className="flex items-center justify-center opacity-0 scale-50 transition-all duration-500 ease-in-out"
                    style={{ height: tileHeight }}
                  ></div>
                );
              }
              if (tile.removed) {
                return (
                  <div
                    key={tile.id}
                    ref={(r) => {
                      cardRefs.current[tile.id] = r;
                    }}
                    className="rounded-xl bg-slate-200/50 inner-shadow-sm"
                    style={{ height: tileHeight }}
                  ></div>
                );
              }
              return (
                <div
                  key={tile.id}
                  ref={(r) => {
                    cardRefs.current[tile.id] = r;
                  }}
                  className={`group relative cursor-pointer px-0.5 py-0.5 ${
                    spinnerTarget === tile.id
                      ? "z-20 scale-105"
                      : "hover:z-20 hover:scale-[1.03] hover:-translate-y-1"
                  } transition-all duration-300 ease-out`}
                  style={{
                    height: tileHeight,
                    perspective: "1000px",
                  }}
                  onClick={() => {
                    if (gameData.tiles.length === 0) return;
                    const el = cardRefs.current[tile.id];
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      setZoomFromRect(rect);
                    }
                    setZoomedTile(tile.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault(); // Prevent scroll on Space
                      const el = cardRefs.current[tile.id];
                      if (el) {
                        const rect = el.getBoundingClientRect();
                        setZoomFromRect(rect);
                      }
                      setZoomedTile(tile.id);
                    }
                  }}
                >
                  <div
                    className="w-full h-full relative transition-all duration-700 rounded-xl"
                    style={{
                      transformStyle: "preserve-3d",
                      // Fix flip logic: if flipped (true) -> show back (180deg), if !flipped (false) -> show front (0deg)
                      transform: tile.flipped
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                    }}
                  >
                    {/* Front Face (Label / Color) - Visible at 0deg */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-xl flex items-center justify-center font-bold text-white shadow-md border-t border-white/30 ${tile.color} bg-gradient-to-br from-white/10 to-black/5 p-4 text-center leading-snug break-words`}
                      style={{
                        backfaceVisibility: "hidden", // Crucial: hide when flipped
                        WebkitBackfaceVisibility: "hidden",
                        fontSize: `clamp(0.8rem, ${tileHeight / 90}rem, 1.25rem)`,
                        textShadow: "0 2px 2px rgba(0,0,0,0.2)",
                        transform: "rotateY(0deg)", // Enforce front orientation
                      }}
                    >
                      {tile.label}
                    </div>

                    {/* Back Face (Question Mark) - Visible at 180deg */}
                    <div
                      className="absolute inset-0 w-full h-full bg-slate-800 rounded-xl flex items-center justify-center font-black text-white shadow-md border-t border-white/10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 to-slate-900"
                      style={{
                        backfaceVisibility: "hidden", // Crucial: hide when facing away
                        WebkitBackfaceVisibility: "hidden",
                        fontSize: `clamp(1.5rem, ${tileHeight / 50}rem, 3rem)`,
                        transform: "rotateY(180deg)", // Pre-rotated to match flipped state
                      }}
                    >
                      <span className="drop-shadow-lg opacity-80">?</span>
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    </div>
                  </div>

                  {/* Spinner Ring Effect (Thinner) */}
                  {spinnerTarget === tile.id && (
                    <div className="absolute -inset-1 border-[3px] border-sky-400 rounded-2xl animate-pulse pointer-events-none"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {tiles.length > 0 && tiles.every((t) => t.removed) && (
          <GameCompleteOverlay onRestart={restoreAll} />
        )}
      </div>

      {zoomedTile && zoomedTileData && zoomFromRect && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-slate-900/60 ${zoomLeaving ? "pointer-events-none" : ""}`}
          onClick={() => {
            setZoomLeaving(true);
            scheduleTimeout(() => {
              setZoomedTile(null);
              setZoomFromRect(null);
              setZoomLeaving(false);
            }, 300);
          }}
        >
          <div
            className={`${zoomLeaving ? "zoom-overlay-exit" : "zoom-overlay-enter"} relative rounded-2xl shadow-2xl flex flex-col bg-transparent`} // Made bg transparent for 3D card wrapper
            style={{
              width: "min(90vw, 420px)",
              ...({
                "--from-transform": `translate(${zoomFromRect.left + zoomFromRect.width / 2}px, ${
                  zoomFromRect.top + zoomFromRect.height / 2
                }px) translate(-50%, -50%) scale(${Math.min(
                  zoomFromRect.width / 420,
                  zoomFromRect.height / 420,
                )})`,
              } as React.CSSProperties),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 3D WRAPPER FOR ZOOMED CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-6">
              <div className="w-full aspect-square relative perspective-[1000px]">
                <div
                  className="w-full h-full relative transition-all duration-700 rounded-xl"
                  style={{
                    transformStyle: "preserve-3d",
                    // Animate FLIP in sync with state
                    transform: zoomedTileData.flipped
                      ? "rotateY(180deg)"
                      : "rotateY(0deg)",
                  }}
                >
                  {/* Front Face (Zoom) */}
                  <div
                    className={`absolute inset-0 w-full h-full backface-hidden rounded-xl flex items-center justify-center font-bold text-white shadow-inner border-4 border-slate-100 ${zoomedTileData.color} bg-gradient-to-br from-white/10 to-black/5`}
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(0deg)",
                    }}
                  >
                    <div className="p-8 text-center leading-tight break-words w-full max-h-full overflow-y-auto flex items-center justify-center text-4xl md:text-5xl">
                      {zoomedTileData.label}
                    </div>
                  </div>

                  {/* Back Face (Zoom) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-slate-800 backface-hidden rounded-xl flex items-center justify-center font-black text-white shadow-inner border-4 border-slate-700/50"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span className="text-6xl md:text-8xl drop-shadow-lg opacity-80">
                      ?
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1 h-12 text-lg font-bold shadow-sm"
                  variant="outline"
                  onClick={() => flipTile(zoomedTileData.id)} // This now only flips state, doesn't close modal
                >
                  {zoomedTileData.flipped ? "Reveal" : "Hide"}
                </Button>
                <Button
                  className="flex-1 h-12 text-lg font-bold shadow-md bg-red-500 hover:bg-red-600 text-white border-none"
                  onClick={() => removeTile(zoomedTileData.id)} // This still closes modal
                >
                  Remove
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              className="absolute -top-12 right-0 text-white hover:bg-white/10"
              onClick={() => {
                setZoomLeaving(true);
                scheduleTimeout(() => {
                  setZoomedTile(null);
                  setZoomFromRect(null);
                  setZoomLeaving(false);
                }, 300);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component to prevent re-renders of random values
function GameCompleteOverlay({ onRestart }: { onRestart: () => void }) {
  // Generate stable random values once
  const confettiItems = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      width: Math.random() * 10 + 5,
      height: Math.random() * 10 + 5,
      bg: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899"][
        Math.floor(Math.random() * 6)
      ],
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
      {/* Confetti Particles */}
      {confettiItems.map((item) => (
        <div
          key={item.id}
          className="absolute top-0"
          style={{
            left: `${item.left}%`,
            top: `-20px`,
            width: `${item.width}px`,
            height: `${item.height}px`,
            backgroundColor: item.bg,
            transform: `rotate(${item.rotation}deg)`,
            animation: `confetti-fall ${item.duration}s linear infinite`,
            animationDelay: `${item.delay}s`,
          }}
        />
      ))}

      {/* Completion Card */}
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 md:p-12 text-center animate-in zoom-in-50 slide-in-from-bottom-10 fade-in duration-500 pointer-events-auto max-w-lg w-full mx-auto relative overflow-hidden">
        {/* Shine effect on card */}
        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_2.5s_infinite]"></div>

        <div className="mb-8 flex justify-center relative">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="w-28 h-28 bg-gradient-to-b from-yellow-100 to-orange-100 rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(251,191,36,0.2)] border-4 border-yellow-200 animate-bounce relative z-10">
            <span className="text-6xl drop-shadow-sm">🏆</span>
          </div>
        </div>

        <Typography
          variant="h2"
          className="text-5xl font-black text-slate-800 mb-3 drop-shadow-sm tracking-tight"
        >
          Game Clear!
        </Typography>
        <Typography
          variant="muted"
          className="text-xl text-slate-600 mb-10 font-medium max-w-sm mx-auto leading-relaxed"
        >
          You've successfully cleared all the tiles. Great Job!
        </Typography>

        <Button
          size="lg"
          className="w-full h-14 text-xl font-bold bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl"
          onClick={onRestart}
        >
          <RotateCcw className="w-6 h-6 mr-3 animate-spin-slow" />
          Play Again
        </Button>
      </div>

      {/* Inject Confetti Keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(150%) skewX(-12deg); }
        }
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
