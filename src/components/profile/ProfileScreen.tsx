"use client";

import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";

interface RecentGame { mode: string; players: number; won: boolean; points: number; date: Date; }

interface ProfileScreenProps {
  isConnected: boolean; walletAddress: string | null; currentTierName: string;
  gamesPlayed: number; wins: number; points: number; progressPercent: number;
  nextTierName: string | null; nextTierMin: number; pointsToNext: number | null; recentGames: RecentGame[];
}

const tiers = [
  { name: "None", min: 0, boost: 0 },
  { name: "Bronze", min: 100, boost: 0.5 },
  { name: "Silver", min: 500, boost: 1.0 },
  { name: "Gold", min: 2000, boost: 2.0 },
  { name: "Diamond", min: 10000, boost: 3.0 },
  { name: "Legend", min: 50000, boost: 5.0 },
];

export default function ProfileScreen({ isConnected, walletAddress, currentTierName, gamesPlayed, wins, points, progressPercent, nextTierName, nextTierMin, pointsToNext, recentGames }: ProfileScreenProps) {
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  return (
    <div className="container">
      <h2 className="page-title">Profile</h2>

      <motion.div className="profile-header-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <motion.div className="profile-avatar" whileTap={{ scale: 1.05 }}>
          <Gamepad2 size={22} color="var(--gold)" />
        </motion.div>
        <div>
          <div className="profile-addr">{isConnected && walletAddress ? walletAddress : "Not Connected"}</div>
          <div className="profile-tier-badge">{currentTierName === "None" ? "No Tier" : currentTierName}</div>
        </div>
      </motion.div>

      <div className="profile-stats-grid">
        {[
          { val: gamesPlayed, lbl: "Games" }, { val: wins, lbl: "Wins" },
          { val: points.toLocaleString(), lbl: "Points" }, { val: `${winRate}%`, lbl: "Win Rate" },
        ].map((s, i) => (
          <motion.div key={i} className="pstat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }} whileTap={{ scale: 0.97 }}>
            <div className="pstat-val">{s.val}</div><div className="pstat-lbl">{s.lbl}</div>
          </motion.div>
        ))}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h3 className="section-title">Points Progress</h3>
        <div className="tier-progress">
          <div className="tier-bar-label">
            <span>{currentTierName} ({points} pts)</span>
            <span>{nextTierName || "Legend"} ({nextTierMin} pts)</span>
          </div>
          <div className="tier-bar">
            <motion.div className="tier-bar-fill" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} />
          </div>
          <p className="text-muted" style={{ marginTop: 8 }}>
            {pointsToNext !== null ? `${pointsToNext} pts to ${nextTierName} (+${(tiers.find((t) => t.name === nextTierName)?.boost ?? 0).toFixed(1)}% APY)` : "Max tier!"}
          </p>
        </div>
      </section>

      <section>
        <h3 className="section-title">Recent Games</h3>
        <div className="recent-games">
          {recentGames.map((g, i) => (
            <motion.div key={i} className="game-entry" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
              <span>{g.mode === "tournament" ? "Tourney" : "Free"} {g.players}P</span>
              <span className={g.won ? "game-result-win" : "game-result-loss"}>{g.won ? "WIN" : "LOSS"} +{g.points}pts</span>
            </motion.div>
          ))}
          {recentGames.length === 0 && <p className="text-muted">No games yet. Go play!</p>}
        </div>
      </section>
    </div>
  );
}
