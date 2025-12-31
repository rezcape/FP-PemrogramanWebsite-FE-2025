import { useEffect, useRef, useState, useCallback } from "react";

type SoundType =
  | "bgm"
  | "buzz"
  | "correct"
  | "wrong"
  | "tick"
  | "reveal"
  | "timeUp"
  | "countdown"
  | "result";

// Map sound types to file paths
// You should place these files in your public/sounds directory
const SOUND_PATHS: Record<SoundType, string> = {
  bgm: "/sounds/quiz-bgm.mp3",
  buzz: "/sounds/buzz.mp3",
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  tick: "/sounds/tick.mp3",
  reveal: "/sounds/flip.mp3",
  timeUp: "/sounds/time-up.mp3",
  countdown: "/sounds/countdown.mp3",
  result: "/sounds/result.mp3",
};

export const useImageQuizSound = () => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRefs = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({});

  useEffect(() => {
    // Preload sounds
    Object.entries(SOUND_PATHS).forEach(([key, path]) => {
      const audio = new Audio(path);
      if (key === "bgm") {
        audio.loop = true;
        audio.volume = 0.3; // Lower volume for background music
      } else {
        audio.volume = 0.6;
      }

      // Debug: Check for loading errors
      audio.addEventListener("error", (e) => {
        console.error(`Error loading sound "${key}" at path "${path}":`, e);
      });

      audioRefs.current[key as SoundType] = audio;
    });

    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach((audio) => {
        audio?.pause();
        audio!.currentTime = 0;
      });
    };
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      const audio = audioRefs.current[type];
      if (audio) {
        console.log(`Playing sound: ${type}`); // Debug log
        // For SFX, allow overlapping plays (except BGM)
        if (type !== "bgm") {
          const clone = audio.cloneNode() as HTMLAudioElement;
          clone.volume = audio.volume;
          clone.play().catch((e) => {
            console.warn(`Failed to play sound "${type}":`, e);
          });
        } else {
          audio.play().catch((e) => {
            console.warn(`Failed to play BGM:`, e);
          });
        }
      } else {
        console.warn(`Sound "${type}" not found in refs.`);
      }
    },
    [isMuted],
  );

  const stopSound = useCallback((type: SoundType) => {
    const audio = audioRefs.current[type];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      // If muting, stop all sounds
      if (next) {
        Object.values(audioRefs.current).forEach((audio) => audio?.pause());
      } else {
        // If unmuting, maybe restart BGM?
        // For now, let the game logic handle restarting BGM if needed
      }
      return next;
    });
  }, []);

  return { playSound, stopSound, toggleMute, isMuted };
};
