"use client";

import { useEffect, useRef } from "react";

export default function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; a: number }[] = [];

    const resize = () => { w = cv.width = window.innerWidth; h = cv.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 25; i++) {
      particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2 + 1, vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1, a: Math.random() * 0.4 + 0.1 });
    }

    let frame = 0;
    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const flicker = Math.sin(frame * 0.03 + p.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(201,168,76,${p.a * flicker})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(loop);
    };
    loop();

    return () => { window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} id="bg-canvas" />;
}
