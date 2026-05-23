"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface PixelCanvasProps {
  gap?: number;
  speed?: number;
  colors?: string[];
  className?: string;
}

export default function PixelCanvas({
  gap = 6,
  speed = 0.3,
  colors = ["#35d07f", "#ffd700", "#b388ff", "#4fc3f7", "#ff5555"],
  className = "",
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -1, y: -1 });
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const cols = Math.floor(rect.width / gap);
      const rows = Math.floor(rect.height / gap);
      setDimensions({ cols, rows });
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [gap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const grid: { color: string; opacity: number; targetOpacity: number }[][] = [];

    for (let r = 0; r < dimensions.rows; r++) {
      grid[r] = [];
      for (let c = 0; c < dimensions.cols; c++) {
        grid[r][c] = {
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 0,
          targetOpacity: 0,
        };
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < dimensions.rows; r++) {
        for (let c = 0; c < dimensions.cols; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          const px = c * gap;
          const py = r * gap;
          const dx = px - mousePos.current.x;
          const dy = py - mousePos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            cell.targetOpacity = 0.6 * (1 - dist / 100);
          } else if (Math.random() < 0.001) {
            cell.targetOpacity = 0.05;
          } else {
            cell.targetOpacity = 0;
          }

          cell.opacity += (cell.targetOpacity - cell.opacity) * speed;

          if (cell.opacity > 0.01) {
            ctx.fillStyle = cell.color;
            ctx.globalAlpha = cell.opacity;
            ctx.fillRect(c * gap, r * gap, gap - 1, gap - 1);
          }
        }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [dimensions, colors, gap, speed]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePos.current = { x: -1, y: -1 };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ imageRendering: "pixelated" }}
    />
  );
}