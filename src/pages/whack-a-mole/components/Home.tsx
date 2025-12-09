import React from "react";

interface GameData {
  name?: string;
  description?: string;
}

interface HomeProps {
  onStart: () => void;
  gameData?: GameData;
}

const Home: React.FC<HomeProps> = ({ onStart, gameData }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center relative z-10 font-mono pb-16">
      {/* --- HERO SECTION (TERMINAL STYLE) --- */}
      <div className="text-center mb-12 w-full">
        <div className="inline-block border border-green-500/30 bg-black/50 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden group">
          {/* Efek Garis Scan Berjalan */}
          <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none"></div>

          <p className="text-green-500 text-sm mb-2 tracking-widest text-left">
            &gt; SYSTEM_INIT... SUCCESS <br />
            &gt; TARGET_DETECTED: ROGUE_ROBOTS <br />
            &gt; STATUS:{" "}
            <span className="text-red-500 animate-pulse font-bold">
              CRITICAL
            </span>
          </p>

          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)] mb-2 mt-4">
            WHACK A ROBO
          </h1>
          <p className="text-slate-400 text-lg tracking-widest uppercase border-t border-green-500/30 pt-4 mt-4">
            [ DEFENSE SYSTEM PROTOCOL V.1.0 ]
          </p>

          {gameData && (
            <div className="mt-4 text-cyan-400 text-sm">
              <p className="font-bold">{gameData.name}</p>
              <p className="text-slate-500 text-xs">{gameData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN ACTION BUTTON --- */}
      <div className="mb-16 relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-green-500 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
        <button
          onClick={onStart}
          className="relative bg-black border-2 border-cyan-500 hover:bg-cyan-500/10 text-cyan-400 font-bold text-2xl py-4 px-16 rounded-lg 
          shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] 
          transition-all duration-200 tracking-[0.2em] uppercase"
        >
          &gt; INITIALIZE_GAME_
        </button>
      </div>

      {/* --- GAME INFO --- */}
      <div className="w-full max-w-xl bg-black border border-green-800/50 rounded-lg p-1 shadow-2xl relative overflow-hidden">
        {/* Header Terminal */}
        <div className="bg-slate-900/80 px-4 py-2 flex justify-between items-center border-b border-green-900">
          <span className="text-xs text-slate-500">
            system_info: /game/instructions
          </span>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
        </div>

        <div className="p-6 bg-slate-950/90 relative">
          <h2 className="text-xl font-bold text-green-500 mb-6 flex items-center gap-2 border-b border-green-500/20 pb-2">
            <span className="animate-pulse">_</span> GAME INSTRUCTIONS
          </h2>

          <div className="text-slate-300 text-sm space-y-3 font-mono">
            <p className="text-green-400">
              &gt; OBJECTIVE: Eliminate rogue robots before time runs out!
            </p>

            <div className="space-y-2 pl-4">
              <p>
                <span className="text-cyan-400">🤖 Robot</span> = +1 point
              </p>
              <p>
                <span className="text-yellow-400">👺 King Ransomware</span> = +5
                points + 5 seconds
              </p>
              <p>
                <span className="text-orange-400">🛡️ Shield</span> = -3 points
                (DON'T HIT!)
              </p>
              <p className="text-cyan-400 font-bold">
                💥 Combo &gt;5x = RAMPAGE MODE (2x Score!)
              </p>
              <p className="text-red-400">⚠️ Miss = Combo Reset!</p>
            </div>

            <p className="text-yellow-500 pt-3 border-t border-slate-800">
              &gt; Game speed increases as you score more points!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
