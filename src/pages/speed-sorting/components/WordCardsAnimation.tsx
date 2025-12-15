import { Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WordItem } from "../hooks/useSpeedSortingGame";

interface WordCardsAnimationProps {
  words: WordItem[];
  speed: number;
  draggedItem: string | null;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, wordId: string) => void;
  onDragEnd: () => void;
}

export function WordCardsAnimation({
  words,
  speed,
  draggedItem,
  onDragStart,
  onDragEnd,
}: WordCardsAnimationProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [singleWidth, setSingleWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  const repeatedWords = useMemo(() => {
    if (!words.length || !singleWidth)
      return words.length ? [...words, ...words] : [];
    const copies = Math.max(2, Math.ceil(containerWidth / singleWidth) + 1);
    return Array(copies).fill(words).flat();
  }, [words, singleWidth, containerWidth]);

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      const childCount = el.childElementCount || 1;
      const avgCardWidth = el.scrollWidth / childCount;
      const sequenceWidth = (avgCardWidth || 0) * (words.length || 1); // full cycle width of unique words
      const safeWidth = sequenceWidth || 1;
      setSingleWidth((prevWidth) =>
        prevWidth === safeWidth ? prevWidth : safeWidth,
      );
      setOffset((prev) => {
        const widthVal = safeWidth;
        if (!widthVal) return prev;
        const normalized = ((prev % widthVal) + widthVal) % widthVal;
        return normalized - widthVal;
      });
      const containerEl = containerRef.current;
      if (containerEl) setContainerWidth(containerEl.clientWidth || 0);
    };

    const resizeObserver = new ResizeObserver(() => measure());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", measure);
    document.addEventListener("fullscreenchange", measure);
    measure();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("fullscreenchange", measure);
    };
  }, [words.length]);

  useEffect(() => {
    if (!singleWidth) return;

    let rafId: number;
    let lastTs = performance.now();
    const pixelsPerSecond = 240 * speed;

    const tick = (ts: number) => {
      const delta = ts - lastTs;
      lastTs = ts;
      setOffset((prev) => {
        let next = prev + (delta / 1000) * pixelsPerSecond;
        if (next >= 0) next -= singleWidth;
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [singleWidth, speed]);

  return (
    <div className="mb-6 sm:mb-8 lg:mb-12 overflow-hidden" ref={containerRef}>
      <div className="relative h-24 sm:h-32 lg:h-40">
        <div
          className="flex gap-4 absolute whitespace-nowrap will-change-transform"
          ref={trackRef}
          style={{
            transform: `translateX(${offset}px)`,
            width: "max-content",
          }}
        >
          {repeatedWords.map((word, index) => {
            const canDrag = !word.completed;

            return (
              <div
                key={`${word.id}-${index}`}
                data-skip-click-sound
                draggable={canDrag}
                onDragStart={
                  canDrag ? (e) => onDragStart(e, word.id) : undefined
                }
                onDragEnd={canDrag ? onDragEnd : undefined}
                className={`relative overflow-hidden rounded-lg sm:rounded-xl text-sm sm:text-lg lg:text-2xl font-semibold sm:font-bold transition-all shrink-0 
                  w-[120px] h-20 sm:w-[150px] sm:h-[100px] lg:w-[200px] lg:h-[140px] 
                  flex items-center justify-center ${
                    !word.completed
                      ? `bg-white/5 text-slate-100 border sm:border-2 border-cyan-400/30 cursor-move shadow-[0_15px_60px_-40px_rgba(59,130,246,0.9)] ${
                          draggedItem
                            ? ""
                            : "hover:border-cyan-200/80 hover:shadow-[0_20px_80px_-50px_rgba(16,185,129,0.9)]"
                        }`
                      : "bg-emerald-500/15 text-emerald-200 border sm:border-2 border-emerald-300/70 shadow-[0_15px_60px_-45px_rgba(16,185,129,0.9)]"
                  }`}
                style={{
                  opacity: draggedItem === word.id ? 0.3 : 1,
                }}
              >
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.14),transparent_40%)]" />
                {word.completed ? (
                  <Check className="w-4 h-4 sm:w-6 sm:h-6 lg:w-10 lg:h-10" />
                ) : word.type === "image" && word.imageUrl ? (
                  <img
                    src={word.imageUrl}
                    alt={word.text}
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                  />
                ) : (
                  word.text
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
