// PATH: src/pages/open-the-box/GameComponents.tsx
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, Check, Settings } from "lucide-react";

export interface BoxContent {
  id: string | number;
  text: string;
  options: string[];
  answer: string;
}

export type BoxStatus = "closed" | "correct" | "wrong";

interface BoxProps {
  index: number; // Index diterima di interface
  status: BoxStatus;
  text: string;
  onClick: () => void;
  layoutId?: string;
}

// --- KOMPONEN KARTU (BOX ITEM) FIXED ---
export const BoxItem = ({
  //index, // FIX: Index diterima disini
  status,
  onClick,
  layoutId,
}: BoxProps) => {
  const isClickable = status === "closed";

  return (
    // [PENTING] Class 'group' wajib ada di sini agar anak-anaknya tahu saat di-hover
    <div className="relative w-full h-full perspective-1000 group z-10">
      <motion.div
        layout
        layoutId={layoutId}
        onClick={isClickable ? onClick : undefined}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        whileHover={isClickable ? { y: -5, zIndex: 20 } : {}}
        animate={{
          rotateY: status !== "closed" ? 180 : 0,
          x: status === "wrong" ? [0, -10, 10, -10, 10, 0] : 0,
          scale: status === "correct" ? [1, 1.05, 1] : 1,
          boxShadow:
            status === "correct"
              ? "0 0 40px rgba(234, 179, 8, 0.5)" // Glow Emas
              : status === "wrong"
                ? "0 0 30px rgba(185, 28, 28, 0.5)" // Glow Merah
                : "0 10px 20px rgba(0,0,0,0.3)",
        }}
        transition={{
          layout: { duration: 0.4, ease: "easeInOut" },
          rotateY: { type: "spring", stiffness: 200, damping: 20 },
          x: { duration: 0.4, ease: "easeInOut" },
          scale: { duration: 0.5 },
          boxShadow: { duration: 0.5 },
        }}
        className={cn(
          "w-full aspect-square rounded-xl transition-all flex flex-col items-center justify-center relative overflow-hidden",
          "bg-black",
          status === "closed"
            ? "border border-amber-800/40" // 🟤 Belum dijawab (Emas Redup)
            : status === "correct"
              ? "border-1 border-amber-400 dark:border-amber-500" // 🟡 Jika BENAR (Emas Terang)
              : "border-2 border-red-600 dark:border-red-700", // 🔴 Jika SALAH (Merah)
        )}
      >
        {/* --- LAYER GAMBAR BACKGROUND --- */}
        {status === "closed" && (
          <div
            className={cn(
              "absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-500 scale-110 group-hover:scale-125 group-hover:blur-sm",
              "bg-[url('/images/card-light-sq.png')] dark:bg-[url('/images/card-dark-sq.png')]",
            )}
          />
        )}

        <AnimatePresence mode="wait">
          {/* --- TAMPILAN TERTUTUP (OPEN STATE) --- */}
          {status === "closed" && (
            <motion.div
              key="closed"
              //initial={{ opacity: 0 }}
              //animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              // [BAGIAN PERBAIKAN ANDA]
              // opacity-0 = Awalnya hilang
              // group-hover:opacity-100 = Muncul saat mouse masuk area 'group'
              className="z-10 flex flex-col items-center justify-center w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
            >
              <div className="relative transform group-hover:scale-110 transition-transform duration-500">
                {/* Teks Utama */}
                <div className="text-lg font-serif tracking-[0.35em] text-amber-50 font-medium drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                  OPEN
                </div>
                {/* Glow Belakang */}
                <div className="absolute inset-0 text-lg font-serif tracking-[0.35em] text-amber-300/60 font-medium blur-sm -z-10">
                  OPEN
                </div>
                {/* Garis Hiasan */}
                <div className="mt-2 mx-auto w-12 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>

                {/* Opsi: Jika ingin menampilkan nomor urut (Index) */}
                {/* <div className="mt-2 text-xs text-amber-200/50 font-mono">{index + 1}</div> */}
              </div>
            </motion.div>
          )}

          {/* --- TAMPILAN BENAR --- */}
          {status === "correct" && (
            <motion.div
              key="correct"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ transform: "rotateY(180deg)" }}
              className="w-full h-full flex flex-col items-center justify-center z-10 p-4 text-center bg-stone-100 dark:bg-black cursor-default"
            >
              <div className="rounded-full border-2 border-amber-500/50 p-3 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-100/30 dark:bg-amber-900/20">
                <Check
                  className="w-8 h-8 text-amber-600 dark:text-amber-400"
                  strokeWidth={3}
                />
              </div>
              <div className="text-base font-serif font-bold text-amber-800 dark:text-amber-100 tracking-widest uppercase drop-shadow-md">
                Divine
              </div>
            </motion.div>
          )}

          {/* --- TAMPILAN SALAH --- */}
          {status === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ transform: "rotateY(180deg)" }}
              className="w-full h-full flex flex-col items-center justify-center z-10 p-4 text-center bg-stone-100 dark:bg-black cursor-not-allowed"
            >
              <div className="rounded-full border-2 border-red-800/60 dark:border-red-900/60 p-3 mb-3 bg-red-100/40 dark:bg-red-950/30">
                <Lock
                  className="w-8 h-8 text-red-800 dark:text-red-700"
                  strokeWidth={2}
                />
              </div>
              <div className="text-base font-serif font-bold text-red-900 dark:text-red-800 tracking-widest uppercase drop-shadow-sm">
                Locked
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ... (Sisa kode QuestionModal dan SettingsModal biarkan sama seperti sebelumnya)

