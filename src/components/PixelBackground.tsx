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

      const pixelSize = 6;
      const cols = Math.ceil(width / pixelSize);
      const rows = Math.ceil(height / pixelSize);

      // Get computed style to check if dark mode
      const isDark = document.documentElement.classList.contains("dark");
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // Create a sparse, subtle noise pattern
          const noise = Math.sin(i * 0.05 + time * 0.1) * Math.cos(j * 0.05 + time * 0.08);
          const threshold = 0.97;
          
          if (Math.abs(noise) > threshold) {
            const x = i * pixelSize;
            const y = j * pixelSize;
            
            // Subtle purple-pink tones
            const hue = 280 + Math.sin(time * 0.1 + i * 0.02) * 30;
            const saturation = 40;
            const lightness = isDark ? 40 : 70;
            const alpha = 0.08;
            
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
            ctx.fillRect(x, y, pixelSize - 1, pixelSize - 1);
          }
        }
      }

      time += 0.005;
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
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.3 }}
    />
  );
};

export default PixelBackground;
