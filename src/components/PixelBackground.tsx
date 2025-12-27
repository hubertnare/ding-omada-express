import { useEffect, useRef } from "react";

interface PixelBackgroundProps {
  className?: string;
}

const PixelBackground = ({ className }: PixelBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      if (!ctx) return;
      
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const pixelSize = 4;
      const cols = Math.ceil(width / pixelSize);
      const rows = Math.ceil(height / pixelSize);

      // Get computed style to check if dark mode
      const isDark = document.documentElement.classList.contains("dark");
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // Create a noise pattern with animation
          const noise = Math.sin(i * 0.1 + time * 0.5) * Math.cos(j * 0.1 + time * 0.3);
          const threshold = 0.92 + Math.sin(time * 0.2) * 0.02;
          
          if (Math.abs(noise) > threshold) {
            const x = i * pixelSize;
            const y = j * pixelSize;
            
            // Gradient from purple to orange matching theme
            const hue = 271 + (i / cols) * 60 + Math.sin(time + i * 0.05) * 20;
            const saturation = 70 + Math.sin(time * 0.5 + j * 0.02) * 10;
            const lightness = isDark ? 50 : 60;
            const alpha = 0.15 + Math.abs(noise - threshold) * 0.3;
            
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
            ctx.fillRect(x, y, pixelSize - 1, pixelSize - 1);
          }
        }
      }

      time += 0.02;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none -z-10 ${className}`}
      style={{ opacity: 0.6 }}
    />
  );
};

export default PixelBackground;
