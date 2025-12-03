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

    // Clear the canvas to show the video background behind it
    ctx.clearRect(0, 0, width, height);

    // --- 1. Draw Player ---
    ctx.save();
    // Add tilt effect based on velocity (Limit tilt angle for realism)
    const tilt = Math.max(Math.min(player.vy * 2, 25), -25) * (Math.PI / 180);
    
    // Move to player center
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(tilt);
    
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