"use client";

import { useEffect, useRef } from "react";

const PIXEL = 4;

function drawPixelBlock(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, color: string
) {
  ctx.fillStyle = color;
  for (let py = 0; py < h; py += PIXEL) {
    for (let px = 0; px < w; px += PIXEL) {
      ctx.fillRect(Math.floor(x + px), Math.floor(y + py), PIXEL, PIXEL);
    }
  }
}

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animId: number;

    interface Particle {
      x: number; y: number; s: number; sx: number; sy: number; o: number; c: string;
      reset: () => void; update: () => void; draw: () => void;
    }

    const particles: Particle[] = [];
    const colors = ["255,192,32", "64,192,32", "192,96,32", "0,64,160"];

    const createParticle = (): Particle => {
      const p: Partial<Particle> = { x: 0, y: 0, s: 0, sx: 0, sy: 0, o: 0, c: "" };
      p.reset = function () {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.s = 2;
        this.sx = (Math.random() - 0.5) * 0.25;
        this.sy = (Math.random() - 0.5) * 0.25;
        this.o = Math.random() * 0.3 + 0.08;
        this.c = colors[Math.floor(Math.random() * colors.length)];
      };
      p.update = function () {
        this.x! += this.sx!;
        this.y! += this.sy!;
        if (this.x! < 0 || this.x! > w || this.y! < 0 || this.y! > h) this.reset!();
      };
      p.draw = function () {
        if (!ctx) return;
        ctx.fillStyle = `rgba(${this.c},${this.o})`;
        ctx.fillRect(Math.floor(this.x!), Math.floor(this.y!), PIXEL, PIXEL);
      };
      p.reset();
      return p as Particle;
    };

    for (let i = 0; i < 40; i++) particles.push(createParticle());

    interface Cloud { x: number; y: number; w: number; h: number; speed: number; elements: { rx: number; ry: number; rw: number; rh: number }[]; }

    const clouds: Cloud[] = [];
    for (let i = 0; i < 4; i++) {
      const cw = 40 + Math.random() * 60;
      const ch = 12 + Math.random() * 10;
      const elements: Cloud["elements"] = [];
      const cx = cw / 2;
      const cy = ch / 2;
      const r = ch * 0.5;
      for (let row = 0; row < Math.ceil(ch / PIXEL); row++) {
        for (let col = 0; col < Math.ceil(cw / PIXEL); col++) {
          const px = col * PIXEL - cx;
          const py = (row * PIXEL - cy) * 2;
          if (px * px + py * py < r * r) {
            elements.push({ rx: col * PIXEL, ry: row * PIXEL, rw: PIXEL, rh: PIXEL });
          }
        }
      }
      clouds.push({
        x: Math.random() * w * 1.3 - w * 0.15,
        y: h * (0.02 + Math.random() * 0.12),
        w: cw, h: ch,
        speed: 0.1 + Math.random() * 0.3,
        elements,
      });
    }

    const resize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (const c of clouds) {
        c.x += c.speed;
        if (c.x > w + c.w) c.x = -c.w;
        for (const el of c.elements) {
          const py = Math.floor(c.y) + el.ry;
          if (py < 0 || py > h) continue;
          ctx.fillStyle = el.ry === 0 ? "#ffffff" : "#d8e8f8";
          ctx.fillRect(Math.floor(c.x + el.rx), py, el.rw, el.rh);
        }
      }

      particles.forEach((p) => { p.update(); p.draw(); });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (d < 80) {
            ctx.fillStyle = `rgba(255,192,32,${0.04 * (1 - d / 80)})`;
            ctx.fillRect(Math.floor((particles[i].x + particles[j].x) / 2), Math.floor((particles[i].y + particles[j].y) / 2), 2, 2);
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
