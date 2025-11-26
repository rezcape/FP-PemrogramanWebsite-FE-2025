import { useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/UI/HUD';
import { PauseModal } from './components/UI/PauseModal';
import { GameOverModal } from './components/UI/GameOverModal';
import { Button } from '@/components/ui/button';
import { Pause } from 'lucide-react';
import axios from 'axios';

const AirplaneMathGame = () => {
  const {
    gameState,
    score,
    lives,
    question,
    player,
    clouds,
    handleMouseMove,
    pauseGame,
    resumeGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  } = useGameEngine();

  // Handle Exit Logic
  const handleExit = async () => {
    try {
      // Attempt to update play count
      // Note: Using axios or fetch as per preference, simple fetch is fine too.
      await axios.post('http://localhost:3000/api/game/play-count');
    } catch (error) {
      console.error("Failed to update play count:", error);
    } finally {
      // Always redirect even if API fails
      window.location.href = '/';
    }
  };

  const handleRestart = () => {
    window.location.reload(); // Simple reload to restart for now
  };

  // Keyboard pause toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') pauseGame();
        else if (gameState === 'paused') resumeGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, pauseGame, resumeGame]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="relative rounded-xl overflow-hidden ring-8 ring-slate-800/50">
        
        {/* Game Canvas */}
        <GameCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          player={player}
          clouds={clouds}
          onMouseMove={handleMouseMove}
        />

        {/* HUD Layer */}
        <HUD score={score} lives={lives} question={question} />

        {/* Pause Button (Visible during gameplay) */}
        {gameState === 'playing' && (
          <Button 
            size="icon" 
            variant="secondary" 
            className="absolute top-4 right-4 rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform z-10"
            onClick={pauseGame}
          >
            <Pause className="h-6 w-6 text-slate-700" />
          </Button>
        )}

        {/* Modals */}
        {gameState === 'paused' && (
          <PauseModal onResume={resumeGame} onExit={handleExit} />
        )}

        {gameState === 'gameover' && (
          <GameOverModal score={score} onExit={handleExit} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
};

export default AirplaneMathGame;
