"use client";

import { useEffect, useRef } from "react";

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let id: number;

    const colors = ["69,209,133", "252,213,53", "92,156,255"];
    const particles: { x: number; y: number; s: number; sx: number; sy: number; o: number; c: string }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        s: Math.random() * 1.5 + 0.5,
        sx: (Math.random() - 0.5) * 0.2, sy: (Math.random() - 0.5) * 0.2,
        o: Math.random() * 0.3 + 0.05,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.sx; p.y += p.sy;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) { p.x = Math.random() * w; p.y = Math.random() * h; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.o})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (d < 80) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(69,209,133,${0.03 * (1 - d / 80)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(animate);
    };
    animate();

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(id); };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
