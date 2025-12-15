// ==================== IMPORT ====================
import { useEffect, useRef } from "react";

// TILE texture (masih pakai punyamu)
import wallA from "../assets/maze/wall.jpeg";
import floorA from "../assets/maze/floor.jpeg";

import wallB from "../assets/maze/wall.jpeg";
import floorB from "../assets/maze/floor.jpeg";

import wallC from "../assets/maze/wall.jpeg";
import floorC from "../assets/maze/floor.jpeg";

// === PLAYER SPRITES ===
import walkFront from "../assets/sprites/player/Main_Character_Walk.png";
import walkFront2 from "../assets/sprites/player/Main_Character_Walk2.png";
import walkBack from "../assets/sprites/player/Main_Character_WalkBack.png";
import deathSprite from "../assets/sprites/player/Main_Character_Death_animation.png";

// === NPC SPRITES ===
import npcGhost from "../assets/sprites/npc/Enemies_Ghost_Walk.png";

const TILE_SIZE = 18;

type Direction = "up" | "down" | "left" | "right" | "death";

export interface AnswerTile {
  answer_text: string;
  answer_index: number;
  tileX: number;
  tileY: number;
}

interface MapsProps {
  mapId: string | number;
  controlDirection?: Direction | null;
  isPaused?: boolean;
  answers?: { answer_text: string; answer_index: number }[];
  onAnswerSelected?: (answerIndex: number) => void;
  onPlayerDeath?: () => void;
  isInvincible?: boolean;
}

