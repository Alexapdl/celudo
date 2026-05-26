"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundManager } from "@/lib/sound";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

interface DiceAnimationProps {
  value: number;
  isRolling: boolean;
  disabled: boolean;
  onRoll: () => void;
}

export default function DiceAnimation({ value, isRolling, disabled, onRoll }: DiceAnimationProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [shakePhase, setShakePhase] = useState<"idle" | "anticipation" | "rolling" | "landed">("idle");

  // Simulate the dice roll animation when isRolling changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isRolling) {
      setShakePhase("anticipation");
      let tickCount = 0;
      const tickInterval = setInterval(() => {
        tickCount++;
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        soundManager.diceTick();
        if (tickCount >= 5) {
          clearInterval(tickInterval);
          setShakePhase("rolling");
          let rollCount = 0;
          const rollInterval = setInterval(() => {
            rollCount++;
            setDisplayValue(Math.floor(Math.random() * 6) + 1);
            soundManager.diceTick();
            if (rollCount >= 6) {
              clearInterval(rollInterval);
              setShakePhase("landed");
              setDisplayValue(value);
              soundManager.diceLand(value);
              setTimeout(() => setShakePhase("idle"), 600);
            }
          }, 100);
        }
      }, 120);
      return () => {
        clearInterval(tickInterval);
      };
    } else {
      setDisplayValue(value);
    }
  }, [isRolling, value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClick = useCallback(() => {
    if (!disabled && !isRolling) {
      soundManager.buttonClick();
      onRoll();
    }
  }, [disabled, isRolling, onRoll]);

  const diceVariants = {
    idle: { rotate: 0, scale: 1, x: 0 },
    anticipation: {
      rotate: [0, -15, 15, -10, 10, -5, 5, 0],
      scale: [1, 1.05, 0.95, 1.02, 0.98, 1],
      x: [0, -4, 4, -2, 2, 0],
      transition: { duration: 0.6, ease: "easeInOut" as const },
    },
    rolling: {
      rotate: [0, 90, 180, 270, 360, 450, 540],
      scale: [1, 0.9, 1.1, 0.9, 1.05, 0.95, 1],
      transition: { duration: 0.6, ease: "easeInOut" as const },
    },
    landed: {
      rotate: [0, -10, 5, -3, 0],
      scale: [1, 1.3, 1.1, 1.05, 1],
      y: [0, -20, 5, -2, 0],
      transition: { duration: 0.5, type: "spring" as const, stiffness: 300, damping: 12 },
    },
  };

  return (
    <div className="dice-area">
      <motion.div
        className="dice-display"
        animate={shakePhase}
        variants={diceVariants}
        style={{
          background:
            shakePhase === "landed"
              ? "linear-gradient(180deg, #ffe060, #ffc020)"
              : "linear-gradient(180deg, #fff, #e8e8e8)",
          borderColor: shakePhase === "landed" ? "#ffc020" : "#ccc",
          boxShadow:
            shakePhase === "landed"
              ? "0 4px 0 #a06000, 0 6px 24px rgba(249, 168, 37, 0.5)"
              : "0 4px 0 #aaa, 0 6px 14px rgba(0, 0, 0, 0.3)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={displayValue + (isRolling ? "-roll" : "")}
            initial={{ opacity: 0, scale: 0.5, rotateX: -90 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotateX: 90 }}
            transition={{ duration: 0.08 }}
            style={{
              display: "inline-block",
              fontSize: "3rem",
              filter:
                shakePhase === "landed"
                  ? "drop-shadow(0 0 8px rgba(249, 168, 37, 0.6))"
                  : "none",
            }}
          >
            {DICE_FACES[displayValue - 1] || "🎲"}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <motion.button
        className="btn btn-primary btn-dice"
        onClick={handleClick}
        disabled={disabled || isRolling}
        whileHover={!disabled && !isRolling ? { scale: 1.06, y: -2 } : {}}
        whileTap={!disabled && !isRolling ? { scale: 0.94, y: 2 } : {}}
        animate={
          disabled || isRolling
            ? { opacity: 0.5, scale: 0.98 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {isRolling ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            Rolling...
          </motion.span>
        ) : (
          "🎲 Roll Dice"
        )}
      </motion.button>
    </div>
  );
}
