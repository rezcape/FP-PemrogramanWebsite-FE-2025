export type SpeedSortingTheme = {
  id: string;
  name: string;
  base: string;
  radials: string;
  linear: string;
  cardBg: string;
  cardOverlay: string;
  cardBottomFade: string;
  accentStrong: string;
  accentWeak: string;
  progressGlow: string;
};

export const themes: SpeedSortingTheme[] = [
  {
    id: "cyber-cyan",
    name: "Cyber Cyan",
    base: "#050816",
    radials:
      "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.14), transparent 35%), radial-gradient(circle at 80% 10%, rgba(139,92,246,0.18), transparent 30%), radial-gradient(circle at 50% 80%, rgba(14,165,233,0.14), transparent 30%)",
    linear:
      "linear-gradient(110deg, rgba(45,212,191,0.05) 0%, rgba(139,92,246,0.05) 50%, rgba(6,182,212,0.05) 100%)",
    cardBg: "rgba(5,8,22,0.92)",
    cardOverlay:
      "linear-gradient(120deg, rgba(59,130,246,0.12) 0%, rgba(16,185,129,0.1) 50%, rgba(236,72,153,0.1) 100%)",
    cardBottomFade:
      "linear-gradient(to top, rgba(5,8,22,0.95), rgba(5,8,22,0.85), transparent)",
    accentStrong: "#a5f3fc",
    accentWeak: "#67e8f9",
    progressGlow: "0 0 14px rgba(34,211,238,0.6)",
  },
  {
    id: "neon-sunset",
    name: "Neon Sunset",
    base: "#0b0a1f",
    radials:
      "radial-gradient(circle at 15% 25%, rgba(251,146,60,0.18), transparent 32%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.18), transparent 32%), radial-gradient(circle at 55% 75%, rgba(14,165,233,0.12), transparent 35%)",
    linear:
      "linear-gradient(120deg, rgba(251,191,36,0.08) 0%, rgba(244,114,182,0.08) 50%, rgba(6,182,212,0.06) 100%)",
    cardBg: "rgba(12,11,30,0.94)",
    cardOverlay:
      "linear-gradient(120deg, rgba(251,146,60,0.12) 0%, rgba(244,63,94,0.1) 50%, rgba(79,70,229,0.12) 100%)",
    cardBottomFade:
      "linear-gradient(to top, rgba(12,11,30,0.95), rgba(12,11,30,0.85), transparent)",
    accentStrong: "#fed7aa",
    accentWeak: "#fca5a5",
    progressGlow: "0 0 14px rgba(251,146,60,0.6)",
  },
  {
    id: "aurora-mint",
    name: "Aurora Mint",
    base: "#03171d",
    radials:
      "radial-gradient(circle at 25% 20%, rgba(94,234,212,0.16), transparent 36%), radial-gradient(circle at 75% 18%, rgba(52,211,153,0.16), transparent 34%), radial-gradient(circle at 50% 80%, rgba(56,189,248,0.12), transparent 32%)",
    linear:
      "linear-gradient(115deg, rgba(45,212,191,0.08) 0%, rgba(59,130,246,0.06) 50%, rgba(52,211,153,0.06) 100%)",
    cardBg: "rgba(3,23,29,0.94)",
    cardOverlay:
      "linear-gradient(120deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.1) 50%, rgba(13,148,136,0.12) 100%)",
    cardBottomFade:
      "linear-gradient(to top, rgba(3,23,29,0.95), rgba(3,23,29,0.85), transparent)",
    accentStrong: "#bbf7d0",
    accentWeak: "#99f6e4",
    progressGlow: "0 0 14px rgba(16,185,129,0.55)",
  },
  {
    id: "midnight-magenta",
    name: "Midnight Magenta",
    base: "#150018",
    radials:
      "radial-gradient(circle at 25% 20%, rgba(236,72,153,0.16), transparent 36%), radial-gradient(circle at 75% 15%, rgba(99,102,241,0.18), transparent 34%), radial-gradient(circle at 45% 78%, rgba(248,113,113,0.12), transparent 32%)",
    linear:
      "linear-gradient(115deg, rgba(236,72,153,0.08) 0%, rgba(129,140,248,0.08) 45%, rgba(59,130,246,0.06) 100%)",
    cardBg: "rgba(21,0,24,0.94)",
    cardOverlay:
      "linear-gradient(125deg, rgba(236,72,153,0.14) 0%, rgba(129,140,248,0.12) 45%, rgba(56,189,248,0.12) 100%)",
    cardBottomFade:
      "linear-gradient(to top, rgba(21,0,24,0.95), rgba(21,0,24,0.85), transparent)",
    accentStrong: "#f5d0fe",
    accentWeak: "#c4b5fd",
    progressGlow: "0 0 14px rgba(236,72,153,0.6)",
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    base: "#061225",
    radials:
      "radial-gradient(circle at 22% 18%, rgba(59,130,246,0.2), transparent 35%), radial-gradient(circle at 78% 15%, rgba(14,165,233,0.16), transparent 32%), radial-gradient(circle at 50% 78%, rgba(168,85,247,0.14), transparent 34%)",
    linear:
      "linear-gradient(115deg, rgba(59,130,246,0.08) 0%, rgba(14,165,233,0.08) 50%, rgba(129,140,248,0.08) 100%)",
    cardBg: "rgba(6,18,37,0.94)",
    cardOverlay:
      "linear-gradient(125deg, rgba(59,130,246,0.14) 0%, rgba(14,165,233,0.12) 50%, rgba(129,140,248,0.12) 100%)",
    cardBottomFade:
      "linear-gradient(to top, rgba(6,18,37,0.95), rgba(6,18,37,0.85), transparent)",
    accentStrong: "#bfdbfe",
    accentWeak: "#93c5fd",
    progressGlow: "0 0 14px rgba(59,130,246,0.65)",
  },
];
