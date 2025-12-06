import { useEffect, useRef, useState } from 'react';
import type { Player, Cloud } from '../types';

interface GameCanvasProps {
  player: Player;
  clouds: Cloud[];
  width: number;
  height: number;
}

// Local Asset URLs
const IMG_PLANE = "/assets/game/airplane/airplane.png";
const IMG_CLOUD = "/assets/game/airplane/cloud.png";
const VIDEO_BG = "/assets/game/airplane/sky-bg.mp4";

export const GameCanvas = ({ player, clouds, width, height }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Image Refs
  const planeImg = useRef<HTMLImageElement>(new Image());
  const cloudImg = useRef<HTMLImageElement>(new Image());

  // --- Collision / Hit animation state ---
  // Track last hit time per-cloud index so the same cloud can trigger again after cooldown
  const lastHitRef = useRef<Map<number, number>>(new Map());
  const [hit, setHit] = useState<{ x: number; y: number; t: number } | null>(null);
  const HIT_DURATION = 600; // ms (also used as cooldown)

  useEffect(() => {
    // Preload Images
    let loadedCount = 0;
    const totalImages = 2;

    const checkLoad = () => {
      loadedCount++;
      if (loadedCount >= totalImages) setImagesLoaded(true);
    };

    planeImg.current.src = IMG_PLANE;
    planeImg.current.onload = checkLoad;
    planeImg.current.onerror = () => { console.error("Failed to load airplane.png"); checkLoad(); }; // Fallback to continue

    cloudImg.current.src = IMG_CLOUD;
    cloudImg.current.onload = checkLoad;
    cloudImg.current.onerror = () => { console.error("Failed to load cloud.png"); checkLoad(); }; // Fallback to continue
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // current time for animation timing
    const now = performance.now();

    // simple AABB intersection helper
    const rectsIntersect = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);

    // Check collisions and trigger hit animation for wrong answers
    clouds.forEach((cloud, i) => {
      const playerRect = { x: player.x, y: player.y, w: player.width, h: player.height };
      const cloudRect = { x: cloud.x, y: cloud.y, w: cloud.width, h: cloud.height };
      if (rectsIntersect(playerRect, cloudRect)) {
        const isWrong = (cloud as any).isCorrect === false || (cloud as any).isAnswer === false || (cloud as any).wrong === true;
        if (isWrong) {
          const last = lastHitRef.current.get(i) ?? 0;
          // allow retrigger after HIT_DURATION passed (prevents spam but allows repeated hits)
          if (now - last >= HIT_DURATION) {
            lastHitRef.current.set(i, now);
            setHit({ x: cloud.x + cloud.width / 2, y: cloud.y + cloud.height / 2, t: now });
          }
        }
      }
    });

    // Clear the canvas to show the video background behind it
    ctx.clearRect(0, 0, width, height);

    // --- 1. Draw Player (with optional shake when hit) ---
    ctx.save();
    // Add tilt effect based on velocity (Limit tilt angle for realism)
    const baseTilt = Math.max(Math.min(player.vy * 2, 25), -25) * (Math.PI / 180);
    // Optional shake: when hit, produce small jitter + extra rotation
    let extraShakeX = 0;
    let extraShakeY = 0;
    let extraTilt = 0;
    if (hit) {
      const elapsed = now - hit.t;
      if (elapsed < HIT_DURATION) {
        const p = 1 - elapsed / HIT_DURATION;
        const shakeAmp = 6 * p; // pixels
        extraShakeX = (Math.random() - 0.5) * shakeAmp;
        extraShakeY = (Math.random() - 0.5) * shakeAmp;
        extraTilt = (Math.sin(elapsed / 30) * 8 * p) * (Math.PI / 180);
      } else {
        setHit(null);
      }
    }
    // Move to player center + extra shake
    ctx.translate(player.x + player.width / 2 + extraShakeX, player.y + player.height / 2 + extraShakeY);
    ctx.rotate(baseTilt + extraTilt);
    // Draw Image centered
    ctx.drawImage(
        planeImg.current, 
        -player.width / 2, 
        -player.height / 2, 
        player.width, 
        player.height
    );
    ctx.restore();

    // --- 2. Draw Clouds (Enemies/Answers) ---
    ctx.font = "bold 24px 'Comic Sans MS', sans-serif"; // Slightly larger font
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    clouds.forEach(cloud => {
        // Draw Cloud Image
        ctx.drawImage(cloudImg.current, cloud.x, cloud.y, cloud.width, cloud.height);
        
        // Draw Text Overlay
        // Adjust Y position slightly if the cloud image has a "puffy" top
        const textYOffset = 5; 
        
        // Text Shadow/Outline for readability
        ctx.fillStyle = "#333"; // Dark grey for contrast on white cloud
        ctx.fillText(cloud.text, cloud.x + cloud.width / 2, cloud.y + cloud.height / 2 + textYOffset);
    });

    // --- 3. Draw Hit Effects (flash + expanding circle) ---
    if (hit) {
      const elapsed = now - hit.t;
      if (elapsed < HIT_DURATION) {
        const p = elapsed / HIT_DURATION;
        // flash overlay (fade out)
        ctx.save();
        ctx.globalAlpha = 0.35 * (1 - p);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // expanding circle at collision point
        const maxR = Math.max(width, height) * 0.12;
        const r = maxR * p;
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,80,0,${0.9 * (1 - p)})`;
        ctx.arc(hit.x, hit.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        setHit(null);
      }
    }
  }, [player, clouds, imagesLoaded, width, height]);

  return (
    <div 
        className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 cursor-none bg-sky-300"
        style={{ width, height }}
    >
        {/* Background Video Layer */}
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-0"
        >
            <source src={VIDEO_BG} type="video/mp4" />
        </video>

        {/* Game Render Layer */}
        <canvas 
            ref={canvasRef}
            width={width}
            height={height}
            className="relative z-10 block"
        />
        
        {!imagesLoaded && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-20">
                Loading Assets...
             </div>
        )}
    </div>
  );
};