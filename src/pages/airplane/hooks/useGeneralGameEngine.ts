import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStatus, Player, Cloud, GeneralQuestion, GameMode } from '../types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE_W = 80;
const PLAYER_SIZE_H = 60;
const PLAYER_X_POS = 100; // Static X Position
const CLOUD_WIDTH = 160;
const CLOUD_HEIGHT = 90;
const SPAWN_RATE = 2000;
const GRAVITY_FRICTION = 0.92;
const ACCELERATION = 1.5;
const MAX_SPEED = 12;

// --- DATASETS ---
const GEN_Z_QUESTIONS: GeneralQuestion[] = [
    { question: "Makanan viral yang pedesnya minta ampun, kerupuk basah?", correctAnswer: "Seblak", wrongAnswers: ["Gacoan", "Bakso", "Cilok"] },
    { question: "Istilah buat orang yang punya aura magis lucu?", correctAnswer: "Cek Khodam", wrongAnswers: ["Cek Kolesterol", "Cek Rekening", "Skibidi"] },
    { question: "Siapa nama asli 'Mulyono' yang sering disebut netizen?", correctAnswer: "Jokowi", wrongAnswers: ["Prabowo", "Gibran", "Kaesang"] },
    { question: "Kata gaul buat orang yang karismatik banget?", correctAnswer: "Rizz", wrongAnswers: ["Cringe", "Salty", "FOMO"] },
    { question: "Kalau baterai HP tinggal 1% namanya?", correctAnswer: "Lowbat", wrongAnswers: ["Sekarat", "Meninggoy", "Sleep"] },
    { question: "Apa kepanjangan dari OVT?", correctAnswer: "Overthinking", wrongAnswers: ["Oven Toaster", "Over Time", "OVO"] },
    { question: "Raja Jawa yang sering dijadikan meme 'Agak Laen'?", correctAnswer: "Tidak Ada", wrongAnswers: ["Hayam Wuruk", "Mulyono", "Fufufafa"] },
    { question: "Makanan pokok anak kos di akhir bulan?", correctAnswer: "Mie Instan", wrongAnswers: ["Steak", "Sushi", "Pizza"] }
];

// --- ASSETS (Local) ---
const SFX_CORRECT_URL = "/assets/game/airplane/correct.mp3";
// Fallback wrong sound if you don't have a local one yet, or use a placeholder
const SFX_WRONG_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_02.wav"; 
const BGM_URL = "/assets/game/airplane/bgm.mp3";

