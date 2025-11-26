import type { Player, Cloud } from '../types';
import { cn } from '@/lib/utils';

interface GameCanvasProps {
  player: Player;
  clouds: Cloud[];
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  width: number;
  height: number;
}

export const GameCanvas = ({ player, clouds, onMouseMove, width, height }: GameCanvasProps) => {
  return (
    <div 
      className="relative bg-sky-200 overflow-hidden cursor-none shadow-2xl rounded-xl border-4 border-slate-900"
      style={{ width, height }}
      onMouseMove={onMouseMove}
    >
      {/* Background Elements */}
      
      {/* Player */}
      <div 
        className="absolute bg-blue-600 rounded-lg flex items-center justify-center shadow-lg transition-transform"
        style={{ 
          left: player.x, 
          top: player.y, 
          width: player.width, 
          height: player.height,
        }}
      >
        {/* Simple Plane Graphic */}
        <span className="text-white text-xs font-bold">Plane</span>
      </div>

      {/* Clouds (Enemies/Answers) */}
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className={cn(
            "absolute rounded-full flex items-center justify-center shadow-md border-2 border-white/50",
            // Ubah ukuran font text-2xl jadi text-lg atau text-md agar muat jika teks panjang
            "bg-white/80 text-slate-700 text-center leading-tight p-2"
          )}
          style={{
            left: cloud.x,
            top: cloud.y,
            width: cloud.width,
            height: cloud.height
          }}
        >
          {/* PERBAIKAN UTAMA DISINI: Gunakan .text */}
          <span className="text-lg font-bold select-none">{cloud.text || "?"}</span>
        </div>
      ))}
    </div>
  );
};