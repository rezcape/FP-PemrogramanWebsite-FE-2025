import { useEffect, useRef, useState } from "react";

interface UseGameAudioProps {
  isNightmareMode: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isOnHomeScreen?: boolean; // New prop to detect if on home screen
}

export const useGameAudio = ({
  isNightmareMode,
  isPlaying,
  isPaused,
  isOnHomeScreen = false,
}: UseGameAudioProps) => {
  const normalAudioRef = useRef<HTMLAudioElement | null>(null);
  const nightmareAudioRef = useRef<HTMLAudioElement | null>(null);
  const interfaceNormalRef = useRef<HTMLAudioElement | null>(null);
  const interfaceNightmareRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Initialize audio elements
  useEffect(() => {
    // Game music
    normalAudioRef.current = new Audio("/audio/normal-mode.mp3");
    nightmareAudioRef.current = new Audio("/audio/nighmare-mode.mp3");

    // Interface music
    interfaceNormalRef.current = new Audio("/audio/interface_normalmode.mp3");
    interfaceNightmareRef.current = new Audio(
      "/audio/interface_nightmaremode.mp3",
    );

    // Set audio properties for game music
    if (normalAudioRef.current) {
      normalAudioRef.current.loop = true;
      normalAudioRef.current.volume = 0.3;
      normalAudioRef.current.preload = "auto"; // Preload for instant playback
      // Ensure continuous playback - restart if ended unexpectedly
      normalAudioRef.current.addEventListener("ended", () => {
        if (normalAudioRef.current && !normalAudioRef.current.paused) {
          normalAudioRef.current.currentTime = 0;
          normalAudioRef.current.play().catch(() => {});
        }
      });
    }
    if (nightmareAudioRef.current) {
      nightmareAudioRef.current.loop = true;
      nightmareAudioRef.current.volume = 0.3;
      nightmareAudioRef.current.preload = "auto"; // Preload for instant playback
      // Ensure continuous playback - restart if ended unexpectedly
      nightmareAudioRef.current.addEventListener("ended", () => {
        if (nightmareAudioRef.current && !nightmareAudioRef.current.paused) {
          nightmareAudioRef.current.currentTime = 0;
          nightmareAudioRef.current.play().catch(() => {});
        }
      });
    }

    // Set audio properties for interface music
    if (interfaceNormalRef.current) {
      interfaceNormalRef.current.loop = true;
      interfaceNormalRef.current.volume = 0.3;
      interfaceNormalRef.current.preload = "auto"; // Preload for instant playback
      // Ensure continuous playback - restart if ended unexpectedly
      interfaceNormalRef.current.addEventListener("ended", () => {
        if (interfaceNormalRef.current && !interfaceNormalRef.current.paused) {
          interfaceNormalRef.current.currentTime = 0;
          interfaceNormalRef.current.play().catch(() => {});
        }
      });
    }
    if (interfaceNightmareRef.current) {
      interfaceNightmareRef.current.loop = true;
      interfaceNightmareRef.current.volume = 0.3;
      interfaceNightmareRef.current.preload = "auto"; // Preload for instant playback
      // Ensure continuous playback - restart if ended unexpectedly
      interfaceNightmareRef.current.addEventListener("ended", () => {
        if (
          interfaceNightmareRef.current &&
          !interfaceNightmareRef.current.paused
        ) {
          interfaceNightmareRef.current.currentTime = 0;
          interfaceNightmareRef.current.play().catch(() => {});
        }
      });
    }

    setIsAudioReady(true);

    // Cleanup on unmount
    return () => {
      if (normalAudioRef.current) {
        normalAudioRef.current.pause();
        normalAudioRef.current = null;
      }
      if (nightmareAudioRef.current) {
        nightmareAudioRef.current.pause();
        nightmareAudioRef.current = null;
      }
      if (interfaceNormalRef.current) {
        interfaceNormalRef.current.pause();
        interfaceNormalRef.current = null;
      }
      if (interfaceNightmareRef.current) {
        interfaceNightmareRef.current.pause();
        interfaceNightmareRef.current = null;
      }
    };
  }, []);

  // Handle interface music on home screen and game music when playing
  useEffect(() => {
    if (!isAudioReady) return;

    if (isPlaying) {
      // Game started - immediately stop interface music and start game music
      const gameAudio = isNightmareMode
        ? nightmareAudioRef.current
        : normalAudioRef.current;

      // Stop interface music instantly
      if (interfaceNormalRef.current) {
        interfaceNormalRef.current.pause();
        interfaceNormalRef.current.currentTime = 0;
      }
      if (interfaceNightmareRef.current) {
        interfaceNightmareRef.current.pause();
        interfaceNightmareRef.current.currentTime = 0;
      }

      // Stop other game music
      const otherGameAudio = isNightmareMode
        ? normalAudioRef.current
        : nightmareAudioRef.current;
      if (otherGameAudio) {
        otherGameAudio.pause();
        otherGameAudio.currentTime = 0;
      }

      // Start game music immediately without checking paused state
      if (gameAudio) {
        gameAudio.currentTime = 0; // Reset to start
        gameAudio.volume = 0.3;
        // Use synchronous play for instant start
        const playPromise = gameAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silent fail - autoplay might be blocked by browser
          });
        }
      }
    } else if (isOnHomeScreen) {
      // On home screen - play interface music
      const currentInterface = isNightmareMode
        ? interfaceNightmareRef.current
        : interfaceNormalRef.current;
      const otherInterface = isNightmareMode
        ? interfaceNormalRef.current
        : interfaceNightmareRef.current;

      // Stop all game music
      if (normalAudioRef.current) {
        normalAudioRef.current.pause();
        normalAudioRef.current.currentTime = 0;
      }
      if (nightmareAudioRef.current) {
        nightmareAudioRef.current.pause();
        nightmareAudioRef.current.currentTime = 0;
      }

      // Stop other interface music when switching modes
      if (otherInterface) {
        otherInterface.pause();
        otherInterface.currentTime = 0;
      }

      // Play current interface music
      if (currentInterface) {
        currentInterface.currentTime = 0;
        currentInterface.volume = 0.3;
        const playPromise = currentInterface.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silent fail - autoplay might be blocked by browser
          });
        }
      }
    }
  }, [isNightmareMode, isAudioReady, isOnHomeScreen, isPlaying]); // Remove isMuted from dependencies

  // Handle music switching when mode changes during gameplay
  useEffect(() => {
    if (!isAudioReady || !isPlaying) return;

    const currentAudio = isNightmareMode
      ? nightmareAudioRef.current
      : normalAudioRef.current;
    const otherAudio = isNightmareMode
      ? normalAudioRef.current
      : nightmareAudioRef.current;

    // Stop other audio
    if (otherAudio) {
      otherAudio.pause();
      otherAudio.currentTime = 0;
    }

    // Play current audio
    if (currentAudio && !isPaused) {
      if (currentAudio.paused) {
        currentAudio.currentTime = 0; // Reset to start
        currentAudio.volume = 0.3;
        currentAudio.play().catch(() => {
          // Silent fail - autoplay might be blocked by browser
        });
      }
    }
  }, [isNightmareMode, isPlaying, isAudioReady, isPaused]); // Remove isMuted from dependencies

  // Handle pause/resume
  useEffect(() => {
    if (!isAudioReady) return;

    const currentAudio = isNightmareMode
      ? nightmareAudioRef.current
      : normalAudioRef.current;

    if (currentAudio) {
      if (isPaused) {
        currentAudio.pause();
      } else if (isPlaying) {
        currentAudio.play().catch(() => {
          // Silent fail - autoplay might be blocked by browser
        });
      }
    }
  }, [isPaused, isPlaying, isNightmareMode, isAudioReady]); // Remove isMuted from dependencies

  // Stop music when game stops
  useEffect(() => {
    if (!isPlaying && isAudioReady) {
      if (normalAudioRef.current) {
        normalAudioRef.current.pause();
        normalAudioRef.current.currentTime = 0;
      }
      if (nightmareAudioRef.current) {
        nightmareAudioRef.current.pause();
        nightmareAudioRef.current.currentTime = 0;
      }
    }
  }, [isPlaying, isAudioReady]);

  // Handle mute toggle
  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuted = !prev;

      // Mute/unmute game music
      if (normalAudioRef.current) {
        normalAudioRef.current.muted = newMuted;
      }
      if (nightmareAudioRef.current) {
        nightmareAudioRef.current.muted = newMuted;
      }

      // Mute/unmute interface music
      if (interfaceNormalRef.current) {
        interfaceNormalRef.current.muted = newMuted;
      }
      if (interfaceNightmareRef.current) {
        interfaceNightmareRef.current.muted = newMuted;
      }

      // If unmuting, start playing the appropriate audio if not already playing
      if (!newMuted) {
        if (isPlaying) {
          // Playing game - start game music if paused
          const gameAudio = isNightmareMode
            ? nightmareAudioRef.current
            : normalAudioRef.current;
          if (gameAudio && gameAudio.paused) {
            gameAudio.play().catch(() => {});
          }
        } else if (isOnHomeScreen) {
          // On home screen - start interface music if paused
          const interfaceAudio = isNightmareMode
            ? interfaceNightmareRef.current
            : interfaceNormalRef.current;
          if (interfaceAudio && interfaceAudio.paused) {
            interfaceAudio.play().catch(() => {});
          }
        }
      }

      return newMuted;
    });
  };

  return {
    isMuted,
    toggleMute,
  };
};