export const useGeneralGameEngine = () => {
  const [gameState, setGameState] = useState<GameStatus>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('general');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const [questions, setQuestions] = useState<GeneralQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Physics Refs
  const playerRef = useRef<Player>({ 
      x: PLAYER_X_POS, 
      y: CANVAS_HEIGHT / 2, 
      width: PLAYER_SIZE_W, 
      height: PLAYER_SIZE_H,
      vy: 0,
      targetY: CANVAS_HEIGHT / 2
  });
  
  const cloudsRef = useRef<Cloud[]>([]);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Audio Refs
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // --- AUDIO MANAGEMENT ---
  
  // Initialize BGM on mount
  useEffect(() => {
      const audio = new Audio(BGM_URL);
      audio.loop = true;
      audio.volume = 0.4; // 40% volume
      bgmRef.current = audio;

      return () => {
          audio.pause();
          audio.currentTime = 0;
      };
  }, []);

  // Handle BGM State
  useEffect(() => {
      const audio = bgmRef.current;
      if (!audio) return;

      if (gameState === 'playing') {
          // Use a promise to handle autoplay policies safely
          audio.play().catch(err => console.log("Autoplay prevented:", err));
      } else if (gameState === 'gameover' || gameState === 'menu') {
          audio.pause();
          audio.currentTime = 0;
      } else if (gameState === 'paused') {
          audio.pause();
      }
  }, [gameState]);

  const playSfx = (type: 'correct' | 'wrong') => {
      const url = type === 'correct' ? SFX_CORRECT_URL : SFX_WRONG_URL;
      const audio = new Audio(url);
      audio.volume = 0.6;
      audio.play().catch(() => {});
  };

  // --- GAME LOGIC ---

  const generateMathQuestion = (): GeneralQuestion => {
      const ops = ['+', '-', 'x', '/', '^'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a = 0, b = 0, ans = 0;
      let qStr = "";

      switch(op) {
          case '+':
              a = Math.floor(Math.random() * 20) + 1;
              b = Math.floor(Math.random() * 20) + 1;
              ans = a + b;
              qStr = `${a} + ${b} = ?`;
              break;
          case '-':
              a = Math.floor(Math.random() * 20) + 10;
              b = Math.floor(Math.random() * 10) + 1;
              ans = a - b;
              qStr = `${a} - ${b} = ?`;
              break;
          case 'x':
              a = Math.floor(Math.random() * 10) + 2;
              b = Math.floor(Math.random() * 9) + 2;
              ans = a * b;
              qStr = `${a} x ${b} = ?`;
              break;
          case '/':
              b = Math.floor(Math.random() * 9) + 2;
              ans = Math.floor(Math.random() * 10) + 1;
              a = b * ans; // Ensure clean division
              qStr = `${a} / ${b} = ?`;
              break;
          case '^':
              a = Math.floor(Math.random() * 6) + 2; // Base 2-7
              b = 2; // Power 2 for simplicity
              ans = Math.pow(a, b);
              qStr = `${a}² = ?`;
              break;
      }

      const wrongs = new Set<string>();
      while(wrongs.size < 3) {
          const diff = Math.floor(Math.random() * 10) - 5;
          const w = ans + (diff === 0 ? 1 : diff);
          wrongs.add(String(w));
      }

      return {
          question: qStr,
          correctAnswer: String(ans),
          wrongAnswers: Array.from(wrongs)
      };
  };

  const startGame = (mode: GameMode) => {
      setGameMode(mode);
      setScore(0);
      setLives(3);
      setCurrentQIndex(0);
      cloudsRef.current = [];
      playerRef.current = { 
          x: PLAYER_X_POS, 
          y: CANVAS_HEIGHT / 2, 
          width: PLAYER_SIZE_W, 
          height: PLAYER_SIZE_H,
          vy: 0,
          targetY: CANVAS_HEIGHT / 2 
      };

      if (mode === 'math') {
          setQuestions([generateMathQuestion()]);
      } else {
          // Shuffle Gen Z questions
          setQuestions([...GEN_Z_QUESTIONS].sort(() => Math.random() - 0.5));
      }
      setGameState('playing');
  };

  const getCurrentQuestion = () => {
      if (gameMode === 'math') return questions[0];
      return questions[currentQIndex];
  };

  const spawnCloud = (timestamp: number) => {
    if (timestamp - lastSpawnTimeRef.current > SPAWN_RATE) {
      const currentQ = getCurrentQuestion();
      if (!currentQ) return;

      const isCorrect = Math.random() > 0.65; 
      let text = "";
      
      if (isCorrect) {
          text = currentQ.correctAnswer;
      } else {
          const rand = Math.floor(Math.random() * currentQ.wrongAnswers.length);
          text = currentQ.wrongAnswers[rand];
      }

      const newCloud: Cloud = {
        id: Math.random().toString(36).substr(2, 9),
        x: CANVAS_WIDTH + 50,
        y: Math.random() * (CANVAS_HEIGHT - CLOUD_HEIGHT - 50) + 25,
        width: CLOUD_WIDTH,
        height: CLOUD_HEIGHT,
        text: text,
        isCorrect: isCorrect,
        speed: 4 + (score / 100),
      };

      const hasOverlap = cloudsRef.current.some(c => 
          Math.abs(c.x - newCloud.x) < 100 && Math.abs(c.y - newCloud.y) < 100
      );

      if (!hasOverlap) {
          cloudsRef.current.push(newCloud);
          lastSpawnTimeRef.current = timestamp;
      }
    }
  };

  const updatePhysics = () => {
    const player = playerRef.current;
    
    // Input
    if (keysRef.current['ArrowUp']) {
        player.vy -= ACCELERATION;
    } else if (keysRef.current['ArrowDown']) {
        player.vy += ACCELERATION;
    }

    // Friction
    player.vy *= GRAVITY_FRICTION;

    // Cap Velocity
    if (player.vy > MAX_SPEED) player.vy = MAX_SPEED;
    if (player.vy < -MAX_SPEED) player.vy = -MAX_SPEED;

    // Position
    player.y += player.vy;

    // Boundaries
    if (player.y < 0) {
        player.y = 0;
        player.vy *= -0.5;
    }
    if (player.y + player.height > CANVAS_HEIGHT) {
        player.y = CANVAS_HEIGHT - player.height;
        player.vy *= -0.5;
    }

    // Update Clouds
    cloudsRef.current.forEach(cloud => { cloud.x -= cloud.speed; });
    cloudsRef.current = cloudsRef.current.filter(c => c.x + c.width > -100);
  };

  const checkCollisions = () => {
    const player = playerRef.current;
    const clouds = cloudsRef.current;
    const hitboxPadding = 15; // Forgiving hitbox
    
    for (let i = clouds.length - 1; i >= 0; i--) {
      const cloud = clouds[i];
      if (
        player.x + hitboxPadding < cloud.x + cloud.width &&
        player.x + player.width - hitboxPadding > cloud.x &&
        player.y + hitboxPadding < cloud.y + cloud.height &&
        player.y + player.height - hitboxPadding > cloud.y
      ) {
        if (cloud.text === getCurrentQuestion()?.correctAnswer) {
          setScore(s => s + 10);
          playSfx('correct');
          cloudsRef.current = []; 
          
          if (gameMode === 'math') {
              setQuestions([generateMathQuestion()]);
          } else {
              if (currentQIndex < questions.length - 1) setCurrentQIndex(prev => prev + 1);
              else {
                  setQuestions([...GEN_Z_QUESTIONS].sort(() => Math.random() - 0.5));
                  setCurrentQIndex(0);
              }
          }
        } else {
          playSfx('wrong');
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) setGameState('gameover');
            return newLives;
          });
          cloudsRef.current.splice(i, 1);
        }
      }
    }
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState === 'playing') {
      spawnCloud(timestamp);
      updatePhysics();
      checkCollisions();
      setTick(t => t + 1); 
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, currentQIndex, questions, gameMode]);

  const [tick, setTick] = useState(0);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
      const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, gameLoop]);

  return {
    gameState,
    gameMode,
    score,
    lives,
    question: getCurrentQuestion(),
    player: playerRef.current,
    clouds: cloudsRef.current,
    startGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    pauseGame: () => setGameState('paused'),
    resumeGame: () => setGameState('playing')
  };
};