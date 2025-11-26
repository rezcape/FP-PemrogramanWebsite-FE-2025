import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, GameStatus, Player, Cloud, MathQuestion } from '../types';

const CANVAS_WIDTH = 800; // Logical width
const CANVAS_HEIGHT = 600; // Logical height
const PLAYER_SIZE = 50;
const CLOUD_WIDTH = 100;
const CLOUD_HEIGHT = 60;
const SPAWN_RATE = 2000; // ms

const generateQuestion = (): MathQuestion => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const operator = Math.random() > 0.5 ? '+' : '-';
  // Ensure positive result for subtraction
  const [n1, n2] = operator === '-' && b > a ? [b, a] : [a, b];
  
  return {
    question: `${n1} ${operator} ${n2}`,
    answer: operator === '+' ? n1 + n2 : n1 - n2,
  };
};

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameStatus>('playing');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  
  // Using refs for high-frequency updates to avoid stale closures in loop
  const playerRef = useRef<Player>({ x: 50, y: CANVAS_HEIGHT / 2, width: PLAYER_SIZE, height: PLAYER_SIZE });
  const cloudsRef = useRef<Cloud[]>([]);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 50, y: CANVAS_HEIGHT / 2 });
  const questionRef = useRef<MathQuestion | null>(null);

  // Initialize game
  useEffect(() => {
    const q = generateQuestion();
    setQuestion(q);
    questionRef.current = q;
  }, []);

  const spawnCloud = (timestamp: number) => {
    if (timestamp - lastSpawnTimeRef.current > SPAWN_RATE) {
      const isCorrect = Math.random() > 0.5; 
      // If we don't have a "correct" cloud on screen, force one? 
      // For simplicity: pure random. User might miss it, but that's part of game or we can improve logic.
      // Better logic: If no correct cloud exists, next one MUST be correct.
      
      const hasCorrect = cloudsRef.current.some(c => c.isCorrect);
      const shouldBeCorrect = !hasCorrect || (Math.random() > 0.7);

      const value = shouldBeCorrect && questionRef.current
        ? questionRef.current.answer 
        : Math.floor(Math.random() * 20); // Random wrong answer

      // Ensure wrong answer is strictly not the correct one
      const finalValue = !shouldBeCorrect && questionRef.current && value === questionRef.current.answer 
        ? value + 1 
        : value;

      const newCloud: Cloud = {
        id: Math.random().toString(36).substr(2, 9),
        x: CANVAS_WIDTH + 50,
        y: Math.random() * (CANVAS_HEIGHT - CLOUD_HEIGHT),
        width: CLOUD_WIDTH,
        height: CLOUD_HEIGHT,
        value: finalValue,
        isCorrect: shouldBeCorrect,
        speed: 2 + Math.random() * 2,
      };

      cloudsRef.current.push(newCloud);
      lastSpawnTimeRef.current = timestamp;
    }
  };

  const updatePhysics = () => {
    // Update Player Position (Lerp towards mouse)
    const player = playerRef.current;
    const target = mousePosRef.current;
    
    // Simple smoothing
    player.x += (target.x - player.x) * 0.1;
    player.y += (target.y - player.y) * 0.1;

    // Clamp to bounds
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

    // Update Clouds
    cloudsRef.current.forEach(cloud => {
      cloud.x -= cloud.speed;
    });

    // Remove off-screen clouds
    cloudsRef.current = cloudsRef.current.filter(c => c.x + c.width > -50);
  };

  const checkCollisions = () => {
    const player = playerRef.current;
    const clouds = cloudsRef.current;
    const currentQ = questionRef.current;

    if (!currentQ) return;

    for (let i = clouds.length - 1; i >= 0; i--) {
      const cloud = clouds[i];
      
      if (
        player.x < cloud.x + cloud.width &&
        player.x + player.width > cloud.x &&
        player.y < cloud.y + cloud.height &&
        player.y + player.height > cloud.y
      ) {
        // Collision!
        if (cloud.value === currentQ.answer) {
          // Correct!
          setScore(s => s + 10);
          // New Question
          const newQ = generateQuestion();
          setQuestion(newQ);
          questionRef.current = newQ;
          // Clear clouds to reset 'round' or just keep going? Wordwall usually keeps going.
          // Maybe remove just this cloud?
          cloudsRef.current.splice(i, 1);
          // Sound effect placeholder
          console.log("Correct!");
        } else {
          // Wrong!
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('gameover');
            }
            return newLives;
          });
          cloudsRef.current.splice(i, 1);
          // Shake effect placeholder
          console.log("Wrong!");
        }
      }
    }
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState === 'playing') {
      spawnCloud(timestamp);
      updatePhysics();
      checkCollisions();
      
      // Force React Re-render to show updates
      // Note: SetState in loop can be heavy. 
      // For 60fps simple game, we often separate 'Logic Loop' from 'Render Loop' or just rely on React.
      // To make it smoother, we'll return the refs directly for the Canvas to read, 
      // and only trigger re-renders for Score/Lives/Question changes (which are handled by their own setStates above).
      // BUT, we need to re-render the entities (clouds/player). 
      // So we need a 'tick' state or similar.
      setTick(t => t + 1); 

      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState]);

  const [tick, setTick] = useState(0); // Used to force re-render

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left - PLAYER_SIZE / 2,
      y: e.clientY - rect.top - PLAYER_SIZE / 2
    };
  };

  const pauseGame = () => setGameState('paused');
  const resumeGame = () => setGameState('playing');

  return {
    gameState,
    score,
    lives,
    question,
    player: playerRef.current,
    clouds: cloudsRef.current,
    handleMouseMove,
    pauseGame,
    resumeGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  };
};
