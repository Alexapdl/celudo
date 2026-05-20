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

    const handleResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    interface Particle {
      x: number;
      y: number;
      s: number;
      sx: number;
      sy: number;
      o: number;
      c: string;
      reset: () => void;
      update: () => void;
      draw: () => void;
    }

    const particles: Particle[] = [];
    const colors = ["53,208,127", "255,215,0", "168,85,247"]; // green, gold, purple

    const createParticle = (): Particle => {
      const p: Partial<Particle> = {
        x: 0,
        y: 0,
        s: 0,
        sx: 0,
        sy: 0,
        o: 0,
        c: "",
      };

      p.reset = function () {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.s = Math.random() * 1.5 + 0.5;
        this.sx = (Math.random() - 0.5) * 0.25;
        this.sy = (Math.random() - 0.5) * 0.25;
        this.o = Math.random() * 0.4 + 0.1;
        this.c = colors[Math.floor(Math.random() * colors.length)];
      };

      p.update = function () {
        this.x! += this.sx!;
        this.y! += this.sy!;
        if (this.x! < 0 || this.x! > w || this.y! < 0 || this.y! > h) {
          this.reset!();
        }
      };

      p.draw = function () {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x!, this.y!, this.s!, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.c},${this.o})`;
        ctx.fill();
      };

      p.reset();
      return p as Particle;
    };

    for (let i = 0; i < 60; i++) {
      particles.push(createParticle());
    }

    let animationFrameId: number;

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(53,208,127,${0.04 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef} />;
}
