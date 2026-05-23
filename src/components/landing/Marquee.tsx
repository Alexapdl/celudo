"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}

export default function Marquee({
  children,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className = "",
}: MarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className={`overflow-hidden relative ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div
        className="flex gap-6 whitespace-nowrap"
        style={{
          animation: `marquee-scroll ${speed}s linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

interface LiveMatchProps {
  players: { name: string; color: string; emoji: string }[];
  mode: string;
  stakes: string;
}

export function LiveMatchCard({ players, mode, stakes }: LiveMatchProps) {
  return (
    <div className="live-match-card group">
      <div className="flex items-center gap-2 mb-2">
        <span className="live-indicator" />
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--green)]">
          LIVE
        </span>
        <span className="text-[0.6rem] text-[var(--muted)]">{mode}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-lg">{p.emoji}</span>
            <span className="text-[0.7rem] text-[var(--text)] font-semibold">{p.name}</span>
            {i < players.length - 1 && <span className="text-[var(--muted)] text-xs">vs</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] text-[var(--gold)] font-bold">{stakes}</span>
        <span className="text-[0.6rem] text-[var(--muted)]">rolling...</span>
      </div>
    </div>
  );
}

interface RollingDiceProps {
  size?: number;
}

export function RollingDice({ size = 40 }: RollingDiceProps) {
  const [face, setFace] = useState(3);
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    if (!isRolling) return;
    const interval = setInterval(() => {
      setFace(Math.floor(Math.random() * 6) + 1);
    }, 120);
    const timeout = setTimeout(() => {
      setIsRolling(false);
      setFace(Math.floor(Math.random() * 6) + 1);
    }, 1200);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isRolling]);

  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };

  return (
    <div
      className="inline-flex items-center justify-center rounded-xl border-2 border-white/20 shadow-lg"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(180deg, #fff, #e8e8e8)",
        animation: isRolling ? "dice-roll 0.15s linear infinite" : "none",
        transition: "transform 0.2s",
      }}
    >
      <svg viewBox="0 0 100 100" width={size - 8} height={size - 8}>
        {dots[face]?.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="8" fill="#1a1525" />
        ))}
      </svg>
    </div>
  );
}