// --- 2. MODAL SOAL (QUESTION MODAL) ---
interface QuestionModalProps {
  content: BoxContent;
  timeLeft: number;
  onAnswer: (text: string) => void;
}

export const QuestionModal = ({
  content,
  timeLeft,
  onAnswer,
}: QuestionModalProps) => {
  if (!content) return null;

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / 30;
  const dashOffset = circumference - progress * circumference;
  const isUrgent = timeLeft <= 10;

  const timerColor = isUrgent
    ? "text-red-500"
    : "text-stone-700 dark:text-amber-100";
  const ringColor = isUrgent
    ? "stroke-red-500"
    : "stroke-stone-700 dark:stroke-amber-500";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      style={{ zIndex: 9999 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-[#F3F1E8] dark:bg-[#1a1a1a] rounded-xl w-full max-w-3xl shadow-2xl flex flex-col md:flex-row min-h-[400px] border border-stone-300 dark:border-amber-900/40 overflow-hidden"
      >
        <div className="absolute top-4 right-4 z-20 flex items-center justify-center pointer-events-none">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-stone-300 dark:text-stone-800"
              />
              <motion.circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="3"
                fill="currentColor"
                strokeLinecap="round"
                className={cn(
                  "transition-colors duration-300 fill-[#F3F1E8] dark:fill-[#1a1a1a]",
                  ringColor,
                )}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: "linear" }}
                style={{ strokeDasharray: circumference }}
              />
            </svg>
            <div
              className={cn(
                "absolute text-lg font-serif font-bold",
                timerColor,
              )}
            >
              {timeLeft}
            </div>
          </div>
        </div>

        <div className="md:w-5/12 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-black dark:to-[#111] flex flex-col items-center justify-center p-8 text-center border-b md:border-b-0 md:border-r border-stone-300 dark:border-amber-900/30 relative">
          <h2 className="text-stone-500 dark:text-amber-700 text-sm font-bold tracking-[0.3em] uppercase mb-6 font-serif">
            The Riddle
          </h2>
          <div className="text-5xl md:text-6xl font-serif text-stone-800 dark:text-amber-100 drop-shadow-sm leading-tight">
            {content.text}
          </div>
        </div>

        <div className="md:w-7/12 p-6 md:p-8 pt-16 md:pt-8 flex flex-col justify-center bg-[#FDFBF7] dark:bg-[#141414] gap-3 md:gap-4 relative">
          <h4 className="text-stone-400 text-sm font-medium text-center mb-4 font-serif italic tracking-wider">
            Choose your fate
          </h4>
          <div className="grid gap-3">
            {content.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onAnswer(opt)}
                className="w-full py-4 px-6 text-lg font-serif text-stone-600 dark:text-stone-400 bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-stone-800 rounded-lg hover:border-amber-500 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-100 hover:bg-amber-50 dark:hover:bg-black transition-all text-center tracking-wide group shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- 3. SETTINGS MODAL ---
interface SettingsModalProps {
  onResume: () => void;
  onRestart: () => void;
}

export const SettingsModal = ({ onResume, onRestart }: SettingsModalProps) => {
  return (
    <div
      onClick={onResume}
      className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F3F1E8] dark:bg-[#1a1a1a] p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border border-stone-300 dark:border-stone-800"
      >
        <div className="w-16 h-16 bg-white dark:bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-300 dark:border-stone-800">
          <Settings className="w-6 h-6 text-stone-400 animate-spin-slow" />
        </div>
        <h2 className="text-xl font-serif text-stone-800 dark:text-white mb-2 tracking-widest uppercase">
          Paused
        </h2>
        <div className="space-y-4 mt-8">
          <Button
            onClick={onResume}
            className="w-full bg-stone-800 hover:bg-stone-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white py-6 text-lg font-serif tracking-wider"
          >
            RESUME
          </Button>
          <Button
            onClick={onRestart}
            variant="outline"
            className="w-full py-6 text-lg border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 font-serif tracking-wider"
          >
            RESTART
          </Button>
        </div>
      </div>
    </div>
  );
};
