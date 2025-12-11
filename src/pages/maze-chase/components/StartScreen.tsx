import React from "react";
import backgroundHome from "@/assets/maze-chase/Home_Background_assets.png";
import logoHome from "@/assets/maze-chase/Home_Logo_assets.png";
import characterHome from "@/assets/maze-chase/Home_Character_assets.png";
import DustHome from "@/assets/maze-chase/Home_Dust_assets.png";
import BookshelfHome from "@/assets/maze-chase/Home_Bookshelf_assets.png";
import DeskHome from "@/assets/maze-chase/Home_Desk_assets.png";
import CarpetHome from "@/assets/maze-chase/Home_Carpet_assets.png";
import buttonHome from "@/assets/maze-chase/Home_Button_assets.png";

interface StartScreenProps {
  onStart: () => void;
  hideButton?: boolean; // optional
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, hideButton }) => {
  return (
    <div
      className="w-screen h-screen bg-cover bg-center relative flex flex-col items-center justify-center"
      style={{
        backgroundImage: `url(${backgroundHome})`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/25"></div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-100px);
          }
        }

        @keyframes buttonBounce {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.05);
          }
        }

        @keyframes torchGlow {
          0%, 100% {
            box-shadow: 
              0 0 30px 10px rgba(255, 180, 0, 0.6),
              0 0 60px 20px rgba(255, 120, 0, 0.4),
              0 0 100px 30px rgba(255, 80, 0, 0.2);
            filter: brightness(1.2) blur(2px) drop-shadow(0 0 20px rgba(255, 150, 0, 0.7));
          }
          25% {
            box-shadow: 
              0 0 40px 15px rgba(255, 160, 0, 0.7),
              0 0 80px 25px rgba(255, 100, 0, 0.5),
              0 0 130px 40px rgba(255, 60, 0, 0.3);
            filter: brightness(1.4) blur(2px) drop-shadow(0 0 30px rgba(255, 130, 0, 0.9));
          }
          50% {
            box-shadow: 
              0 0 25px 8px rgba(255, 190, 0, 0.5),
              0 0 50px 18px rgba(255, 140, 0, 0.3),
              0 0 90px 28px rgba(255, 90, 0, 0.15);
            filter: brightness(1.1) blur(2px) drop-shadow(0 0 15px rgba(255, 160, 0, 0.6));
          }
          75% {
            box-shadow: 
              0 0 35px 12px rgba(255, 170, 0, 0.65),
              0 0 70px 22px rgba(255, 110, 0, 0.45),
              0 0 120px 35px rgba(255, 70, 0, 0.25);
            filter: brightness(1.35) blur(2px) drop-shadow(0 0 25px rgba(255, 140, 0, 0.85));
          }
        }

        .float-animation {
          animation: floatUp 3s ease-in-out infinite;
        }

        .button-bounce {
          animation: buttonBounce 2s ease-in-out infinite;
        }

        .glow-animation {
          animation: torchGlow 3s ease-in-out infinite;
          border-radius: 45% 55% 52% 48% / 48% 45% 55% 52%;
          filter: blur(2px);
        }
      `}</style>

      {/* Content Container - Vertical Layout */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 overflow-hidden">
        {/* MAZE CHASE Logo - Top */}
        <img
          src={logoHome}
          alt="MAZE CHASE"
          className="w-80 md:w-[32rem] lg:w-[50rem] h-auto drop-shadow-2xl float-animation mt-8 md:mt-10"
        />

        {/* PLAY Button - Middle */}
        {!hideButton && (
          <button
            onClick={onStart}
            className="relative z-10 bg-transparent border-none cursor-pointer my-6 md:my-8 "
          >
            <img
              src={buttonHome}
              alt="PLAY"
              className="w-56 md:w-64 lg:w-100 h-auto drop-shadow-lg button-bounce hover:drop-shadow-xl transition-all bottom-[-50%]"
            />
          </button>
        )}

        {/* Character & Furniture Container - Bottom with scene layout */}
        <div className="relative w-full h-auto flex items-end justify-center mb-0 md:mb-2 px-4">
          {/* Left Side - Dust/Rock */}
          <div className="absolute left-[5%] md:left-[30%] bottom-[-10%]">
            <img
              src={DustHome}
              alt="Dust"
              className="w-16 md:w-20 lg:w-60 h-auto drop-shadow-lg"
            />
          </div>
          {/* Right Side - Dust/Rock */}
          <div className="absolute right-[5%] md:right-[30%] bottom-[-30%]">
            <img
              src={DustHome}
              alt="Dust"
              className="w-16 md:w-20 lg:w-60 h-auto drop-shadow-lg"
            />
          </div>
          {/* Right-Center - Bookshelf */}
          <div className="absolute right-0 md:right-[-100px] bottom-[-40%]">
            <img
              src={BookshelfHome}
              alt="Bookshelf"
              className="w-24 md:w-16 lg:w-164 h-auto drop-shadow-lg "
            />
          </div>

          {/* Center - Character with Glow Effect */}
          <div className="relative z-20 flex items-end bottom-[-40%]">
            {/* Glow Background - Flashlight Effect */}
            <div className="absolute glow-animation w-96 md:w-[32rem] lg:w-[40rem] h-96 md:h-[32rem] lg:h-[40rem] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            {/* Character Image */}
            <img
              src={characterHome}
              alt="Character"
              className="w-48 md:w-56 lg:w-100 h-auto drop-shadow-lg relative z-10"
            />
          </div>

          {/* Left-Center - Desk */}
          <div className="absolute left-12 md:left-6 bottom-[-45%]">
            <img
              src={DeskHome}
              alt="Desk"
              className="w-24 md:w-32 lg:w-200 h-auto drop-shadow-lg"
            />
          </div>

          {/* Right Side - Carpet/Box */}
          <div className="absolute right-[10%] md:right-[16%] bottom-[-30%]">
            <img
              src={CarpetHome}
              alt="Carpet"
              className="w-16 md:w-100 lg:w-144 h-auto drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
