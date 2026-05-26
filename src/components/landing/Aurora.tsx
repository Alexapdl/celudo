"use client";

import { useEffect, useRef } from "react";

export default function Aurora({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const blobs = [
      { x: 0.3, y: 0.3, vx: 0.0006, vy: 0.0005, color: "rgba(69,209,133,0.12)", radius: 0.3 },
      { x: 0.7, y: 0.5, vx: -0.0005, vy: 0.0007, color: "rgba(252,213,53,0.1)", radius: 0.28 },
      { x: 0.5, y: 0.7, vx: 0.0006, vy: -0.0004, color: "rgba(92,156,255,0.1)", radius: 0.25 },
    ];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const b of blobs) {
        b.x += b.vx; b.y += b.vy;
        if (b.x > 1.1 || b.x < -0.1) b.vx *= -1;
        if (b.y > 1.1 || b.y < -0.1) b.vy *= -1;
        const g = ctx.createRadialGradient(b.x * canvas.width, b.y * canvas.height, 0, b.x * canvas.width, b.y * canvas.height, b.radius * Math.max(canvas.width, canvas.height));
        g.addColorStop(0, b.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 -z-10 ${className}`} style={{ pointerEvents: "none" }} />;
}
