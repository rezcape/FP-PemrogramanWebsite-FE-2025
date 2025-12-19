import { useState, useEffect, useRef, useCallback } from "react";
import type { GameStatus, Player, Cloud, MathQuestion } from "../types";

const CANVAS_WIDTH = 800; // Logical width
const CANVAS_HEIGHT = 600; // Logical height
const PLAYER_SIZE = 50;
const CLOUD_WIDTH = 100;
const CLOUD_HEIGHT = 60;
const SPAWN_RATE = 2000; // ms

const generateQuestion = (): MathQuestion => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const operator = Math.random() > 0.5 ? "+" : "-";

  const [n1, n2] = operator === "-" && b > a ? [b, a] : [a, b];

  return {
    question: `${n1} ${operator} ${n2}`,
    answer: operator === "+" ? n1 + n2 : n1 - n2,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useGeneralGameEngine = (_gameId?: string) => {
  const [gameState, setGameState] = useState<GameStatus>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [gameMode, setGameMode] = useState<"math" | "general">("math");

  const playerRef = useRef<Player>({
    x: 50,
    y: CANVAS_HEIGHT / 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
  });
  const cloudsRef = useRef<Cloud[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({
    x: 50,
    y: CANVAS_HEIGHT / 2,
  });
  const questionRef = useRef<MathQuestion | null>(null);

  const startGame = (mode: "math" | "general") => {
    setGameMode(mode);
    setScore(0);
    setLives(3);
    cloudsRef.current = [];
    playerRef.current = {
      x: 50,
      y: CANVAS_HEIGHT / 2,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
    };

    const q = generateQuestion();
    setQuestion(q);
    questionRef.current = q;

    setGameState("playing");
  };

  const spawnCloud = (timestamp: number) => {
    if (timestamp - lastSpawnTimeRef.current > SPAWN_RATE) {
      const hasCorrect = cloudsRef.current.some((c) => c.isCorrect);
      const shouldBeCorrect = !hasCorrect || Math.random() > 0.7;

      const value =
        shouldBeCorrect && questionRef.current
          ? questionRef.current.answer
          : Math.floor(Math.random() * 20);

      const finalValue =
        !shouldBeCorrect &&
        questionRef.current &&
        value === questionRef.current.answer
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
    const player = playerRef.current;
    const target = mousePosRef.current;

    // Simple smoothing
    player.x += (target.x - player.x) * 0.1;
    player.y += (target.y - player.y) * 0.1;

    // Clamp to bounds
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

    cloudsRef.current.forEach((cloud) => {
      cloud.x -= cloud.speed;
    });

    cloudsRef.current = cloudsRef.current.filter((c) => c.x + c.width > -50);
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
        if (cloud.value === currentQ.answer) {
          setScore((s) => s + 10);
          const newQ = generateQuestion();
          setQuestion(newQ);
          questionRef.current = newQ;
          cloudsRef.current.splice(i, 1);
        } else {
          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState("gameover");
            }
            return newLives;
          });
          cloudsRef.current.splice(i, 1);
        }
      }
    }
  };

  const [, setTick] = useState(0);

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (gameState === "playing") {
        spawnCloud(timestamp);
        updatePhysics();
        checkCollisions();
        setTick((t) => t + 1);
        requestRef.current = requestAnimationFrame(gameLoop);
      }
    },

    [gameState],
  );

  useEffect(() => {
    if (gameState === "playing") {
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
      y: e.clientY - rect.top - PLAYER_SIZE / 2,
    };
  };

  const pauseGame = () => setGameState("paused");
  const resumeGame = () => setGameState("playing");

  return {
    gameState,
    gameMode,
    score,
    lives,
    question,
    player: playerRef.current,
    clouds: cloudsRef.current,
    handleMouseMove,
    pauseGame,
    resumeGame,
    startGame,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  };
};
