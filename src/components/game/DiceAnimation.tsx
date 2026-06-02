"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface DiceAnimationProps {
  value: number; isRolling: boolean; disabled: boolean; onRoll: () => void;
}

export default function DiceAnimation({ value, isRolling, disabled, onRoll }: DiceAnimationProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [phase, setPhase] = useState<"idle" | "rolling" | "landed">("idle");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isRolling) {
      setPhase("rolling");
      let n = 0;
      const iv = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        n++;
        if (n >= 8) {
          clearInterval(iv);
          setPhase("landed");
          setDisplayValue(value);
          setTimeout(() => setPhase("idle"), 500);
        }
      }, 100);
      return () => clearInterval(iv);
    }
    setDisplayValue(value);
  }, [isRolling, value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClick = useCallback(() => {
    if (!disabled && !isRolling) { soundManager.buttonClick(); onRoll(); }
  }, [disabled, isRolling, onRoll]);

  const diceV = {
    idle: { rotate: 0, scale: 1 },
    rolling: { rotate: [0, 180, 360, 540, 720], scale: [1, 0.85, 1.1, 0.9, 1], transition: { duration: 0.8, ease: "easeInOut" as const } },
    landed: { rotate: 0, scale: [1, 1.25, 1], transition: { duration: 0.4, type: "spring" as const, stiffness: 300, damping: 12 } },
  };

  return (
    <div className="dice-area">
      <motion.div
        className="dice-display"
        animate={phase}
        variants={diceV}
        style={{
          borderColor: phase === "landed" ? "var(--gold-bright)" : "var(--gold)",
          boxShadow: phase === "landed" ? "0 0 20px rgba(201,168,76,0.3)" : "none",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span key={displayValue + (isRolling ? "-r" : "")} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.06 }}>
            {displayValue}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <motion.button
        className="btn btn-dice"
        onClick={handleClick}
        disabled={disabled || isRolling}
        whileTap={!disabled && !isRolling ? { scale: 0.94 } : {}}
        animate={disabled || isRolling ? { opacity: 0.5 } : { opacity: 1 }}
      >
        {isRolling ? "Rolling..." : <><Dices size={18} /> Roll</>}
      </motion.button>
    </div>
  );
}
