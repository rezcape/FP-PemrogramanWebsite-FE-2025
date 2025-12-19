import { useState, useEffect, useRef, useCallback } from "react";
import type {
  GameStatus,
  Player,
  Cloud,
  GeneralQuestion,
  GameMode,
} from "../types";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE_W = 80;
const PLAYER_SIZE_H = 60;
const PLAYER_X_POS = 100;
const CLOUD_WIDTH = 160;
const CLOUD_HEIGHT = 90;
const SPAWN_RATE = 2000;
const GRAVITY_FRICTION = 0.92;
const ACCELERATION = 1.5;
const MAX_SPEED = 12;
const HITBOX_PADDING = 20;
const HIT_DURATION = 600;

const SFX_CORRECT_URL = "/assets/game/airplane/sfx-correct.mp3";
const SFX_WRONG_URL =
  "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/explosion_02.wav";
const BGM_URL = "/assets/game/airplane/bgm.mp3";

export const useGeneralGameEngine = (customQuestions: GeneralQuestion[]) => {
  const [gameState, setGameState] = useState<GameStatus>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("general");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const [questions, setQuestions] = useState<GeneralQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const playerRef = useRef<Player>({
    x: PLAYER_X_POS,
    y: CANVAS_HEIGHT / 2,
    width: PLAYER_SIZE_W,
    height: PLAYER_SIZE_H,
    vy: 0,
    targetY: CANVAS_HEIGHT / 2,
  });

  const cloudsRef = useRef<Cloud[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const [hit, setHit] = useState<{ x: number; y: number; t: number } | null>(
    null,
  );
  const [successHit, setSuccessHit] = useState<{
    x: number;
    y: number;
    t: number;
  } | null>(null);

  useEffect(() => {
    const audio = new Audio(BGM_URL);
    audio.loop = true;
    audio.volume = 0.4;
    bgmRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (gameState === "playing") audio.play().catch(() => {});
    else if (gameState === "gameover" || gameState === "menu") {
      audio.pause();
      audio.currentTime = 0;
    } else if (gameState === "paused") audio.pause();
  }, [gameState]);

  const playSfx = (type: "correct" | "wrong") => {
    const url = type === "correct" ? SFX_CORRECT_URL : SFX_WRONG_URL;
    new Audio(url).play().catch(() => {});
  };

  const generateMathQuestion = (): GeneralQuestion => {
    const ops = ["+", "-", "x"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0,
      b = 0,
      ans = 0,
      qStr = "";

    switch (op) {
      case "+":
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        ans = a + b;
        qStr = `${a} + ${b} = ?`;
        break;
      case "-":
        a = Math.floor(Math.random() * 20) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        ans = a - b;
        qStr = `${a} - ${b} = ?`;
        break;
      case "x":
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 9) + 2;
        ans = a * b;
        qStr = `${a} x ${b} = ?`;
        break;
    }

    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = ans + Math.floor(Math.random() * 10) - 5;
      if (w !== ans) wrongs.add(String(w));
    }
    return {
      question: qStr,
      correctAnswer: String(ans),
      wrongAnswers: Array.from(wrongs),
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
      targetY: CANVAS_HEIGHT / 2,
    };

    if (mode === "math") {
      setQuestions([generateMathQuestion()]);
    } else {
      if (customQuestions && customQuestions.length > 0) {
        setQuestions([...customQuestions].sort(() => Math.random() - 0.5));
      } else {
        setQuestions([
          {
            question: "No Question",
            correctAnswer: "OK",
            wrongAnswers: ["A", "B", "C"],
          },
        ]);
      }
    }
    setGameState("playing");
  };

  const getCurrentQuestion = useCallback(() => {
    if (gameMode === "math") return questions[0];
    return questions[currentQIndex];
  }, [gameMode, questions, currentQIndex]);

  const spawnCloud = useCallback(
    (timestamp: number) => {
      if (timestamp - lastSpawnTimeRef.current > SPAWN_RATE) {
        const currentQ = getCurrentQuestion();
        if (!currentQ) return;

        const isCorrect = Math.random() > 0.6;
        const text = isCorrect
          ? currentQ.correctAnswer
          : currentQ.wrongAnswers[
              Math.floor(Math.random() * currentQ.wrongAnswers.length)
            ];

        const newCloud: Cloud = {
          id: Math.random().toString(36).substr(2, 9),
          x: CANVAS_WIDTH + 50,
          y: Math.random() * (CANVAS_HEIGHT - CLOUD_HEIGHT - 50) + 25,
          width: CLOUD_WIDTH,
          height: CLOUD_HEIGHT,
          text: text,
          isCorrect: isCorrect,
          speed: 4 + score / 100,
        };

        if (
          !cloudsRef.current.some(
            (c) =>
              Math.abs(c.x - newCloud.x) < 100 &&
              Math.abs(c.y - newCloud.y) < 100,
          )
        ) {
          cloudsRef.current.push(newCloud);
          lastSpawnTimeRef.current = timestamp;
        }
      }
    },
    [getCurrentQuestion, score],
  );

  const updatePhysics = () => {
    const player = playerRef.current;
    if (keysRef.current["ArrowUp"]) player.vy -= ACCELERATION;
    else if (keysRef.current["ArrowDown"]) player.vy += ACCELERATION;

    player.vy *= GRAVITY_FRICTION;
    if (player.vy > MAX_SPEED) player.vy = MAX_SPEED;
    if (player.vy < -MAX_SPEED) player.vy = -MAX_SPEED;
    player.y += player.vy;

    if (player.y < 0) {
      player.y = 0;
      player.vy *= -0.5;
    }
    if (player.y + player.height > CANVAS_HEIGHT) {
      player.y = CANVAS_HEIGHT - player.height;
      player.vy *= -0.5;
    }

    cloudsRef.current.forEach((cloud) => {
      cloud.x -= cloud.speed;
    });
    cloudsRef.current = cloudsRef.current.filter((c) => c.x + c.width > -100);
  };

  const checkCollisions = useCallback(() => {
    const player = playerRef.current;
    const clouds = cloudsRef.current;
    const hitboxReduction = HITBOX_PADDING;

    for (let i = clouds.length - 1; i >= 0; i--) {
      const cloud = clouds[i];

      if (
        player.x + hitboxReduction < cloud.x + cloud.width &&
        player.x + player.width - hitboxReduction > cloud.x + hitboxReduction &&
        player.y + hitboxReduction < cloud.y + cloud.height &&
        player.y + player.height - hitboxReduction > cloud.y + hitboxReduction
      ) {
        if (cloud.text === getCurrentQuestion()?.correctAnswer) {
          setScore((s) => s + 10);
          playSfx("correct");
          setSuccessHit({
            x: cloud.x + cloud.width / 2,
            y: cloud.y + cloud.height / 2,
            t: performance.now(),
          });
          cloudsRef.current = [];

          if (gameMode === "math") {
            setQuestions([generateMathQuestion()]);
          } else {
            if (currentQIndex < questions.length - 1)
              setCurrentQIndex((p) => p + 1);
            else {
              if (customQuestions && customQuestions.length > 0) {
                setQuestions(
                  [...customQuestions].sort(() => Math.random() - 0.5),
                );
              }
              setCurrentQIndex(0);
            }
          }
        } else {
          playSfx("wrong");
          setLives((l) => {
            const n = l - 1;
            if (n <= 0) setGameState("gameover");
            return n;
          });
          setHit({
            x: cloud.x + cloud.width / 2,
            y: cloud.y + cloud.height / 2,
            t: performance.now(),
          });
          cloudsRef.current.splice(i, 1);
        }
      }
    }
  }, [gameMode, questions, currentQIndex, customQuestions, getCurrentQuestion]);

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
    [gameState, spawnCloud, checkCollisions],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === "playing")
      requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (hit) {
      const timeout = setTimeout(() => setHit(null), HIT_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [hit]);
  useEffect(() => {
    if (successHit) {
      const timeout = setTimeout(() => setSuccessHit(null), HIT_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [successHit]);

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
    hit,
    successHit,
    pauseGame: () => setGameState("paused"),
    resumeGame: () => setGameState("playing"),
  };
};
