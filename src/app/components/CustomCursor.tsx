"use client";

import { useEffect } from "react";

export default function CustomCursor() {
  useEffect(() => {
    // Check if on touch devices (pointer: coarse)
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    // --- Inner dot ---
    const dot = document.createElement("div");
    dot.id = "px-cursor";
    document.body.appendChild(dot);

    // --- Outer ring ---
    const ring = document.createElement("div");
    ring.id = "px-cursor-ring";
    document.body.appendChild(ring);

    let mx = 0, my = 0;
    let rx = 0, ry = 0;
    let appeared = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
      if (!appeared) {
        appeared = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      spawnTrail(mx, my);
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      rafId = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(animateRing);

    // Hover state: dot + ring change color on interactive elements
    const INTERACTIVE = "a, button, .room-card, .nav-item, .room-tab, .stat-card, .step, .btn, .wallet-btn";
    
    const handleMouseEnter = () => {
      dot.classList.add("hovered");
      ring.classList.add("hovered");
    };

    const handleMouseLeave = () => {
      dot.classList.remove("hovered");
      ring.classList.remove("hovered");
    };

    // We can use event delegation for hover states
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && target.closest(INTERACTIVE)) {
        handleMouseEnter();
      } else {
        handleMouseLeave();
      }
    };

    document.addEventListener("mouseover", onOver);

    // Soft trail
    let lastTrail = 0;
    const TRAIL_COLORS = [
      "rgba(249, 168, 37, 0.4)",
      "rgba(67, 176, 71, 0.35)",
      "rgba(229, 37, 33, 0.3)",
    ];

    function spawnTrail(x: number, y: number) {
      const now = Date.now();
      if (now - lastTrail < 45) return;
      lastTrail = now;
      const d = document.createElement("div");
      d.className = "px-trail";
      const sz = Math.floor(Math.random() * 4) + 4; // 4–7px
      d.style.cssText = `
        left:${x}px; top:${y}px;
        width:${sz}px; height:${sz}px;
        background:${TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)]};
      `;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 500);
    }

    // Gentle burst on click
    const onClick = (e: MouseEvent) => {
      const DIRS = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1],
      ];
      const BURST_COLORS = [
        "rgba(249,168,37,0.65)",
        "rgba(67,176,71,0.6)",
        "rgba(229,37,33,0.55)",
      ];
      DIRS.forEach(([dx, dy]) => {
        const p = document.createElement("div");
        p.className = "px-burst";
        const dist = 14 + Math.random() * 10;
        const sz = 4 + Math.floor(Math.random() * 5); // 4–8px
        p.style.cssText = `
          left:${e.clientX}px; top:${e.clientY}px;
          width:${sz}px; height:${sz}px;
          background:${BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)]};
          --tx:${(dx * dist).toFixed(1)}px;
          --ty:${(dy * dist).toFixed(1)}px;
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
      });
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(rafId);
      if (document.body.contains(dot)) document.body.removeChild(dot);
      if (document.body.contains(ring)) document.body.removeChild(ring);
    };
  }, []);

  return null;
}
