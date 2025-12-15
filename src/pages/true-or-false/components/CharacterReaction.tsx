import { motion, AnimatePresence } from "framer-motion";

import HappyImg from "../assets/correct.png";
import SadImg from "../assets/wrong.png";

export const CharacterReaction = ({
  feedback,
}: {
  feedback: "correct" | "wrong" | null;
}) => {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-0 left-0 z-50 pointer-events-none" // Posisi di Kiri Bawah
        >
          {/* Container Gambar */}
          <div className="relative w-48 md:w-64 lg:w-80">
            <img
              src={feedback === "correct" ? HappyImg : SadImg}
              alt="Character Reaction"
              className="w-full h-full object-contain drop-shadow-2xl"
            />

            {/* Bubble Dialog (Opsional) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-10 -right-10 bg-white text-slate-900 p-4 rounded-3xl rounded-bl-none shadow-xl border-4 border-slate-900 font-black text-xl md:text-2xl"
            >
              {feedback === "correct" ? "YESS!!" : "NOOO..."}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
