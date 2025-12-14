import React from "react";

interface NightmareBackgroundProps {
  isActive: boolean;
}

const NightmareBackground: React.FC<NightmareBackgroundProps> = ({
  isActive,
}) => {
  if (!isActive) return null;

  return (
    <>
      {/* Red Moving Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#dc262612_1px,transparent_1px),linear-gradient(to_bottom,#dc262612_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none nightmare-grid opacity-40"></div>

      {/* Red Scanning Line Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="red-scanning-line absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-60"></div>
      </div>

      {/* Floating Malware Symbols */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Malware 1 - Top Left */}
        <div
          className="floating-virus absolute top-20 left-16 text-6xl opacity-70"
          style={{ animationDelay: "0s" }}
        >
          ☣️
        </div>

        {/* Malware 2 - Top Right */}
        <div
          className="floating-virus-reverse absolute top-32 right-24 text-7xl opacity-60"
          style={{ animationDelay: "1.5s" }}
        >
          ☣️
        </div>

        {/* Malware 3 - Middle Left */}
        <div
          className="floating-virus absolute top-1/3 left-1/4 text-5xl opacity-50"
          style={{ animationDelay: "3s" }}
        >
          ☣️
        </div>

        {/* Malware 4 - Middle Right */}
        <div
          className="floating-virus-reverse absolute top-1/2 right-1/3 text-8xl opacity-40"
          style={{ animationDelay: "2s" }}
        >
          ☣️
        </div>

        {/* Malware 5 - Bottom Left */}
        <div
          className="floating-virus absolute bottom-40 left-1/3 text-6xl opacity-55"
          style={{ animationDelay: "4s" }}
        >
          ☣️
        </div>

        {/* Malware 6 - Bottom Right */}
        <div
          className="floating-virus-reverse absolute bottom-32 right-1/4 text-7xl opacity-65"
          style={{ animationDelay: "1s" }}
        >
          ☣️
        </div>

        {/* Malware 7 - Center Top */}
        <div
          className="floating-virus absolute top-1/4 left-1/2 -translate-x-1/2 text-9xl opacity-30"
          style={{ animationDelay: "2.5s" }}
        >
          ☣️
        </div>

        {/* Malware 8 - Center Bottom */}
        <div
          className="floating-virus-reverse absolute bottom-1/4 left-1/2 -translate-x-1/2 text-6xl opacity-45"
          style={{ animationDelay: "3.5s" }}
        >
          ☣️
        </div>
      </div>

      {/* Blood Drip/Corrupt Data Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={`blood-${i}`}
            className="blood-drip absolute text-red-600 text-xs font-mono"
            style={{
              left: `${i * 15 + 10}%`,
              animationDelay: `${i * 3}s`,
              animationDuration: `${20 + i * 3}s`,
            }}
          >
            {[...Array(20)].map((_, j) => (
              <div key={j} className="opacity-70">
                ⚠
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Red Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Left side particles */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`particle-left-${i}`}
            className="floating-virus absolute bg-red-600/10 rounded-full blur-2xl"
            style={{
              width: `${120 + i * 20}px`,
              height: `${120 + i * 20}px`,
              top: `${10 + i * 15}%`,
              left: `${10 + i * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          ></div>
        ))}

        {/* Right side particles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`particle-right-${i}`}
            className="floating-virus-reverse absolute bg-red-600/10 rounded-full blur-2xl"
            style={{
              width: `${100 + i * 25}px`,
              height: `${100 + i * 25}px`,
              top: `${15 + i * 20}%`,
              right: `${5 + i * 15}%`,
              animationDelay: `${i * 0.7 + 1}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Corrupt Data Streams */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={`corrupt-stream-${i}`}
            className="corrupt-stream absolute h-0.5 w-96 bg-gradient-to-r from-transparent via-red-600 to-transparent"
            style={{
              top: `${20 + i * 25}%`,
              animationDelay: `${i * 2}s`,
              opacity: 0.4,
            }}
          ></div>
        ))}
      </div>

      {/* Red Lightning Flash */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="red-lightning absolute inset-0 bg-red-500/5"></div>
      </div>

      {/* Corner Red Glows */}
      <div
        className="floating-virus fixed top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="floating-virus-reverse fixed bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"
        style={{ animationDelay: "2.5s" }}
      ></div>

      {/* Additional Corner Glows for more movement */}
      <div
        className="floating-virus fixed top-0 right-0 w-80 h-80 bg-red-600/8 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2"
        style={{ animationDelay: "3.5s" }}
      ></div>
      <div
        className="floating-virus-reverse fixed bottom-0 left-0 w-80 h-80 bg-red-600/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2"
        style={{ animationDelay: "0.5s" }}
      ></div>

      {/* Red Vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#450a0a_100%)] pointer-events-none"></div>

      {/* Virus Spread Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        {[...Array(3)].map((_, i) => (
          <div
            key={`virus-spread-${i}`}
            className="virus-spread floating-virus absolute"
            style={{
              width: "200px",
              height: "200px",
              top: `${20 + i * 30}%`,
              left: `${30 + i * 20}%`,
              animationDelay: `${i * 5}s`,
            }}
          >
            <div className="w-full h-full bg-red-500 rounded-full blur-3xl"></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default NightmareBackground;