// ==================== MAZE ====================
const MAP_LAYOUTS: Record<string, number[][]> = {
  "1": [
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
      0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
      0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1,
      0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
      0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1,
      0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
      0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
      0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1,
      0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
  ],

  "2": [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],

  "3": [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
};

const MAP_TEXTURES: Record<string, { wall: string; floor: string }> = {
  "1": { wall: wallA, floor: floorA },
  "2": { wall: wallB, floor: floorB },
  "3": { wall: wallC, floor: floorC },
};

// ==================== HELPER ====================
function isWalkable(map: number[][], x: number, y: number) {
  if (y < 0 || y >= map.length) return false;
  if (x < 0 || x >= map[0].length) return false;
  return map[y][x] === 0;
}

function getDelta(dir: Direction) {
  switch (dir) {
    case "up":
      return { dx: 0, dy: -1 };
    case "down":
      return { dx: 0, dy: 1 };
    case "left":
      return { dx: -1, dy: 0 };
    case "right":
      return { dx: 1, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

interface Entity {
  tileX: number;
  tileY: number;
  dir: Direction;
  moving: boolean;
  moveProgress: number;
  speed: number;
  frameIndex: number;
  frameTimer: number;
  isDying?: boolean;
  deathFrameIndex?: number;
  deathTimer?: number;
}

// ==================== SPRITE TYPES ====================
interface FrameRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

interface SpriteAnim {
  img: HTMLImageElement;
  frames: FrameRect[];
  flip?: boolean;
}

// ==================== SPRITE PLAYER ====================

function loadSprite(src: string) {
  const img = new Image();
  img.src = src;
  return img;
}

// ==================== SPRITE PLAYER (frame sudah fixed) ====================

// Walk depan (Main_Character_Walk.png)
const walkFrontFrames: FrameRect[] = [
  { sx: 2, sy: 1, sw: 79, sh: 101 },
  { sx: 84, sy: 1, sw: 79, sh: 101 },
  { sx: 167, sy: 1, sw: 79, sh: 101 },
  { sx: 247, sy: 1, sw: 83, sh: 101 },
  { sx: 333, sy: 1, sw: 79, sh: 101 },
  { sx: 415, sy: 1, sw: 79, sh: 101 },
  { sx: 3, sy: 103, sw: 79, sh: 101 },
  { sx: 85, sy: 103, sw: 79, sh: 101 },
  { sx: 167, sy: 103, sw: 79, sh: 101 },
  { sx: 248, sy: 103, sw: 82, sh: 101 },
  { sx: 333, sy: 103, sw: 80, sh: 101 },
  { sx: 416, sy: 103, sw: 80, sh: 101 },
];

// Walk samping (Main_Character_Walk2.png)
const walkSideFrames: FrameRect[] = [
  { sx: 2, sy: 1, sw: 78, sh: 101 },
  { sx: 83, sy: 1, sw: 79, sh: 101 },
  { sx: 167, sy: 1, sw: 77, sh: 101 },
  { sx: 248, sy: 1, sw: 78, sh: 101 },
  { sx: 330, sy: 1, sw: 78, sh: 101 },
  { sx: 412, sy: 1, sw: 79, sh: 101 },
  { sx: 2, sy: 103, sw: 79, sh: 101 },
  { sx: 84, sy: 103, sw: 79, sh: 101 },
  { sx: 167, sy: 103, sw: 79, sh: 101 },
  { sx: 250, sy: 103, sw: 78, sh: 101 },
  { sx: 332, sy: 103, sw: 79, sh: 101 },
  { sx: 415, sy: 103, sw: 79, sh: 101 },
];

// Walk belakang (Main_Character_WalkBack.png)
const walkBackFrames: FrameRect[] = [
  { sx: 10, sy: 0, sw: 75, sh: 101 },
  { sx: 94, sy: 0, sw: 75, sh: 101 },
  { sx: 173, sy: 0, sw: 75, sh: 101 },
  { sx: 251, sy: 0, sw: 75, sh: 101 },
  { sx: 329, sy: 0, sw: 75, sh: 101 },
  { sx: 412, sy: 0, sw: 74, sh: 101 },
  { sx: 8, sy: 103, sw: 75, sh: 100 },
  { sx: 91, sy: 103, sw: 75, sh: 100 },
  { sx: 173, sy: 103, sw: 75, sh: 100 },
  { sx: 250, sy: 103, sw: 74, sh: 100 },
  { sx: 332, sy: 103, sw: 74, sh: 100 },
  { sx: 412, sy: 103, sw: 75, sh: 100 },
];

// Death animation frames (Main_Character_Death_animation.png)
// Assuming 6 frames in a row, each ~80x100 pixels
const deathFrames: FrameRect[] = [
  { sx: 0, sy: 0, sw: 80, sh: 100 },
  { sx: 80, sy: 0, sw: 80, sh: 100 },
  { sx: 160, sy: 0, sw: 80, sh: 100 },
  { sx: 240, sy: 0, sw: 80, sh: 100 },
  { sx: 320, sy: 0, sw: 80, sh: 100 },
  { sx: 400, sy: 0, sw: 80, sh: 100 },
];

const playerSprites: Record<Direction, SpriteAnim> = {
  down: {
    img: loadSprite(walkFront),
    frames: walkFrontFrames,
    flip: false,
  },
  up: {
    img: loadSprite(walkBack),
    frames: walkBackFrames,
    flip: false,
  },
  right: {
    img: loadSprite(walkFront2),
    frames: walkSideFrames,
    flip: false,
  },
  left: {
    img: loadSprite(walkFront2),
    frames: walkSideFrames,
    flip: true,
  },
  death: {
    img: loadSprite(deathSprite),
    frames: deathFrames,
    flip: false,
  },
};

const npcSprites = {
  walk: {
    img: loadSprite(npcGhost),
    cols: 10,
    rows: 1,
    total: 10,
    flip: false,
  },
};

// ==================== MAIN COMPONENT ====================
export default function Maps({
  mapId,
  controlDirection,
  isPaused = false,
  answers = [],
  onAnswerSelected,
  onPlayerDeath,
  isInvincible = false,
}: MapsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const maze = MAP_LAYOUTS[String(mapId)];
  const texture = MAP_TEXTURES[String(mapId)];

  const playerRef = useRef<Entity | null>(null);
  const npcsRef = useRef<Entity[]>([]);
  const answerTilesRef = useRef<AnswerTile[]>([]);
  const keyboardDirRef = useRef<Direction | null>(null);
  const externalDirRef = useRef<Direction | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const reqRef = useRef<number | null>(null);
  const isInvincibleRef = useRef<boolean>(isInvincible);
  const onPlayerDeathRef = useRef<(() => void) | undefined>(onPlayerDeath);

  // sync external direction
  useEffect(() => {
    externalDirRef.current = controlDirection ?? null;
  }, [controlDirection]);

  // sync isInvincible ref
  useEffect(() => {
    isInvincibleRef.current = isInvincible;
  }, [isInvincible]);

  // sync onPlayerDeath ref
  useEffect(() => {
    onPlayerDeathRef.current = onPlayerDeath;
  }, [onPlayerDeath]);

  // ==================== GAME INIT ====================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    canvas.width = maze[0].length * TILE_SIZE;
    canvas.height = maze.length * TILE_SIZE;

    // load textures
    const wallImg = loadSprite(texture.wall);
    const floorImg = loadSprite(texture.floor);

    // === Init Player ===
    playerRef.current = {
      tileX: 1,
      tileY: 1,
      dir: "down",
      moving: false,
      moveProgress: 0,
      speed: 5,
      frameIndex: 0,
      frameTimer: 0,
    };

    // === SPAWN NPC ===
    const walkable: { x: number; y: number }[] = [];
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === 0 && !(x === 1 && y === 1)) walkable.push({ x, y });
      }
    }

    const npcs: Entity[] = [];
    for (let i = 0; i < 4 && walkable.length > 0; i++) {
      const idx = Math.floor(Math.random() * walkable.length);
      const spawn = walkable.splice(idx, 1)[0];

      npcs.push({
        tileX: spawn.x,
        tileY: spawn.y,
        dir: "left",
        moving: false,
        moveProgress: 0,
        speed: 1,
        frameIndex: 0,
        frameTimer: 0,
      });
    }
    npcsRef.current = npcs;

    // === SPAWN ANSWERS ===
    const answerTiles: AnswerTile[] = [];
    for (let i = 0; i < answers.length && walkable.length > 0; i++) {
      const idx = Math.floor(Math.random() * walkable.length);
      const spawn = walkable.splice(idx, 1)[0];

      answerTiles.push({
        answer_text: answers[i].answer_text,
        answer_index: answers[i].answer_index,
        tileX: spawn.x,
        tileY: spawn.y,
      });
    }
    answerTilesRef.current = answerTiles;

    // === KEYBOARD CONTROL ===
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") keyboardDirRef.current = "up";
      if (e.key === "ArrowDown" || e.key === "s")
        keyboardDirRef.current = "down";
      if (e.key === "ArrowLeft" || e.key === "a")
        keyboardDirRef.current = "left";
      if (e.key === "ArrowRight" || e.key === "d")
        keyboardDirRef.current = "right";
    };
    window.addEventListener("keydown", onKey);

    // ==================== GAME LOOP ====================
    const loop = (t: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = (t - lastTimeRef.current) / 1000;
      lastTimeRef.current = t;

      const p = playerRef.current!;

      // ========= DEATH ANIMATION =========
      if (p.isDying) {
        p.deathTimer = (p.deathTimer || 0) + dt;

        // Animate death frames
        if (p.deathTimer > 0.15) {
          p.deathTimer = 0;
          p.deathFrameIndex = (p.deathFrameIndex || 0) + 1;

          // When death animation finishes
          if (p.deathFrameIndex >= deathFrames.length) {
            p.isDying = false;
            p.deathFrameIndex = 0;
            // Call death callback after animation completes
            onPlayerDeathRef.current?.();
          }
        }
      }

      // ========= PLAYER MOVEMENT =========
      if (!isPaused && !p.isDying) {
        // ambil direction yang terbaru
        const inputDir =
          externalDirRef.current || keyboardDirRef.current || p.dir;

        // kalau player sedang diam → cek apakah boleh mulai bergerak
        if (!p.moving) {
          const { dx, dy } = getDelta(inputDir);
          const tx = p.tileX + dx;
          const ty = p.tileY + dy;

          // cek collision
          if (isWalkable(maze, tx, ty)) {
            p.dir = inputDir; // arah di-set hanya saat mau mulai jalan
            p.moving = true;
            p.moveProgress = 0;
          }
        }

        // kalau sedang bergerak
        if (p.moving) {
          p.moveProgress += p.speed * dt;

          // *** cegah loncat tile ***
          if (p.moveProgress >= 1) {
            const { dx, dy } = getDelta(p.dir);

            const tx = p.tileX + dx;
            const ty = p.tileY + dy;

            // *** cek lagi sebelum benar-benar pindah tile ***
            if (isWalkable(maze, tx, ty)) {
              p.tileX = tx;
              p.tileY = ty;
            }

            // reset selesai bergerak
            p.moving = false;
            p.moveProgress = 0;

            // check answer pickup (tetap pakai punyamu)
            const ans = answerTilesRef.current;
            for (let i = ans.length - 1; i >= 0; i--) {
              if (ans[i].tileX === p.tileX && ans[i].tileY === p.tileY) {
                onAnswerSelected?.(ans[i].answer_index);
                ans.splice(i, 1);
              }
            }
          }
        }

        // ========= ANIMASI PLAYER =========
        const sprite = playerSprites[p.dir];

        if (p.moving) {
          p.frameTimer += dt;
          if (p.frameTimer > 0.08) {
            p.frameTimer = 0;
            p.frameIndex = (p.frameIndex + 1) % sprite.frames.length;
          }
        } else {
          // idle: tetap di frame 0 (diam)
          p.frameIndex = 0;
          p.frameTimer = 0;
        }
      }

      // ============= NPC UPDATE =============
      for (const npc of npcsRef.current) {
        const dist =
          Math.abs(npc.tileX - p.tileX) + Math.abs(npc.tileY - p.tileY);
        let targetSpeed = 1;

        // === CHASE MODE ===
        if (dist <= 5) {
          targetSpeed = 2;

          let best = dist;
          let bestDir: Direction | null = null;

          for (const dir of ["up", "down", "left", "right"] as Direction[]) {
            const { dx, dy } = getDelta(dir);
            const tx = npc.tileX + dx;
            const ty = npc.tileY + dy;

            if (isWalkable(maze, tx, ty)) {
              const nd = Math.abs(tx - p.tileX) + Math.abs(ty - p.tileY);
              if (nd < best) {
                best = nd;
                bestDir = dir;
              }
            }
          }

          if (!npc.moving && bestDir) {
            npc.dir = bestDir;
            npc.moving = true;
            npc.moveProgress = 0;
            npc.speed = targetSpeed;
          }
        } else {
          // === RANDOM WALK ===
          if (!npc.moving) {
            const dirs = ["up", "down", "left", "right"] as Direction[];
            for (let i = 0; i < 8; i++) {
              const d = dirs[Math.floor(Math.random() * 4)];
              const { dx, dy } = getDelta(d);
              const tx = npc.tileX + dx;
              const ty = npc.tileY + dy;

              if (isWalkable(maze, tx, ty)) {
                npc.dir = d;
                npc.moving = true;
                npc.moveProgress = 0;
                break;
              }
            }
          }
        }

        // === APPLY MOVEMENT ===
        if (npc.moving) {
          npc.moveProgress += npc.speed * dt;
          if (npc.moveProgress >= 1) {
            npc.tileX += getDelta(npc.dir).dx;
            npc.tileY += getDelta(npc.dir).dy;
            npc.moving = false;
          }
        }

        // === ANIMASI NPC ===
        const npcSprite = npcSprites.walk;
        npc.frameTimer += dt;

        if (npc.frameTimer > 0.12) {
          npc.frameTimer = 0;
          npc.frameIndex = (npc.frameIndex + 1) % npcSprite.total;
        }

        // === COLLISION DETECTION WITH PLAYER ===
        if (!isInvincibleRef.current && !p.isDying) {
          // Calculate player's current position (including movement offset)
          const pOff = p.moving ? p.moveProgress : 0;
          const pDelta = getDelta(p.dir);
          const playerPosX = p.tileX + pDelta.dx * pOff;
          const playerPosY = p.tileY + pDelta.dy * pOff;

          // Calculate NPC's current position (including movement offset)
          const npcOff = npc.moving ? npc.moveProgress : 0;
          const npcDelta = getDelta(npc.dir);
          const npcPosX = npc.tileX + npcDelta.dx * npcOff;
          const npcPosY = npc.tileY + npcDelta.dy * npcOff;

          // Check collision (distance threshold)
          const distance = Math.sqrt(
            Math.pow(playerPosX - npcPosX, 2) +
              Math.pow(playerPosY - npcPosY, 2),
          );

          if (distance < 0.7) {
            // Start death animation instead of calling onPlayerDeath directly
            p.isDying = true;
            p.deathFrameIndex = 0;
            p.deathTimer = 0;
            p.moving = false;
          }
        }
      }

      // ============= RENDER =============
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw maze
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
          const img = maze[y][x] === 0 ? floorImg : wallImg;
          ctx.drawImage(
            img,
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
          );
        }
      }

      // draw answer tiles
      for (const ans of answerTilesRef.current) {
        const cx = (ans.tileX + 0.5) * TILE_SIZE;
        const cy = (ans.tileY + 0.5) * TILE_SIZE;

        ctx.fillStyle = "rgba(255,215,0,0.85)";
        ctx.fillRect(
          cx - TILE_SIZE * 0.45,
          cy - TILE_SIZE * 0.45,
          TILE_SIZE * 0.9,
          TILE_SIZE * 0.9,
        );

        ctx.fillStyle = "#000";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let t = ans.answer_text;
        if (t.length > 8) t = t.slice(0, 7) + "...";
        ctx.fillText(t, cx, cy);
      }

      // === DRAW NPC SPRITE ===
      for (const npc of npcsRef.current) {
        const spr = npcSprites.walk;

        const frameW = spr.img.width / spr.cols;
        const frameH = spr.img.height / spr.rows;

        const col = npc.frameIndex % spr.cols;
        const row = Math.floor(npc.frameIndex / spr.cols);

        const srcX = col * frameW;
        const srcY = row * frameH;

        const { dx, dy } = getDelta(npc.dir);
        const off = npc.moving ? npc.moveProgress : 0;

        const x = (npc.tileX + dx * off + 0.5) * TILE_SIZE;
        const y = (npc.tileY + dy * off + 0.5) * TILE_SIZE;

        const size = TILE_SIZE * 1.7;

        ctx.drawImage(
          spr.img,
          srcX,
          srcY,
          frameW,
          frameH,
          x - size / 2,
          y - size / 2,
          size,
          size,
        );
      }

      // === DRAW PLAYER SPRITE ===
      // posisi world (tengah tile + offset movement)
      const moveOffset = p.moving ? p.moveProgress : 0;
      const dirDelta = getDelta(p.dir);

      const centerX = (p.tileX + dirDelta.dx * moveOffset + 0.5) * TILE_SIZE;
      const centerY = (p.tileY + dirDelta.dy * moveOffset + 0.5) * TILE_SIZE;

      // ukuran di canvas (boleh di-tweak)
      const destSize = TILE_SIZE * 2.1;

      ctx.save();

      // Check if player is dying - use death sprite
      if (p.isDying) {
        const deathSpr = playerSprites.death;
        const deathFrameIdx = Math.min(
          p.deathFrameIndex || 0,
          deathFrames.length - 1,
        );
        const deathFrame = deathSpr.frames[deathFrameIdx];

        ctx.drawImage(
          deathSpr.img,
          deathFrame.sx,
          deathFrame.sy,
          deathFrame.sw,
          deathFrame.sh,
          centerX - destSize / 2,
          centerY - destSize / 2,
          destSize,
          destSize,
        );
      } else {
        const spr = playerSprites[p.dir];
        const frame = spr.frames[p.frameIndex % spr.frames.length];

        if (spr.flip) {
          ctx.scale(-1, 1);
          ctx.drawImage(
            spr.img,
            frame.sx,
            frame.sy,
            frame.sw,
            frame.sh, // sumber
            -(centerX + destSize / 2),
            centerY - destSize / 2, // tujuan (mirror)
            destSize,
            destSize,
          );
        } else {
          ctx.drawImage(
            spr.img,
            frame.sx,
            frame.sy,
            frame.sw,
            frame.sh,
            centerX - destSize / 2,
            centerY - destSize / 2,
            destSize,
            destSize,
          );
        }
      }

      ctx.restore();

      // continue loop
      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKey);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [
    mapId,
    texture.wall,
    texture.floor,
    answers,
    isPaused,
    maze,
    onAnswerSelected,
  ]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 max-w-full h-auto"
        style={{
          imageRendering: "pixelated" as React.CSSProperties["imageRendering"],
        }}
      />
    </div>
  );
}
