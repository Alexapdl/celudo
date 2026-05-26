"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const MARIO_ITEMS = ["🍄", "⭐", "🌿", "🧱", "❓", "🎵"];

function FloatingItem({ delay, x, y, size, duration, emoji }: { delay: number; x: string; y: string; size: string; duration: number; emoji: string }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((r) => r + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="floating-die-item"
      style={{ left: x, top: y, fontSize: size, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
      initial={{ opacity: 0, scale: 0.5, y: "0px" }}
      animate={{
        opacity: [0, 0.8, 0.8, 0],
        y: [0, -30, -70],
        scale: [0.5, 1.1, 0.9],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 2,
        ease: "easeOut",
      }}
    >
      {emoji}
    </motion.div>
  );
}

export default function FloatingDice({ count = 8 }: { count?: number }) {
  const positions = [
    { x: "8%", y: "20%", size: "2.5rem", duration: 4 },
    { x: "85%", y: "15%", size: "3rem", duration: 5 },
    { x: "15%", y: "60%", size: "2rem", duration: 3.5 },
    { x: "75%", y: "55%", size: "2.8rem", duration: 4.5 },
    { x: "45%", y: "10%", size: "1.8rem", duration: 5.5 },
    { x: "60%", y: "70%", size: "2.2rem", duration: 3.8 },
    { x: "30%", y: "40%", size: "2.4rem", duration: 4.2 },
    { x: "90%", y: "35%", size: "2.1rem", duration: 5.2 },
    { x: "50%", y: "80%", size: "3rem", duration: 3.2 },
    { x: "5%", y: "75%", size: "2.3rem", duration: 4.8 },
  ];

  const items = Array.from({ length: count }, (_, i) => positions[i % positions.length]);

  return (
    <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }}>
      {items.map((pos, i) => (
        <FloatingItem
          key={i}
          delay={i * 0.4}
          x={pos.x}
          y={pos.y}
          size={pos.size}
          duration={pos.duration}
          emoji={MARIO_ITEMS[i % MARIO_ITEMS.length]}
        />
      ))}
    </div>
  );
}
