"use client";

import { motion } from "framer-motion";

interface RecentGame {
  mode: string;
  players: number;
  won: boolean;
  points: number;
  date: Date;
}

interface ProfileScreenProps {
  isConnected: boolean;
  walletAddress: string | null;
  currentTierName: string;
  gamesPlayed: number;
  wins: number;
  points: number;
  progressPercent: number;
  nextTierName: string | null;
  nextTierMin: number;
  pointsToNext: number | null;
  recentGames: RecentGame[];
}

const tiers = [
  { name: "None", min: 0, boost: 0 },
  { name: "🥉 Bronze", min: 100, boost: 0.5 },
  { name: "🥈 Silver", min: 500, boost: 1.0 },
  { name: "🥇 Gold", min: 2000, boost: 2.0 },
  { name: "💎 Diamond", min: 10000, boost: 3.0 },
  { name: "👑 Legend", min: 50000, boost: 5.0 },
];

export default function ProfileScreen({
  isConnected,
  walletAddress,
  currentTierName,
  gamesPlayed,
  wins,
  points,
  progressPercent,
  nextTierName,
  nextTierMin,
  pointsToNext,
  recentGames,
}: ProfileScreenProps) {
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  return (
    <div className="container">
      <motion.h2
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Profile
      </motion.h2>

      <motion.div
        className="profile-header-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div
          className="profile-avatar"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          🎮
        </motion.div>
        <div className="profile-info">
          <div className="profile-addr">{isConnected && walletAddress ? walletAddress : "Not Connected"}</div>
          <div className="profile-tier-badge">{currentTierName === "None" ? "No Tier" : currentTierName}</div>
        </div>
      </motion.div>

      <motion.div
        className="profile-stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { val: gamesPlayed, lbl: "Games Played" },
          { val: wins, lbl: "Wins" },
          { val: points.toLocaleString(), lbl: "Total Points" },
          { val: `${winRate}%`, lbl: "Win Rate" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="pstat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="pstat-val">{stat.val}</div>
            <div className="pstat-lbl">{stat.lbl}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.section
        className="info-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="sec-title">Points Progress</h2>
        <div className="tier-progress">
          <div className="tier-bar-wrap">
            <div className="tier-bar-label">
              <span>
                {currentTierName} ({points} pts)
              </span>
              <span>
                {nextTierName || "👑 Legend"} ({nextTierMin || 50000} pts)
              </span>
            </div>
            <div className="tier-bar">
              <motion.div
                className="tier-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
              />
            </div>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text2)", marginTop: "8px" }}>
            {pointsToNext !== null
              ? `${pointsToNext} more points to reach ${nextTierName} (+${(
                  tiers.find((t) => t.name === nextTierName)?.boost ?? 0
                ).toFixed(1)}% APY boost)`
              : "Maximum tier reached! 🎉"}
          </p>
        </div>
      </motion.section>

      <motion.section
        className="info-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="sec-title">Recent Games</h2>
        <div className="recent-games">
          {recentGames.map((game, idx) => (
            <motion.div
              key={idx}
              className="game-entry"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
            >
              <span>
                {game.mode === "tournament" ? "🏆" : "🎲"} {game.players}-Player {game.mode}
              </span>
              <span className={game.won ? "game-result-win" : "game-result-loss"}>
                {game.won ? "WIN" : "LOSS"} — +{game.points} pts
              </span>
            </motion.div>
          ))}
          {recentGames.length === 0 && (
            <p className="text-muted">No games played yet. Go play some Ludo!</p>
          )}
        </div>
      </motion.section>
    </div>
  );
}
