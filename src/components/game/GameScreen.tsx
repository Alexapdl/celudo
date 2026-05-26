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

  // Auto-scroll log to top when new entries come in
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [gameLog]);

  // Sound effect on turn change
  useEffect(() => {
    if (currentPlayerIndex === 0 && !isRolling) {
      // Subtle notification that it's your turn
      soundManager.toastSound("info");
    }
  }, [currentPlayerIndex, isRolling]);

  return (
    <motion.div
      className="view active"
      id="view-game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="game-layout">
        {/* Left: Player Cards */}
        <div className="game-sidebar">
          {gamePlayers.map((player, idx) => {
            const details = C[idx];
            const isActive = idx === currentPlayerIndex;
            const statusText = player.done
              ? "🏆 WIN"
              : player.pos === -1
              ? "🏠 Base"
              : player.pos >= 52
              ? "🏠 Home Run"
              : `Step ${player.pos}`;

            return (
              <motion.div
                key={idx}
                className={`player-card ${isActive ? "active" : ""}`}
                style={{ borderColor: details.bg }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 300 }}
                layout
              >
                <div className="pc-avatar" style={{ backgroundColor: details.bg }}>
                  {idx === 0 ? "👤" : "🤖"}
                </div>
                <div className="pc-info">
                  <div className="pc-name" style={{ color: details.light }}>
                    {idx === 0 ? "You" : details.name}
                  </div>
                  <div className="pc-role">{statusText}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Center: Board + Controls */}
        <div className="game-center">
          <div className="game-top-bar">
            <motion.button
              className="btn btn-sm btn-ghost"
              onClick={() => { soundManager.buttonClick(); onLeaveGame(); }}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Leave
            </motion.button>
            <div className="game-info">
              <span className={`game-mode-badge ${gameMode === "free" ? "free-badge" : "tournament-badge"}`}>
                {gameMode === "free" ? "FREE ROOM" : "TOURNAMENT"}
              </span>
              <motion.span
                className="game-timer"
                key={gameTimerText}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                {gameTimerText}
              </motion.span>
            </div>
            <motion.div
              className="game-points-display"
              key={gamePtsEarned}
              initial={{ scale: 1.3, color: "#ffc020" }}
              animate={{ scale: 1, color: "#ffc020" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              ⭐ <span>{gamePtsEarned}</span> pts
            </motion.div>
          </div>

          <div className="game-board-wrap">
            <canvas ref={canvasRef} id="ludo-canvas" width="600" height="600"></canvas>
          </div>

          <div className="game-bottom">
            <DiceAnimation
              value={diceValue}
              isRolling={isRolling}
              disabled={rollButtonDisabled || currentPlayerIndex !== 0}
              onRoll={onRollDice}
            />

            <motion.div
              className="turn-indicator"
              style={{
                borderColor: C[currentPlayerIndex]?.bg,
                color: C[currentPlayerIndex]?.bg,
              }}
              animate={{
                boxShadow: [
                  `0 0 6px ${C[currentPlayerIndex]?.bg}22`,
                  `0 0 18px ${C[currentPlayerIndex]?.bg}55`,
                  `0 0 6px ${C[currentPlayerIndex]?.bg}22`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {currentPlayerIndex === 0
                ? "🎲 Your Turn!"
                : `${C[currentPlayerIndex]?.name || ""}'s Turn...`}
            </motion.div>

            <div className="game-log" ref={logRef}>
              {gameLog.map((log, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {log}
                </motion.p>
              ))}
              {gameLog.length === 0 && (
                <p className="text-muted text-center py-2">Game initialized. Good luck!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
