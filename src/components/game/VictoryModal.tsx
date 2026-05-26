"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sound";

interface VictoryModalProps {
  isOpen: boolean;
  won: boolean;
  points: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export default function VictoryModal({ isOpen, won, points, onPlayAgain, onGoHome }: VictoryModalProps) {
  useEffect(() => {
    if (isOpen && won) {
      soundManager.winFanfare();
      // Multi-burst confetti
      const end = Date.now() + 3000;
      const colors = ["#ffc020", "#40c020", "#c06020", "#0040a0", "#ff6b6b"];
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
          disableForReducedMotion: true,
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Big center burst
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors,
          disableForReducedMotion: true,
        });
      }, 500);
    } else if (isOpen && !won) {
      soundManager.loseSound();
    }
  }, [isOpen, won]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
          >
            {/* Animated icon */}
            <motion.div
              className="modal-icon"
              animate={
                won
                  ? {
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.2, 1, 1.15, 1],
                    }
                  : { y: [0, -5, 0], opacity: [1, 0.7, 1] }
              }
              transition={
                won
                  ? { duration: 1, repeat: Infinity, repeatDelay: 1 }
                  : { duration: 2, repeat: Infinity }
              }
            >
              {won ? "🏆" : "😢"}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {won ? "Victory!" : "Game Over"}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {won
                ? "Congratulations! You won the game!"
                : "Better luck next time!"}
            </motion.p>

            <motion.div
              className="modal-reward"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <motion.span
                animate={
                  won
                    ? {
                        textShadow: [
                          "0 0 10px rgba(249,168,37,0.3)",
                          "0 0 30px rgba(249,168,37,0.8)",
                          "0 0 10px rgba(249,168,37,0.3)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⭐ +{points} Points Earned
              </motion.span>
            </motion.div>

            <motion.div
              className="modal-btns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                className="btn btn-primary"
                onClick={() => {
                  soundManager.buttonClick();
                  onPlayAgain();
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 2 }}
              >
                Play Again
              </motion.button>
              <motion.button
                className="btn btn-secondary"
                onClick={() => {
                  soundManager.buttonClick();
                  onGoHome();
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 2 }}
              >
                Home
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
