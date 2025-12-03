import { useGeneralGameEngine } from './hooks/useGeneralGameEngine';
import { GameCanvas } from './components/GameCanvas'; 
import { PauseModal } from './components/UI/PauseModal'; 
import { GameOverModal } from './components/UI/GameOverModal';
import { Button } from '@/components/ui/button';
import { Pause, Plane, Calculator, Globe } from 'lucide-react';

const AirplaneGeneralGame = () => {
  const {
    gameState,
    score,
    lives,
    question,
    player,
    clouds,
    pauseGame,
    resumeGame,
    startGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  } = useGeneralGameEngine();

  const handleExit = async () => {
    window.location.href = '/';
  };

  const handleRestart = () => {
      window.location.reload(); 
  };

  // --- MENU SCREEN ---
  if (gameState === 'menu') {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/20">
                <div className="flex justify-center mb-6">
                    <div className="bg-sky-500 p-5 rounded-full animate-bounce shadow-[0_0_30px_rgba(14,165,233,0.6)]">
                        <Plane className="w-16 h-16 text-white" fill="white" />
                    </div>
                </div>
                
                <h1 className="text-4xl font-black text-white mb-2 tracking-wider drop-shadow-md">SKY ACE</h1>
                <p className="text-sky-200 mb-8 font-medium">Pilih Misi Penerbanganmu!</p>
                
                <div className="space-y-4">
                    <Button 
                        onClick={() => startGame('math')} 
                        className="w-full h-20 text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <Calculator className="mr-3 w-8 h-8" /> 
                        Soal Matematika
                    </Button>
                    
                    <Button 
                        onClick={() => startGame('general')} 
                        className="w-full h-20 text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <Globe className="mr-3 w-8 h-8" /> 
                        Pengetahuan Umum
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  // --- MAIN GAME ---
  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4 select-none">
      <div className="relative rounded-xl shadow-2xl">
        
        {/* Canvas Render Layer */}
        <GameCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          player={player}
          clouds={clouds}
        />

        {/* UI Overlay (HUD) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            
            {/* Header Bar */}
            <div className="flex justify-between items-start p-6">
                
                {/* Left: Stats & Pause */}
                <div className="flex flex-col gap-3 pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur border-2 border-slate-900 text-slate-900 px-4 py-2 rounded-xl font-black text-xl shadow-lg min-w-[120px]">
                        ⭐ {score}
                    </div>
                    <div className="bg-red-500 text-white border-2 border-red-700 px-4 py-2 rounded-xl font-bold text-xl shadow-lg min-w-[120px]">
                        ❤️ {lives}
                    </div>

                    {/* PAUSE BUTTON (Below Stats) */}
                    {gameState === 'playing' && (
                        <Button 
                            size="icon" 
                            className="rounded-xl h-12 w-12 bg-amber-400 hover:bg-amber-500 text-slate-900 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                            onClick={pauseGame}
                        >
                            <Pause className="h-6 w-6 fill-current" />
                        </Button>
                    )}
                </div>

                {/* Center: Question */}
                <div className="bg-slate-900/90 text-white border-2 border-sky-400 px-8 py-4 rounded-2xl text-2xl font-bold shadow-[0_0_20px_rgba(56,189,248,0.5)] max-w-xl text-center leading-tight">
                   {question?.question || "Loading..."}
                </div>

                {/* Right: Controls Hint (Static) */}
                <div className="bg-black/40 text-white/80 px-3 py-2 rounded-lg text-sm font-mono backdrop-blur-sm border border-white/10">
                    Controls:<br/>
                    [↑] UP<br/>
                    [↓] DOWN
                </div>
            </div>
        </div>

        {/* Modals */}
        {gameState === 'paused' && <PauseModal onResume={resumeGame} onExit={handleExit} />}
        {gameState === 'gameover' && <GameOverModal score={score} onExit={handleExit} onRestart={handleRestart} />}
        
      </div>
    </div>
  );
};

export default AirplaneGeneralGame;