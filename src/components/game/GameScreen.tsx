"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, Clock, Users } from "lucide-react";
import { Player, C } from "@/app/ludoEngine";
import DiceAnimation from "./DiceAnimation";

interface GameScreenProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gamePlayers: Player[]; currentPlayerIndex: number; diceValue: number;
  isRolling: boolean; rollButtonDisabled: boolean; gameTimerText: string;
  gameMode: "free" | "tournament"; gamePtsEarned: number;
  onRollDice: () => void; onLeaveGame: () => void;
}

function TokenDots({ tokens, color }: { tokens: number[]; color: string }) {
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
      {tokens.map((pos, i) => {
        const finished = pos === 57;
        const onTrack = pos >= 0 && pos < 57;
        return (
          <div
            key={i}
            title={finished ? "Home" : onTrack ? `Pos ${pos}` : "Base"}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: finished ? color : onTrack ? color + "99" : "rgba(255,255,255,0.12)",
              border: `1px solid ${finished ? color : onTrack ? color + "cc" : "rgba(255,255,255,0.2)"}`,
              transition: "all 0.3s",
            }}
          />
        );
      })}
    </div>
  );
}

export default function GameScreen({
  canvasRef, gamePlayers, currentPlayerIndex, diceValue,
  isRolling, rollButtonDisabled, gameTimerText, gameMode, gamePtsEarned,
  onRollDice, onLeaveGame,
}: GameScreenProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <motion.div className="mobile-game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* === TOP CARD === */}
      <div className="game-card game-card-top">
        <motion.button className="btn btn-sm btn-ghost" onClick={() => setShowConfirm(true)} whileTap={{ scale: 0.95 }}>
          <ArrowLeft size={14} /> Leave
        </motion.button>
        <div className="game-card-top-center">
          <span className="game-mode-badge">{gameMode === "free" ? "FREE" : "TOURNEY"}</span>
          <span className="game-timer"><Clock size={12} style={{ display: "inline", marginRight: 4 }} />{gameTimerText}</span>
        </div>
        <span className="game-points-display">+{gamePtsEarned}</span>
      </div>

      {/* === BOARD === */}
      <div className="game-card game-card-board">
        <canvas ref={canvasRef} id="ludo-canvas" width="600" height="600" />
      </div>

      {/* === PLAYERS CARD === */}
      <div className="game-card game-card-players">
        <div className="game-card-label"><Users size={12} /> Players</div>
        <div className="game-players-row">
          {gamePlayers.map((player, idx) => {
            const d = C[idx];
            const isActive = idx === currentPlayerIndex;
            const finishedCount = player.tokens ? player.tokens.filter(p => p === 57).length : 0;
            return (
              <motion.div
                key={idx}
                className={`game-player-slot ${isActive ? "active" : ""}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <div className="game-player-avatar" style={{ background: isActive ? d.bg : "rgba(255,255,255,0.04)" }}>
                  <span className="game-player-letter" style={{ color: isActive ? "#fff" : d.bg }}>
                    {idx === 0 ? "U" : d.name[0]}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span className="game-player-status">{finishedCount}/4</span>
                  {player.tokens && <TokenDots tokens={player.tokens} color={d.bg} />}
                </div>
                {isActive && <span className="game-player-turn">TURN</span>}
              </motion.div>
            );
          })}
        </div>
        <motion.div
          className="turn-bar"
          style={{ background: `linear-gradient(90deg, ${C[currentPlayerIndex]?.bg}44, ${C[currentPlayerIndex]?.bg}08)` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {currentPlayerIndex === 0 ? "Your turn — roll the dice!" : `${C[currentPlayerIndex]?.name || ""} is thinking...`}
        </motion.div>
      </div>

      {/* === DICE CARD === */}
      <div className="game-card game-card-dice">
        <DiceAnimation
          value={diceValue}
          isRolling={isRolling}
          disabled={rollButtonDisabled || currentPlayerIndex !== 0}
          onRoll={onRollDice}
        />
      </div>

      {/* === LEAVE CONFIRMATION === */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div className="modal-overlay active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} onClick={(e) => e.stopPropagation()}>
              <AlertTriangle size={40} color="var(--gold)" style={{ margin: "0 auto 12px", display: "block" }} />
              <h2>Leave Game?</h2>
              <p>You will lose all progress in this match.</p>
              <div className="modal-btns">
                <button className="btn btn-primary" onClick={() => { setShowConfirm(false); onLeaveGame(); }}>Leave</button>
                <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
