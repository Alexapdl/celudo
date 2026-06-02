"use client";

import { motion } from "framer-motion";
import { Crown, Trophy } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface VictoryModalProps {
  isOpen: boolean; won: boolean; points: number;
  onPlayAgain: () => void; onGoHome: () => void;
}

export default function VictoryModal({ isOpen, won, points, onPlayAgain, onGoHome }: VictoryModalProps) {
  if (!isOpen) return null;
  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
      <motion.div className="modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ color: won ? "var(--gold-bright)" : "var(--muted)", marginBottom: 12 }}>
          {won ? <Crown size={48} style={{ margin: "0 auto" }} /> : <Trophy size={48} style={{ margin: "0 auto" }} />}
        </div>
        <h2>{won ? "Victory!" : "Game Over"}</h2>
        <p>{won ? "You plundered the board!" : "The seas were rough this time."}</p>
        <div className="modal-reward">{won ? `+${points}` : `+${points}`} points earned</div>
        <div className="modal-btns">
          <button className="btn btn-primary" onClick={() => { soundManager.buttonClick(); onPlayAgain(); }}>Play Again</button>
          <button className="btn btn-ghost" onClick={() => { soundManager.buttonClick(); onGoHome(); }}>Home</button>
        </div>
      </motion.div>
    </div>
  );
}
