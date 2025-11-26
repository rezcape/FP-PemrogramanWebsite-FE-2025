import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import type { GameStatus, Player, Cloud, GeneralQuestion, GameMode } from '../types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 50;
const CLOUD_WIDTH = 150;
const CLOUD_HEIGHT = 80;
const SPAWN_RATE = 2500;

export const useGeneralGameEngine = () => {
  const [gameState, setGameState] = useState<GameStatus>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('general');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const [questions, setQuestions] = useState<GeneralQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const playerRef = useRef<Player>({ x: 50, y: CANVAS_HEIGHT / 2, width: PLAYER_SIZE, height: PLAYER_SIZE });
  const cloudsRef = useRef<Cloud[]>([]);
  const requestRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 50, y: CANVAS_HEIGHT / 2 });

  const generateMathQuestion = (): GeneralQuestion => {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const isPlus = Math.random() > 0.5;
      const ans = isPlus ? a + b : a - b;
      
      const wrongs = new Set<string>();
      while(wrongs.size < 3) {
          const w = ans + Math.floor(Math.random() * 10) - 5;
          if (w !== ans) wrongs.add(String(w));
      }

      return {
          question: `${a} ${isPlus ? '+' : '-'} ${b} = ?`,
          correctAnswer: String(ans),
          wrongAnswers: Array.from(wrongs)
      };
  };

  const startGeneralGame = async () => {
    setGameState('loading');
    try {
        console.log("🔍 Fetching from http://localhost:4000/api/game ...");
        const response = await axios.get('http://localhost:4000/api/game');
        
        const games = response.data.data;
        const generalGame = games.find((g: any) => 
            g.name?.toLowerCase().includes('airplane') || 
            g.game_template?.slug === 'airplane'
        );

        if (generalGame) {
           let gData = generalGame.game_json;
           
           if (typeof gData === 'string') {
              try { gData = JSON.parse(gData); } catch (e) { console.error(e); }
           }

           let foundQuestions = Array.isArray(gData) ? gData : [];
           if (foundQuestions.length === 0 && Array.isArray(gData?.questions)) foundQuestions = gData.questions;
           if (foundQuestions.length === 0 && Array.isArray(gData?.game_data?.questions)) foundQuestions = gData.game_data.questions;

           if (foundQuestions.length > 0) {
             setQuestions(foundQuestions);
             setGameState('playing');
           } else {
             console.error("No questions found. Using fallback.");
             useFallbackData();
           }
        } else {
           useFallbackData();
        }
    } catch (error) {
        console.error("Network Error", error);
        useFallbackData();
    }
  };

  const useFallbackData = () => {
    setQuestions([
        { question: "Ibukota Indonesia?", correctAnswer: "Jakarta", wrongAnswers: ["Bali", "Medan"] },
        { question: "Warna langit cerah?", correctAnswer: "Biru", wrongAnswers: ["Merah", "Hijau"] }
    ]);
    setGameState('playing');
  };

  const startGame = (mode: GameMode) => {
      setGameMode(mode);
      setScore(0);
      setLives(3);
      setCurrentQIndex(0);
      cloudsRef.current = [];
      playerRef.current = { x: 50, y: CANVAS_HEIGHT / 2, width: PLAYER_SIZE, height: PLAYER_SIZE };

      if (mode === 'math') {
          setQuestions([generateMathQuestion()]);
          setGameState('playing');
      } else {
          startGeneralGame();
      }
  };

  const getCurrentQuestion = () => {
      if (gameMode === 'math') return questions[0];
      return questions[currentQIndex];
  };

  const spawnCloud = (timestamp: number) => {
    if (timestamp - lastSpawnTimeRef.current > SPAWN_RATE && questions.length > 0) {
      const currentQ = getCurrentQuestion();
      if (!currentQ) return;

      const isCorrect = Math.random() > 0.6;
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
        y: Math.random() * (CANVAS_HEIGHT - CLOUD_HEIGHT),
        width: CLOUD_WIDTH,
        height: CLOUD_HEIGHT,
        text: text,
        isCorrect: isCorrect,
        speed: 3,
      };

      cloudsRef.current.push(newCloud);
      lastSpawnTimeRef.current = timestamp;
    }
  };

  const updatePhysics = () => {
    const player = playerRef.current;
    const target = mousePosRef.current;
    player.x += (target.x - player.x) * 0.1;
    player.y += (target.y - player.y) * 0.1;

    cloudsRef.current.forEach(cloud => { cloud.x -= cloud.speed; });
    cloudsRef.current = cloudsRef.current.filter(c => c.x + c.width > -50);
  };

  const checkCollisions = () => {
    const player = playerRef.current;
    const clouds = cloudsRef.current;
    
    for (let i = clouds.length - 1; i >= 0; i--) {
      const cloud = clouds[i];
      if (
        player.x < cloud.x + cloud.width &&
        player.x + player.width > cloud.x &&
        player.y < cloud.y + cloud.height &&
        player.y + player.height > cloud.y
      ) {
        if (cloud.isCorrect) {
          setScore(s => s + 10);
          cloudsRef.current = [];
          
          if (gameMode === 'math') {
              setQuestions([generateMathQuestion()]);
          } else {
              if (currentQIndex < questions.length - 1) setCurrentQIndex(prev => prev + 1);
              else setCurrentQIndex(0);
          }
        } else {
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
    if (gameState === 'playing') requestRef.current = requestAnimationFrame(gameLoop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, gameLoop]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left - PLAYER_SIZE / 2,
      y: e.clientY - rect.top - PLAYER_SIZE / 2
    };
  };

  return {
    gameState,
    gameMode,
    score,
    lives,
    question: getCurrentQuestion(),
    player: playerRef.current,
    clouds: cloudsRef.current,
    handleMouseMove,
    startGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    pauseGame: () => setGameState('paused'),
    resumeGame: () => setGameState('playing')
  };
};