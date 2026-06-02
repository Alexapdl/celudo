"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Player, C } from "@/app/ludoEngine";
import DiceAnimation from "./DiceAnimation";
import { soundManager } from "@/lib/sound";

interface GameScreenProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gamePlayers: Player[];
  currentPlayerIndex: number;
  diceValue: number;
  isRolling: boolean;
  rollButtonDisabled: boolean;
  gameTimerText: string;
  gameLog: string[];
  gameMode: "free" | "tournament";
  gamePtsEarned: number;
  onRollDice: () => void;
  onLeaveGame: () => void;
}

export default function GameScreen({
  canvasRef,
  gamePlayers,
  currentPlayerIndex,
  diceValue,
  isRolling,
  rollButtonDisabled,
  gameTimerText,
  gameLog,
  gameMode,
  gamePtsEarned,
  onRollDice,
  onLeaveGame,
}: GameScreenProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [gameLog]);

  useEffect(() => {
    if (currentPlayerIndex === 0 && !isRolling) {
      soundManager.toastSound("info");
    }
  }, [currentPlayerIndex, isRolling]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mobile-game"
    >
      {/* Top bar: leave + mode + timer + points */}
      <div className="mobile-game-top">
        <motion.button
          className="btn btn-sm btn-ghost"
          onClick={() => { soundManager.buttonClick(); onLeaveGame(); }}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Leave
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="game-mode-badge">
            {gameMode === "free" ? "FREE" : "TOURNAMENT"}
          </span>
          <span className="game-timer">{gameTimerText}</span>
        </div>
        <motion.div
          className="game-points-display"
          key={gamePtsEarned}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
        >
          ⭐ {gamePtsEarned}pts
        </motion.div>
      </div>

      {/* Player row: compact horizontal tokens */}
      <div className="mobile-game-players">
        {gamePlayers.map((player, idx) => {
          const details = C[idx];
          const isActive = idx === currentPlayerIndex;
          return (
            <motion.div
              key={idx}
              className={`mobile-player-pill ${isActive ? "active" : ""}`}
              style={{
                borderColor: isActive ? details.bg : "transparent",
                background: isActive ? `${details.bg}15` : "rgba(255,255,255,0.03)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <span
                className="mobile-player-dot"
                style={{ background: details.bg }}
              />
              <span className="mobile-player-name">
                {idx === 0 ? "YOU" : details.name.slice(0, 1)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Board: fills remaining space */}
      <div className="mobile-game-board">
        <canvas ref={canvasRef} id="ludo-canvas" width="600" height="600"></canvas>
      </div>

      {/* Turn indicator */}
      <motion.div
        className="turn-indicator"
        style={{
          borderColor: C[currentPlayerIndex]?.bg,
          color: C[currentPlayerIndex]?.bg,
        }}
        animate={{
          boxShadow: [
            `0 0 6px ${C[currentPlayerIndex]?.bg}22`,
            `0 0 14px ${C[currentPlayerIndex]?.bg}44`,
            `0 0 6px ${C[currentPlayerIndex]?.bg}22`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {currentPlayerIndex === 0
          ? "🎲 Your Turn!"
          : `${C[currentPlayerIndex]?.name || ""}'s Turn`}
      </motion.div>

      {/* Dice + Roll button */}
      <div className="mobile-game-dice">
        <DiceAnimation
          value={diceValue}
          isRolling={isRolling}
          disabled={rollButtonDisabled || currentPlayerIndex !== 0}
          onRoll={onRollDice}
        />
      </div>

      {/* Game log */}
      <div className="mobile-game-log" ref={logRef}>
        {gameLog.map((log, idx) => (
          <motion.p
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            {log}
          </motion.p>
        ))}
        {gameLog.length === 0 && (
          <p className="text-muted text-center">Game started — roll the dice!</p>
        )}
      </div>
    </motion.div>
  );
}
