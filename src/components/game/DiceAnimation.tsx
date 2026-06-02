"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { soundManager } from "@/lib/sound";

interface DiceAnimationProps {
  value: number; isRolling: boolean; disabled: boolean; onRoll: () => void;
}

export default function DiceAnimation({ value, isRolling, disabled, onRoll }: DiceAnimationProps) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [phase, setPhase] = useState<"idle" | "rolling" | "landed">("idle");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isRolling) {
      setPhase("rolling");
      let n = 0;
      const iv = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        n++;
        if (n >= 12) { clearInterval(iv); setPhase("landed"); setDisplayValue(value || 1); setTimeout(() => setPhase("idle"), 600); }
      }, 70);
      return () => clearInterval(iv);
    }
    setDisplayValue(value || 1);
  }, [isRolling, value]);

  const handleRoll = useCallback(() => {
    if (!disabled && !isRolling) { soundManager.buttonClick(); onRoll(); }
  }, [disabled, isRolling, onRoll]);

  const isActionable = !disabled && !isRolling;
  const v = displayValue || 1;

  // Standard dice face patterns (3x3 grid: tl,tc,tr, ml,c,mr, bl,bc,br)
  const face: Record<number, boolean[]> = {
    1: [0,0,0, 0,1,0, 0,0,0].map(Boolean),
    2: [0,0,1, 0,0,0, 1,0,0].map(Boolean),
    3: [0,0,1, 0,1,0, 1,0,0].map(Boolean),
    4: [1,0,1, 0,0,0, 1,0,1].map(Boolean),
    5: [1,0,1, 0,1,0, 1,0,1].map(Boolean),
    6: [1,0,1, 1,0,1, 1,0,1].map(Boolean),
  };
  const dots = face[v] || face[1];

  return (
    <div className="dice-roll-container">
      <motion.button
        className={`dice-btn ${phase}`}
        onClick={handleRoll}
        disabled={!isActionable}
        animate={phase}
        variants={{
          idle: { rotate: 0, scale: 1 },
          rolling: { rotate: [0, -180, -360, -540, -720], scale: [1, 1.06, 0.94, 1.04, 1], transition: { duration: 0.85, ease: "easeInOut" } },
          landed: { rotate: 0, scale: [1, 1.16, 1], transition: { duration: 0.4, type: "spring", stiffness: 300, damping: 12 } },
        }}
      >
        <div className="dice-dots">
          {dots.map((on, i) => (
            <span key={i} className={`dot ${on ? "" : "off"}`} />
          ))}
        </div>
      </motion.button>
      <span className="dice-hint">{isRolling ? "Rolling..." : isActionable ? "Tap dice" : "Wait..."}</span>
    </div>
  );
}
