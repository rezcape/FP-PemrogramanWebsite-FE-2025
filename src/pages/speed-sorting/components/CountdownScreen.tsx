interface CountdownScreenProps {
  countdown: number;
}

export function CountdownScreen({ countdown }: CountdownScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 space-y-6 text-cyan-100">
      <div className="uppercase tracking-[0.35em] text-xs sm:text-sm text-cyan-200/80">
        Initializing
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-4">
        Get Ready
      </h2>
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-cyan-500/30 rounded-full" />
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-cyan-400/60 bg-white/5 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.6)]">
          <div className="text-6xl sm:text-7xl font-black text-cyan-100 animate-pulse drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">
            {countdown}
          </div>
        </div>
      </div>
    </div>
  );
}
