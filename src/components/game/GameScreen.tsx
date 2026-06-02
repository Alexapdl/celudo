"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Player, C } from "@/app/ludoEngine";
import DiceAnimation from "./DiceAnimation";
import { soundManager } from "@/lib/sound";

interface GameScreenProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gamePlayers: Player[]; currentPlayerIndex: number; diceValue: number;
  isRolling: boolean; rollButtonDisabled: boolean; gameTimerText: string;
  gameLog: string[]; gameMode: "free" | "tournament"; gamePtsEarned: number;
  onRollDice: () => void; onLeaveGame: () => void;
}

export default function GameScreen({ canvasRef, gamePlayers, currentPlayerIndex, diceValue, isRolling, rollButtonDisabled, gameTimerText, gameLog, gameMode, gamePtsEarned, onRollDice, onLeaveGame }: GameScreenProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 0; }, [gameLog]);
  useEffect(() => { if (currentPlayerIndex === 0 && !isRolling) soundManager.toastSound("info"); }, [currentPlayerIndex, isRolling]);

  return (
    <motion.div className="mobile-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Top bar */}
      <div className="mobile-game-top">
        <motion.button className="btn btn-sm btn-ghost" onClick={() => { soundManager.buttonClick(); onLeaveGame(); }} whileTap={{ scale: 0.95 }}>
          <ArrowLeft size={14} /> Leave
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="game-mode-badge">{gameMode === "free" ? "FREE" : "TOURNAMENT"}</span>
          <span className="game-timer">{gameTimerText}</span>
        </div>
        <span className="game-points-display">{gamePtsEarned}pts</span>
      </div>

      {/* Player pills */}
      <div className="mobile-game-players">
        {gamePlayers.map((player, idx) => {
          const d = C[idx];
          const isActive = idx === currentPlayerIndex;
          return (
            <motion.div key={idx} className={`pirate-player-pill ${isActive ? "active" : ""}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
              <span className="pirate-player-dot" style={{ background: d.bg }} />
              <span className="pirate-player-name">{idx === 0 ? "YOU" : d.name[0]}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Board */}
      <div className="mobile-game-board">
        <canvas ref={canvasRef} id="ludo-canvas" width="600" height="600" />
      </div>

      {/* Turn indicator */}
      <motion.div className="turn-indicator" style={{ borderColor: C[currentPlayerIndex]?.bg, color: C[currentPlayerIndex]?.bg }}
        animate={{ boxShadow: [`0 0 4px ${C[currentPlayerIndex]?.bg}22`, `0 0 12px ${C[currentPlayerIndex]?.bg}44`, `0 0 4px ${C[currentPlayerIndex]?.bg}22`] }}
        transition={{ duration: 2, repeat: Infinity }}>
        {currentPlayerIndex === 0 ? "Your Turn" : `${C[currentPlayerIndex]?.name || ""}'s Turn`}
      </motion.div>

      {/* Dice */}
      <div className="mobile-game-dice">
        <DiceAnimation value={diceValue} isRolling={isRolling} disabled={rollButtonDisabled || currentPlayerIndex !== 0} onRoll={onRollDice} />
      </div>

      {/* Log */}
      <div className="mobile-game-log" ref={logRef}>
        {gameLog.map((l, i) => <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.1 }}>{l}</motion.p>)}
        {gameLog.length === 0 && <p className="text-muted" style={{ textAlign: "center" }}>Roll the dice to start!</p>}
      </div>
    </motion.div>
  );
}
