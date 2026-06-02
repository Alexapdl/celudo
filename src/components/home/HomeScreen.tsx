"use client";

import { motion } from "framer-motion";
import { soundManager } from "@/lib/sound";

interface Tournament {
  id: number;
  name: string;
  sponsor: string;
  prize: string;
  players: string;
  maxPlayers: number;
  joined: number;
  reward: number;
  icon: string;
}

interface HomeScreenProps {
  points: number;
  effectiveAPY: number;
  currentTierName: string;
  currentTierBoost: number;
  tournaments: Tournament[];
  isConnected: boolean;
  onNavigatePlay: () => void;
  onNavigateStaking: () => void;
  onJoinTournament: (id: number) => void;
  onActivateDemo: () => void;
}

export default function HomeScreen({
  points,
  effectiveAPY,
  currentTierName,
  currentTierBoost,
  isConnected,
  onNavigatePlay,
  onActivateDemo,
}: HomeScreenProps) {
  return (
    <motion.div
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero */}
      <motion.section
        className="mobile-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="hero-badge">
          <span className="badge-dot" /> Live on Celo
        </div>
        <h1 className="hero-title">Play Ludo,{'\n'}Boost Your Yield</h1>
        <p className="hero-sub">
          Stake tokens, play Ludo for free, and boost your APY up to +5%
        </p>

        <motion.button
          className="hero-cta"
          onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }}
          whileTap={{ scale: 0.96 }}
        >
          <span className="hero-cta-icon">🎲</span>
          <span>Play Now</span>
        </motion.button>

        {!isConnected && (
          <motion.p
            className="hero-demo-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            No wallet?{" "}
            <button className="hero-demo-link" onClick={() => { soundManager.buttonClick(); onActivateDemo(); }}>
              Try Demo →
            </button>
          </motion.p>
        )}
      </motion.section>

      {/* Stats */}
      <motion.div
        className="mobile-stats"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { val: `${effectiveAPY.toFixed(1)}%`, lbl: "APY" },
          { val: points.toLocaleString(), lbl: "Points" },
          { val: `+${currentTierBoost.toFixed(1)}%`, lbl: "Boost" },
          { val: currentTierName === "None" ? "—" : currentTierName, lbl: "Tier" },
        ].map((stat) => (
          <motion.div key={stat.lbl} className="stat-chip" whileHover={{ scale: 1.04 }}>
            <span className="stat-chip-val">{stat.val}</span>
            <span className="stat-chip-lbl">{stat.lbl}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="mobile-actions"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="action-card"
          onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="action-icon">🎲</span>
          <div>
            <div className="action-title">Play Ludo</div>
            <div className="action-sub">Free rooms & tournaments</div>
          </div>
          <span className="action-arrow">→</span>
        </motion.button>

        <motion.button
          className="action-card"
          onClick={() => onNavigatePlay()}
          whileTap={{ scale: 0.97 }}
        >
          <span className="action-icon">🏆</span>
          <div>
            <div className="action-title">Tournaments</div>
            <div className="action-sub">Compete & earn points</div>
          </div>
          <span className="action-arrow">→</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
