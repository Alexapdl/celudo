"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface LobbyScreenProps {
  isConnected: boolean;
  cashBetAmount: string;
  cashBetMode: "solo" | "duo" | "4player";
  cashBetLoading: boolean;
  tournaments: Tournament[];
  onStartGame: (playerCount: number, mode: "free" | "tournament") => void;
  onJoinTournament: (id: number) => void;
  onJoinCashBetRoom: () => void;
  onSetCashBetAmount: (amt: string) => void;
  onSetCashBetMode: (mode: "solo" | "duo" | "4player") => void;
}

const panelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export default function LobbyScreen({
  isConnected,
  cashBetAmount,
  cashBetMode,
  cashBetLoading,
  tournaments,
  onStartGame,
  onJoinTournament,
  onJoinCashBetRoom,
  onSetCashBetAmount,
  onSetCashBetMode,
}: LobbyScreenProps) {
  const [playTab, setPlayTab] = useState<"free" | "tournament" | "cashbet">("free");

  return (
    <div className="container">
      <motion.h2
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Choose Your Room
      </motion.h2>

      <div className="room-tabs">
        {([
          { key: "free" as const, label: "🎲 Free Rooms" },
          { key: "tournament" as const, label: "🏆 Tournaments" },
          { key: "cashbet" as const, label: "💸 Cash Bet" },
        ]).map((tab) => (
          <motion.button
            key={tab.key}
            className={`room-tab ${playTab === tab.key ? "active" : ""}`}
            onClick={() => { soundManager.buttonClick(); setPlayTab(tab.key); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {playTab === "free" && (
          <motion.div
            key="free"
            className="room-panel active"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="room-grid">
              {[
                { count: 2, title: "1v1 Quick Match", desc: "Fast-paced 2-player duel", pts: "+5", winPts: "+10", emojis: "👤👤" },
                { count: 3, title: "3-Player Battle", desc: "Strategic 3-way showdown", pts: "+8", winPts: "+15", emojis: "👤👤👤" },
                { count: 4, title: "4-Player Classic", desc: "Full board classic Ludo", pts: "+10", winPts: "+25", emojis: "👤👤👤👤" },
              ].map((room) => (
                <motion.div
                  key={room.count}
                  className="room-card"
                  onClick={() => { soundManager.buttonClick(); onStartGame(room.count, "free"); }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="room-badge free">FREE</div>
                  <div className="room-players">{room.emojis}</div>
                  <h3>{room.title}</h3>
                  <p>{room.desc}</p>
                  <div className="room-reward">
                    <span>⭐</span> {room.pts} pts per game, {room.winPts} if you win
                  </div>
                  <motion.button
                    className="btn btn-primary btn-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => { e.stopPropagation(); soundManager.buttonClick(); onStartGame(room.count, "free"); }}
                  >
                    Play Now
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {playTab === "tournament" && (
          <motion.div
            key="tournament"
            className="room-panel active"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="room-grid">
              {tournaments.map((t) => (
                <motion.div
                  key={t.id}
                  className="room-card"
                  onClick={() => { soundManager.buttonClick(); onJoinTournament(t.id); }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="room-badge tournament">TOURNAMENT</div>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{t.icon}</div>
                  <h3>{t.name}</h3>
                  <div className="room-sponsor">Sponsored by {t.sponsor}</div>
                  <div className="room-prize">🏆 {t.prize}</div>
                  <p>{t.players} • {t.joined}/{t.maxPlayers} joined</p>
                  <div className="room-reward">
                    <span>⭐</span> Win up to +{t.reward} points → Boost your APY
                  </div>
                  <motion.button
                    className="btn btn-primary btn-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => { e.stopPropagation(); soundManager.buttonClick(); onJoinTournament(t.id); }}
                  >
                    Join Free
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {playTab === "cashbet" && (
          <motion.div
            key="cashbet"
            className="room-panel active"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="cashbet-card">
              <div className="cashbet-header">
                <span className="cashbet-icon">💸</span>
                <h3>Cash Bet Room</h3>
                <p>Put USDm on the line. Winner takes the pool minus a 5% treasury fee. Powered by on-chain escrow.</p>
              </div>

              <div className="cashbet-section">
                <label className="cashbet-label">Choose Mode</label>
                <div className="cashbet-mode-grid">
                  {([
                    { key: "solo" as const, label: "1v1 Solo", icon: "👤👤", players: "2 players", desc: "Winner takes all" },
                    { key: "duo" as const, label: "2v2 Duo", icon: "👥👥", players: "4 players", desc: "Team split reward" },
                    { key: "4player" as const, label: "4-Player FFA", icon: "👤👤👤👤", players: "4 players", desc: "Sole winner takes all" },
                  ]).map((mode) => (
                    <motion.div
                      key={mode.key}
                      className={`cashbet-mode-card ${cashBetMode === mode.key ? "selected" : ""}`}
                      onClick={() => { soundManager.buttonClick(); onSetCashBetMode(mode.key); }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="cbm-icon">{mode.icon}</div>
                      <div className="cbm-name">{mode.label}</div>
                      <div className="cbm-players">{mode.players}</div>
                      <div className="cbm-desc">{mode.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="cashbet-section">
                <label className="cashbet-label">Bet Amount (USDm per player)</label>
                <div className="cashbet-amounts">
                  {["0.1", "0.5", "1.0", "5.0"].map((amt) => (
                    <motion.button
                      key={amt}
                      className={`cashbet-amt-btn ${cashBetAmount === amt ? "selected" : ""}`}
                      onClick={() => { soundManager.buttonClick(); onSetCashBetAmount(amt); }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      ${amt}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="cashbet-summary">
                <div className="cbs-row">
                  <span>Your bet</span>
                  <strong>${cashBetAmount} USDm</strong>
                </div>
                <div className="cbs-row">
                  <span>Total pool</span>
                  <strong>${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4)).toFixed(2)} USDm</strong>
                </div>
                <div className="cbs-row muted">
                  <span>Treasury fee (5%)</span>
                  <span>-${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4) * 0.05).toFixed(3)} USDm</span>
                </div>
                <div className="cbs-row highlight">
                  <span>Max payout</span>
                  <strong className="neon-green">
                    ${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : cashBetMode === "duo" ? 2 : 4) * 0.95).toFixed(3)} USDm
                  </strong>
                </div>
              </div>

              <motion.button
                className="btn btn-primary btn-block cashbet-play-btn"
                onClick={() => { soundManager.buttonClick(); onJoinCashBetRoom(); }}
                disabled={cashBetLoading || !isConnected}
                whileHover={!cashBetLoading && isConnected ? { scale: 1.02 } : {}}
                whileTap={!cashBetLoading && isConnected ? { scale: 0.98 } : {}}
              >
                {cashBetLoading ? "⏳ Processing..." : isConnected ? "🎲 Place Bet & Play" : "Connect Wallet First"}
              </motion.button>
              <p className="cashbet-note">Funds held by on-chain escrow. Admin wallet settles winner automatically.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
