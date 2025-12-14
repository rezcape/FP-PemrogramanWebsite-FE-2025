import React from "react";

const AnimatedBackground: React.FC = () => {
  return (
    <>
      {/* Moving Grid Pattern - Animated */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#10b98112_1px,transparent_1px),linear-gradient(to_bottom,#10b98112_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none animated-grid-bg opacity-30"></div>

      {/* Scanning Line Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="scanning-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      </div>

      {/* Floating Particles/Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Particle 1 - Top Left */}
        <div
          className="floating-particle absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"
          style={{ animationDelay: "0s" }}
        ></div>

        {/* Particle 2 - Top Right */}
        <div
          className="floating-particle-reverse absolute top-32 right-20 w-40 h-40 bg-green-500/10 rounded-full blur-2xl"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Particle 3 - Bottom Left */}
        <div
          className="floating-particle absolute bottom-40 left-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Particle 4 - Bottom Right */}
        <div
          className="floating-particle-reverse absolute bottom-20 right-1/3 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl"
          style={{ animationDelay: "1.5s" }}
        ></div>

        {/* Particle 5 - Center */}
        <div
          className="floating-particle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Digital Rain Effect (Matrix Style) - Simplified */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="digital-rain absolute text-green-500 text-xs font-mono"
            style={{
              left: `${i * 12 + 5}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + i * 2}s`,
            }}
          >
            {[...Array(15)].map((_, j) => (
              <div key={j} className="opacity-70">
                {Math.random() > 0.5 ? "1" : "0"}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Circuit Board Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="circuit"
              x="0"
              y="0"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              {/* Horizontal Lines */}
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="#22d3ee"
                strokeWidth="1"
                className="animated-circuit-line"
              />
              <line
                x1="100"
                y1="100"
                x2="200"
                y2="100"
                stroke="#10b981"
                strokeWidth="1"
                className="animated-circuit-line"
                style={{ animationDelay: "0.5s" }}
              />

              {/* Vertical Lines */}
              <line
                x1="50"
                y1="0"
                x2="50"
                y2="100"
                stroke="#22d3ee"
                strokeWidth="1"
                className="animated-circuit-line"
                style={{ animationDelay: "1s" }}
              />
              <line
                x1="150"
                y1="100"
                x2="150"
                y2="200"
                stroke="#10b981"
                strokeWidth="1"
                className="animated-circuit-line"
                style={{ animationDelay: "1.5s" }}
              />

              {/* Connection Points */}
              <circle
                cx="50"
                cy="50"
                r="3"
                fill="#22d3ee"
                className="glowing-orb"
              />
              <circle
                cx="100"
                cy="100"
                r="3"
                fill="#10b981"
                className="glowing-orb"
                style={{ animationDelay: "0.3s" }}
              />
              <circle
                cx="150"
                cy="150"
                r="3"
                fill="#22d3ee"
                className="glowing-orb"
                style={{ animationDelay: "0.6s" }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      {/* Data Stream Lines (Horizontal moving lines) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="data-stream absolute h-px w-64 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            style={{
              top: `${30 + i * 30}%`,
              animationDelay: `${i * 1.5}s`,
              opacity: 0.3,
            }}
          ></div>
        ))}
      </div>

      {/* Corner Glow Effects */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      {/* Vignette Effect */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] pointer-events-none"></div>
    </>
  );
};

export default AnimatedBackground;
