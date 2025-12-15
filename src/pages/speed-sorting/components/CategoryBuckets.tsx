import { Check, X } from "lucide-react";
import type { Category, DropFeedback } from "../hooks/useSpeedSortingGame";

interface CategoryBucketsProps {
  categories: Category[];
  hoveredCategory: string | null;
  dropFeedback: DropFeedback | null;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, categoryId: string) => void;
}

export function CategoryBuckets({
  categories,
  hoveredCategory,
  dropFeedback,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: CategoryBucketsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
      {categories.map((category) => (
        <div
          key={category.id}
          onDragOver={onDragOver}
          onDragEnter={(e) => onDragEnter(e, category.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, category.id)}
          className={`
            relative overflow-hidden bg-white/5 text-cyan-50 border border-cyan-400/30 rounded-xl lg:rounded-2xl 
            px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-8
            text-sm sm:text-lg lg:text-2xl font-semibold sm:font-bold text-center cursor-pointer
            transform transition-all duration-200 hover:scale-105 shadow-[0_20px_80px_-50px_rgba(59,130,246,0.9)]
            w-full sm:w-auto min-w-[140px] sm:min-w-40 lg:min-w-[200px]
            min-h-20 sm:min-h-[120px] lg:min-h-[140px]
            flex items-center justify-center backdrop-blur-lg
            ${
              dropFeedback?.categoryId === category.id
                ? dropFeedback.isCorrect
                  ? "scale-125 border-emerald-400/80 bg-emerald-500/10 shadow-[0_25px_90px_-50px_rgba(16,185,129,0.9)]"
                  : "scale-90 border-rose-400/80 bg-rose-500/10 shadow-[0_25px_90px_-50px_rgba(244,63,94,0.9)]"
                : hoveredCategory === category.id
                  ? "scale-110 border-cyan-300/80 bg-cyan-500/10 shadow-[0_20px_80px_-50px_rgba(6,182,212,0.9)]"
                  : "border-cyan-400/30"
            }
          `}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.12),transparent_45%)]" />
          {dropFeedback?.categoryId === category.id && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse">
              <div
                className={`flex items-center justify-center rounded-full h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 shadow-2xl border-4 backdrop-blur-md transition-all duration-200
                  ${dropFeedback.isCorrect ? "bg-emerald-400/90 border-white/90 text-white" : "bg-rose-400/90 border-white/90 text-white"}`}
              >
                {dropFeedback.isCorrect ? (
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
                ) : (
                  <X className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
                )}
              </div>
            </div>
          )}
          {category.name}
        </div>
      ))}
    </div>
  );
}
