import { useEffect, useRef } from "react";

interface InteractiveBackgroundProps {
  variant?: "purple" | "blue" | "gradient";
}

export function InteractiveBackground({
  variant = "purple",
}: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Particle system
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;

        const colors =
          variant === "purple"
            ? [
                "rgba(168, 85, 247, 0.4)",
                "rgba(147, 51, 234, 0.3)",
                "rgba(126, 34, 206, 0.2)",
              ]
            : variant === "blue"
              ? [
                  "rgba(99, 102, 241, 0.4)",
                  "rgba(79, 70, 229, 0.3)",
                  "rgba(67, 56, 202, 0.2)",
                ]
              : [
                  "rgba(168, 85, 247, 0.4)",
                  "rgba(99, 102, 241, 0.3)",
                  "rgba(79, 70, 229, 0.2)",
                ];

        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Move towards mouse
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const force = (150 - distance) / 150;
          this.speedX += (dx / distance) * force * 0.2;
          this.speedY += (dy / distance) * force * 0.2;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        // Friction
        this.speedX *= 0.95;
        this.speedY *= 0.95;

        // Wrap around edges
        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    const particleCount = 80;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear with gradient background
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      if (variant === "purple") {
        gradient.addColorStop(0, "#1e1b4b"); // Deep purple
        gradient.addColorStop(0.5, "#312e81"); // Purple
        gradient.addColorStop(1, "#4c1d95"); // Bright purple
      } else if (variant === "blue") {
        gradient.addColorStop(0, "#1e3a8a"); // Deep blue
        gradient.addColorStop(0.5, "#1e40af"); // Blue
        gradient.addColorStop(1, "#3b82f6"); // Bright blue
      } else {
        gradient.addColorStop(0, "#1e1b4b"); // Deep purple
        gradient.addColorStop(0.5, "#4c1d95"); // Purple
        gradient.addColorStop(1, "#3b82f6"); // Blue
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw glow effect around mouse
      const mouseGradient = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        200,
      );
      mouseGradient.addColorStop(0, "rgba(168, 85, 247, 0.15)");
      mouseGradient.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((particleA, i) => {
        particles.slice(i + 1).forEach((particleB) => {
          const dx = particleA.x - particleB.x;
          const dy = particleA.y - particleB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particleA.x, particleA.y);
            ctx.lineTo(particleB.x, particleB.y);
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10"
      style={{ pointerEvents: "none" }}
    />
  );
}
