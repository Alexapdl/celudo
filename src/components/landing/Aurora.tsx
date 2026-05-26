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
      ctx.fillRect(
        Math.floor(x + px),
        Math.floor(y + py),
        PIXEL,
        PIXEL
      );
    }
  }
}

interface Cloud {
  x: number; y: number; speed: number;
  data: number[][]; width: number; height: number;
}

function makeCloudData(): { data: number[][]; width: number; height: number } {
  const w = 8 + Math.floor(Math.random() * 10);
  const h = 3 + Math.floor(Math.random() * 4);
  const data: number[][] = [];
  for (let row = 0; row < h; row++) {
    data[row] = [];
    for (let col = 0; col < w; col++) {
      const cx = col - w / 2;
      const cy = (row - h / 2) * 1.8;
      const r = h * 0.6;
      data[row][col] = (cx * cx + cy * cy < r * r) ? 1 : 0;
    }
  }
  return { data, width: w, height: h };
}

function drawPixelCloud(ctx: CanvasRenderingContext2D, cloud: Cloud) {
  const ps = PIXEL * 2;
  for (let row = 0; row < cloud.height; row++) {
    for (let col = 0; col < cloud.width; col++) {
      if (cloud.data[row][col]) {
        const cx = Math.floor(cloud.x) + col * ps;
        const cy = Math.floor(cloud.y) + row * ps;
        // Cloud highlight on top edge
        const isTop = row === 0 || !cloud.data[row - 1][col];
        const color = isTop ? "#ffffff" : "#e8f0ff";
        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, ps, ps);
        // Subtle shadow
        if (row === cloud.height - 1 || !cloud.data[row + 1]?.[col]) {
          ctx.fillStyle = "#d0d8e8";
          ctx.fillRect(cx, cy + ps - 2, ps, 2);
        }
      }
    }
  }
}

export default function Aurora({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const clouds: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
      const cd = makeCloudData();
      clouds.push({
        x: Math.random() * window.innerWidth * 1.3 - window.innerWidth * 0.15,
        y: 20 + Math.random() * (window.innerHeight * 0.25),
        speed: 0.15 + Math.random() * 0.4,
        data: cd.data,
        width: cd.width,
        height: cd.height,
      });
    }

    const hillLayers = [
      { yOffset: 0.72, heights: [60, 90, 70, 100, 50], color: "#2d8c14", highlight: "#40c020" },
      { yOffset: 0.78, heights: [40, 55, 80, 45, 65], color: "#1b6e22", highlight: "#2d8c14" },
      { yOffset: 0.85, heights: [25, 35, 30, 40, 28], color: "#0d5a14", highlight: "#1b6e22" },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawPixelHills = () => {
      const ps = PIXEL * 2;
      for (const layer of hillLayers) {
        const baseY = canvas.height * layer.yOffset;
        const segW = canvas.width / layer.heights.length;

        for (let s = 0; s < layer.heights.length; s++) {
          const h = layer.heights[s];
          const startX = s * segW;
          const colors = [layer.highlight, layer.color, layer.color, layer.color];

          for (let row = 0; row < h; row += ps) {
            const rowColor = colors[Math.min(Math.floor(row / (h / 4)), colors.length - 1)];
            let segWidth = segW;
            if (s === 0) segWidth += ps;
            if (s === layer.heights.length - 1) segWidth += ps;

            for (let col = 0; col < segWidth; col += ps) {
              ctx.fillStyle = rowColor;
              ctx.fillRect(
                Math.floor(startX + col),
                Math.floor(baseY - h + row),
                ps,
                ps
              );
            }
          }
        }
      }
    };

    const drawSky = () => {
      const ps = PIXEL * 2;
      for (let y = 0; y < canvas.height; y += ps) {
        const t = y / canvas.height;
        const r = Math.floor(32 + (92 - 32) * (1 - t));
        const g = Math.floor(160 + (148 - 160) * (1 - t));
        const b = Math.floor(255 + (252 - 255) * (1 - t));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        for (let x = 0; x < canvas.width; x += ps) {
          ctx.fillRect(x, y, ps, ps);
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawSky();

      for (const c of clouds) {
        c.x += c.speed;
        const totalW = c.width * PIXEL * 2;
        if (c.x > canvas.width + totalW) c.x = -totalW;
        drawPixelCloud(ctx, c);
      }

      drawPixelHills();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 -z-10 ${className}`}
      style={{ pointerEvents: "none" }}
    />
  );
}
