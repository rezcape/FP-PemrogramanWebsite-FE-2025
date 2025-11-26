import { useEffect } from 'react';
import { useGeneralGameEngine } from './hooks/useGeneralGameEngine';
import { GameCanvas } from './components/GameCanvas'; 
import { HUD } from './components/UI/HUD';
import { PauseModal } from './components/UI/PauseModal'; 
import { GameOverModal } from './components/UI/GameOverModal';
import { Button } from '@/components/ui/button';
import { Pause, Plane, Calculator, Globe } from 'lucide-react';

const AirplaneGeneralGame = () => {
  const {
    gameState,
    gameMode,
    score,
    lives,
    question,
    player,
    clouds,
    handleMouseMove,
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

  if (gameState === 'menu') {
    return (
        <div className="min-h-screen bg-sky-900 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full ring-8 ring-sky-800/50">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-4 rounded-full animate-bounce">
                        <Plane className="w-12 h-12 text-blue-600" />
                    </div>
                </div>
                
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Airplane Game</h1>
                <p className="text-slate-500 mb-8">Siap terbang kapten? Pilih misimu!</p>
                
                <div className="space-y-4">
                    <Button 
                        onClick={() => startGame('math')} 
                        className="w-full h-16 text-lg bg-emerald-500 hover:bg-emerald-600 transition-all hover:scale-105"
                    >
                        <Calculator className="mr-3 w-6 h-6" /> 
                        Misi Matematika
                    </Button>
                    
                    <Button 
                        onClick={() => startGame('general')} 
                        className="w-full h-16 text-lg bg-blue-500 hover:bg-blue-600 transition-all hover:scale-105"
                    >
                        <Globe className="mr-3 w-6 h-6" /> 
                        Misi Pengetahuan
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  if (gameState === 'loading') {
    return (
        <div className="min-h-screen bg-sky-900 flex flex-col items-center justify-center text-white">
            <div className="animate-spin mb-4">
                <Plane className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">Menyiapkan Pesawat...</h2>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-900 flex items-center justify-center p-4">
      <div className="relative rounded-xl overflow-hidden ring-8 ring-sky-800/50 shadow-2xl">
        
        <GameCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          player={player}
          clouds={clouds}
          onMouseMove={handleMouseMove}
        />

        <div className="absolute top-0 left-0 w-full p-4 flex justify-between text-white font-bold text-xl z-10 pointer-events-none select-none">
            <div className="bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                Score: <span className="text-yellow-400">{score}</span>
            </div>
            
            <div className="bg-blue-600/90 px-6 py-3 rounded-xl shadow-lg border border-blue-400 max-w-lg text-center mx-4 flex-1">
                {question?.question}
            </div>
            
            <div className="bg-red-500/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                Lives: {lives}
            </div>
        </div>

        {gameState === 'playing' && (
          <Button 
            size="icon" variant="secondary" 
            className="absolute top-4 right-4 rounded-full h-12 w-12 z-20 shadow-lg hover:scale-110 transition-transform"
            onClick={pauseGame}
          >
            <Pause className="h-6 w-6 text-slate-700" />
          </Button>
        )}

        {gameState === 'paused' && <PauseModal onResume={resumeGame} onExit={handleExit} />}
        {gameState === 'gameover' && <GameOverModal score={score} onExit={handleExit} onRestart={handleRestart} />}
        
      </div>
    </div>
  );
};

export default AirplaneGeneralGame;