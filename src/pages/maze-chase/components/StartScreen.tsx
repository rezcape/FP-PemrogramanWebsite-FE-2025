import React from "react";
import { useState, useEffect, useRef } from "react";
import audioHome from "./../assets/Home_audio_assets.mp3";
import backgroundHome from "./../assets/Home_Background_assets.png";
import logoHome from "./../assets/Home_Logo_assets.png";
import characterHome from "./../assets/Home_Character_assets.png";
import DustHome from "./../assets/Home_Dust_assets.png";
import BookshelfHome from "./../assets/Home_Bookshelf_assets.png";
import DeskHome from "./../assets/Home_Desk_assets.png";
import CarpetHome from "./../assets/Home_Carpet_Assets.png";
import buttonHome from "./../assets/Home_Button_assets.png";

interface StartScreenProps {
  onStart: () => void;
  hideButton?: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, hideButton }) => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Play audio on mount and cleanup on unmount
  useEffect(() => {
    // Attempt to play on mount
    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // If autoplay fails, add click listener for user interaction
        });
      }
    };

    playAudio();

    // Add click listener as fallback for autoplay blocking
    const handleUserInteraction = () => {
      if (audioRef.current) {
        audioRef.current.play();
      }
      window.removeEventListener("click", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);

    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      window.removeEventListener("click", handleUserInteraction);
    };
  }, []);

  return (
    <div
      className="w-screen h-screen bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundHome})`,
      }}
    >
      {/* Background Audio */}
      <audio ref={audioRef} loop autoPlay>
        <source src={audioHome} type="audio/mpeg" />
      </audio>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25"></div>

      {/* Animations */}
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes buttonBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        @keyframes torchGlow {
          0%, 100% {
            box-shadow: 0 0 30px 10px rgba(255, 180, 0, 0.6), 0 0 60px 20px rgba(255, 120, 0, 0.4), 0 0 100px 30px rgba(255, 80, 0, 0.2);
            filter: brightness(1.2) blur(2px) drop-shadow(0 0 20px rgba(255, 150, 0, 0.7));
          }
          50% {
            box-shadow: 0 0 25px 8px rgba(255, 190, 0, 0.5), 0 0 50px 18px rgba(255, 140, 0, 0.3), 0 0 90px 28px rgba(255, 90, 0, 0.15);
            filter: brightness(1.1) blur(2px) drop-shadow(0 0 15px rgba(255, 160, 0, 0.6));
          }
        }
        .float-animation { animation: floatUp 3s ease-in-out infinite; }
        .button-bounce { animation: buttonBounce 2s ease-in-out infinite; }
        .glow-animation { 
          animation: torchGlow 3s ease-in-out infinite;
          border-radius: 45% 55% 52% 48% / 48% 45% 55% 52%;
          filter: blur(2px);
        }
      `}</style>

      {/* Main Layout Container */}
      <div
        className="relative z-10 w-full h-full flex flex-col items-center justify-start"
        style={{ paddingTop: screenSize.width < 768 ? "60%" : "8%" }}
      >
        {/* Logo Section */}
        <img
          src={logoHome}
          alt="MAZE CHASE"
          style={{
            width:
              screenSize.width < 768
                ? `${Math.min(Math.max(screenSize.width * 0.4, 240), 800)}px`
                : `${Math.min(Math.max(screenSize.width * 0.25, 150), 500)}px`,
            height: "auto",
            marginBottom: `${Math.max(screenSize.width * 0.02, 12)}px`,
          }}
          className="drop-shadow-2xl float-animation"
        />

        {/* Button Section */}
        {!hideButton && (
          <button
            onClick={onStart}
            className="bg-transparent border-none cursor-pointer transition-all"
            style={{
              marginBottom: `${Math.max(screenSize.width * 0.03, 16)}px`,
            }}
          >
            <img
              src={buttonHome}
              alt="PLAY"
              style={{
                width:
                  screenSize.width < 768
                    ? `${Math.min(Math.max(screenSize.width * 0.28, 160), 420)}px`
                    : `${Math.min(Math.max(screenSize.width * 0.18, 110), 270)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg button-bounce hover:drop-shadow-xl"
            />
          </button>
        )}

        {/* Game Scene Container */}
        <div className="relative w-full flex-1 flex items-end justify-center px-4">
          {/* Desktop Only - Dust Left */}
          <div className="hidden md:block absolute left-32 lg:left-80 bottom-10">
            <img
              src={DustHome}
              alt="Dust"
              style={{
                width: `${Math.min(Math.max(screenSize.width * 0.12, 70), 240)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg"
            />
          </div>

          {/* Desktop Only - Dust Right */}
          <div className="hidden md:block absolute right-32 lg:right-90 bottom-0">
            <img
              src={DustHome}
              alt="Dust"
              style={{
                width: `${Math.min(Math.max(screenSize.width * 0.12, 70), 240)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg"
            />
          </div>

          {/* Desktop Only - Bookshelf Right */}
          <div className="hidden md:block absolute right-0 md:right-[-5%] bottom-[-8%]">
            <img
              src={BookshelfHome}
              alt="Bookshelf"
              style={{
                width: `${Math.min(Math.max(screenSize.width * 0.28, 160), 560)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg"
            />
          </div>

          {/* Center - Character with Glow */}
          <div className="relative flex items-end justify-center z-20">
            {/* Glow */}
            <div
              className="absolute glow-animation pointer-events-none"
              style={{
                width:
                  screenSize.width < 768
                    ? `${Math.min(Math.max(screenSize.width * 0.45, 280), 870)}px`
                    : `${Math.min(Math.max(screenSize.width * 0.25, 140), 350)}px`,
                height:
                  screenSize.width < 768
                    ? `${Math.min(Math.max(screenSize.width * 0.45, 280), 870)}px`
                    : `${Math.min(Math.max(screenSize.width * 0.25, 140), 350)}px`,
                bottom: `${Math.max(screenSize.width * 0.02, 10)}px`,
              }}
            ></div>
            {/* Character */}
            <img
              src={characterHome}
              alt="Character"
              style={{
                width:
                  screenSize.width < 768
                    ? `${Math.min(Math.max(screenSize.width * 0.234, 130), 260)}px`
                    : `${Math.min(Math.max(screenSize.width * 0.2, 110), 220)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg relative z-10"
            />
          </div>

          {/* Desktop Only - Desk Left */}
          <div className="hidden md:block absolute left-0 md:left-2 bottom-0">
            <img
              src={DeskHome}
              alt="Desk"
              style={{
                width: `${Math.min(Math.max(screenSize.width * 0.28, 160), 560)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg"
            />
          </div>

          {/* Desktop Only - Carpet Right-Center */}
          <div className="hidden md:block absolute right-32 md:right-40 lg:right-48 bottom-[10%]">
            <img
              src={CarpetHome}
              alt="Carpet"
              style={{
                width: `${Math.min(Math.max(screenSize.width * 0.2, 120), 400)}px`,
                height: "auto",
              }}
              className="drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
