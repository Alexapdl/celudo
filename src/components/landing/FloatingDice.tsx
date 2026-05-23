"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const DICE_FACES = ["🎲", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function FloatingDie({ delay, x, y, size, duration }: { delay: number; x: string; y: string; size: string; duration: number }) {
  return (
    <motion.div
      className="floating-die-item"
      style={{ left: x, top: y, fontSize: size }}
      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
      animate={{
        opacity: [0, 0.7, 0.7, 0],
        y: [0, -40, -80],
        rotate: [-20, 10, 30],
        scale: [0.5, 1, 0.8],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 2,
        ease: "easeOut",
      }}
    >
      🎲
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
    { x: "30%", y: "80%", size: "2.6rem", duration: 4.2 },
    { x: "92%", y: "40%", size: "1.6rem", duration: 5.2 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.slice(0, count).map((p, i) => (
        <FloatingDie
          key={i}
          delay={i * 0.8}
          x={p.x}
          y={p.y}
          size={p.size}
          duration={p.duration}
        />
      ))}
    </div>
  );
}