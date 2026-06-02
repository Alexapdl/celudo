"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Coins } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface Tournament { id: number; name: string; sponsor: string; prize: string; players: string; maxPlayers: number; joined: number; reward: number; icon: string; }

interface LobbyScreenProps {
  isConnected: boolean; cashBetAmount: string; cashBetMode: "solo" | "duo" | "4player"; cashBetLoading: boolean;
  tournaments: Tournament[];
  onStartGame: (playerCount: number, mode: "free" | "tournament") => void;
  onJoinTournament: (id: number) => void; onJoinCashBetRoom: () => void;
  onSetCashBetAmount: (amt: string) => void; onSetCashBetMode: (mode: "solo" | "duo" | "4player") => void;
}

const panelV = { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }, exit: { opacity: 0, x: -20, transition: { duration: 0.15 } } };

export default function LobbyScreen({ isConnected, cashBetAmount, cashBetMode, cashBetLoading, tournaments, onStartGame, onJoinTournament, onJoinCashBetRoom, onSetCashBetAmount, onSetCashBetMode }: LobbyScreenProps) {
  const [tab, setTab] = useState<"free" | "tournament" | "cashbet">("free");

  return (
    <div className="container">
      <h2 className="page-title">Choose Room</h2>

      <div className="room-tabs">
        {[{ k: "free" as const, l: "Free" }, { k: "tournament" as const, l: "Tourney" }, { k: "cashbet" as const, l: "Cash Bet" }].map((t) => (
          <motion.button key={t.k} className={`room-tab ${tab === t.k ? "active" : ""}`} onClick={() => { soundManager.buttonClick(); setTab(t.k); }} whileTap={{ scale: 0.95 }}>{t.l}</motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "free" && (
          <motion.div key="free" variants={panelV} initial="hidden" animate="visible" exit="exit">
            <div className="room-grid">
              {[
                { count: 2, title: "1v1 Duel", desc: "Fast 2-player showdown", pts: "+5", win: "+10" },
                { count: 3, title: "3-Player Brawl", desc: "Strategic 3-way battle", pts: "+8", win: "+15" },
                { count: 4, title: "4-Player Classic", desc: "Full board Ludo", pts: "+10", win: "+25" },
              ].map((r) => (
                <motion.div key={r.count} className="room-card" onClick={() => { soundManager.buttonClick(); onStartGame(r.count, "free"); }} whileTap={{ scale: 0.98 }}>
                  <div className="room-badge free">FREE</div>
                  <div style={{ color: "var(--gold)", marginBottom: 8 }}><Users size={28} /></div>
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                  <div className="room-reward">{r.pts} pts per game, {r.win} if you win</div>
                  <button className="btn btn-primary btn-block" onClick={(e) => { e.stopPropagation(); soundManager.buttonClick(); onStartGame(r.count, "free"); }}>Play</button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "tournament" && (
          <motion.div key="tourney" variants={panelV} initial="hidden" animate="visible" exit="exit">
            <div className="room-grid">
              {tournaments.map((t) => (
                <motion.div key={t.id} className="room-card" onClick={() => { soundManager.buttonClick(); onJoinTournament(t.id); }} whileTap={{ scale: 0.98 }}>
                  <div className="room-badge tournament">TOURNAMENT</div>
                  <h3>{t.name}</h3>
                  <div className="room-info-row">Sponsored by {t.sponsor}</div>
                  <div className="room-prize">{t.prize}</div>
                  <p>{t.players} &middot; {t.joined}/{t.maxPlayers} joined</p>
                  <div className="room-reward">Win up to +{t.reward} points</div>
                  <button className="btn btn-primary btn-block" onClick={(e) => { e.stopPropagation(); soundManager.buttonClick(); onJoinTournament(t.id); }}>Join</button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "cashbet" && (
          <motion.div key="cashbet" variants={panelV} initial="hidden" animate="visible" exit="exit">
            <div className="cashbet-card">
              <div className="cashbet-header">
                <Coins size={32} color="var(--gold)" style={{ display: "block", margin: "0 auto 8px" }} />
                <h3>Cash Bet Room</h3>
                <p>Put USDm on the line. Winner takes the pool minus 5% treasury fee.</p>
              </div>
              <div className="cashbet-section">
                <label className="cashbet-label">Mode</label>
                <div className="cashbet-mode-grid">
                  {[{ k: "solo" as const, l: "1v1", p: "2p" }, { k: "duo" as const, l: "2v2", p: "4p" }, { k: "4player" as const, l: "FFA", p: "4p" }].map((m) => (
                    <motion.div key={m.k} className={`cashbet-mode-card ${cashBetMode === m.k ? "selected" : ""}`} onClick={() => { soundManager.buttonClick(); onSetCashBetMode(m.k); }} whileTap={{ scale: 0.95 }}>
                      <div className="cbm-name">{m.l}</div><div className="cbm-players">{m.p}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="cashbet-section">
                <label className="cashbet-label">Bet Amount (USDm)</label>
                <div className="cashbet-amounts">
                  {["0.1", "0.5", "1.0", "5.0"].map((a) => (
                    <motion.button key={a} className={`cashbet-amt-btn ${cashBetAmount === a ? "selected" : ""}`} onClick={() => { soundManager.buttonClick(); onSetCashBetAmount(a); }} whileTap={{ scale: 0.92 }}>${a}</motion.button>
                  ))}
                </div>
              </div>
              <div className="cashbet-summary">
                <div className="cbs-row"><span>Your bet</span><strong>${cashBetAmount}</strong></div>
                <div className="cbs-row"><span>Pool</span><strong>${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4)).toFixed(2)}</strong></div>
                <div className="cbs-row muted"><span>Fee (5%)</span><span>-${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4) * 0.05).toFixed(3)}</span></div>
                <div className="cbs-row highlight"><span>Max payout</span><strong>${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4) * 0.95).toFixed(3)}</strong></div>
              </div>
              <button className="btn btn-primary btn-block cashbet-play-btn" onClick={() => { soundManager.buttonClick(); onJoinCashBetRoom(); }} disabled={cashBetLoading || !isConnected}>
                {cashBetLoading ? "Processing..." : isConnected ? "Place Bet & Play" : "Connect Wallet"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
