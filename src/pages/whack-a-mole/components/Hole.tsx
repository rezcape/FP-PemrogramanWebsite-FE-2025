import React, { useState, useEffect } from "react";

interface HoleProps {
  isActive: boolean;
  type: "enemy" | "trap" | "golden" | "phishing" | "boss";
  onClick: () => void;
  isBoss?: boolean;
  isPhishing?: boolean;
}

const Hole: React.FC<HoleProps> = ({ isActive, type, onClick }) => {
  const [status, setStatus] = useState<"idle" | "hit" | "wrong">("idle");

  // STATE BARU: Menyimpan data teks melayang
  const [floatText, setFloatText] = useState<{
    val: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setStatus("idle");
    }
  }, [isActive]);

  const handleClick = () => {
    if (isActive && status === "idle") {
      // LOGIKA MENENTUKAN TEKS & WARNA
      let text = "";
      let colorClass = "";

      if (type === "boss") {
        text = "+30";
        colorClass =
          "text-purple-400 text-6xl drop-shadow-[0_0_15px_rgba(192,132,252,1)]";
        setStatus("hit");
        setTimeout(() => onClick(), 150);
      } else if (type === "golden") {
        text = "+5";
        colorClass =
          "text-yellow-400 text-5xl drop-shadow-[0_0_10px_rgba(250,204,21,1)]";
        setStatus("hit");
        setTimeout(() => onClick(), 150);
      } else if (type === "enemy") {
        text = "+1";
        colorClass =
          "text-green-400 text-4xl drop-shadow-[0_0_10px_rgba(74,222,128,1)]";
        setStatus("hit");
        setTimeout(() => onClick(), 150);
      } else if (type === "phishing") {
        text = "-5";
        colorClass =
          "text-red-500 text-4xl drop-shadow-[0_0_10px_rgba(239,68,68,1)]";
        setStatus("wrong");
        setTimeout(() => onClick(), 300);
      } else {
        text = "-3";
        colorClass =
          "text-red-500 text-4xl drop-shadow-[0_0_10px_rgba(239,68,68,1)]";
        setStatus("wrong");
        setTimeout(() => onClick(), 300);
      }

      // TAMPILKAN TEKS TERBANG
      setFloatText({ val: text, color: colorClass });

      // Hapus teks setelah animasi selesai (800ms)
      setTimeout(() => {
        setFloatText(null);
      }, 800);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full 
        flex justify-center items-center cursor-pointer select-none
        transition-all duration-200 border sm:border-2 md:border-4
        
        ${
          isActive && type === "boss"
            ? "border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.9)] scale-110"
            : isActive && type === "phishing"
              ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]"
              : isActive && type === "trap"
                ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                : isActive && type === "golden"
                  ? "border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.8)] scale-110"
                  : isActive
                    ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                    : "border-slate-700 bg-slate-900 shadow-inner"
        }
        bg-slate-900
      `}
    >
      <div className="absolute inset-2 rounded-full border border-slate-700 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-slate-800 to-black opacity-80"></div>

      {/* --- FLOATING TEXT --- */}
      {floatText && (
        <span className={`whack-animate-float ${floatText.color}`}>
          {floatText.val}
        </span>
      )}

      <div className="z-10 text-6xl sm:text-7xl flex justify-center items-center">
        {status === "hit" && (
          <span className="whack-animate-hit filter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
            {type === "boss" ? "💀" : type === "golden" ? "💰" : "💥"}
          </span>
        )}

        {status === "wrong" && (
          <span className="whack-animate-hit text-red-500 filter drop-shadow-[0_0_15px_rgba(239,68,68,1)] font-bold text-4xl">
            ERROR
          </span>
        )}

        {status === "idle" &&
          isActive &&
          (type === "boss" ? (
            <span className="whack-animate-pop whack-robot-glow cursor-pointer filter drop-shadow-[0_0_20px_rgba(168,85,247,1)] text-8xl scale-125">
              💎
            </span>
          ) : type === "golden" ? (
            <span className="whack-animate-pop whack-robot-glow cursor-pointer filter drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
              👺
            </span>
          ) : type === "phishing" ? (
            <span className="whack-animate-pop whack-robot-glow cursor-pointer filter drop-shadow-[0_0_15px_rgba(234,179,8,1)] opacity-90">
              🤖
            </span>
          ) : type === "trap" ? (
            <span className="whack-animate-pop filter drop-shadow-[0_0_10px_rgba(249,115,22,0.6)] cursor-pointer">
              🛡️
            </span>
          ) : (
            <span className="whack-animate-pop whack-robot-glow cursor-pointer">
              🤖
            </span>
          ))}
      </div>
    </div>
  );
};

export default Hole;
