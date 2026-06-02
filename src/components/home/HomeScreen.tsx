"use client";

import { motion } from "framer-motion";
import { Ship, Sword, Dices } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface Tournament { id: number; name: string; sponsor: string; prize: string; players: string; maxPlayers: number; joined: number; reward: number; icon: string; }

interface HomeScreenProps {
  points: number; effectiveAPY: number; currentTierName: string; currentTierBoost: number;
  tournaments: Tournament[]; isConnected: boolean;
  onNavigatePlay: () => void; onJoinTournament: (id: number) => void; onActivateDemo: () => void;
}

export default function HomeScreen({ points, effectiveAPY, currentTierName, currentTierBoost, isConnected, onNavigatePlay, onActivateDemo }: HomeScreenProps) {
  return (
    <motion.div className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <section className="hero-section">
        <div className="hero-badge"><span className="badge-dot" /> Live on Celo</div>
        <h1 className="hero-title">Play Ludo,{'\n'}Plunder Yield</h1>
        <p className="hero-sub">Stake tokens, play Ludo for free, and boost your APY with tournament points</p>
        <motion.button className="hero-cta" onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }} whileTap={{ scale: 0.96 }}>
          <Ship size={20} /> Play Now
        </motion.button>
        {!isConnected && (
          <motion.p className="hero-demo-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            No wallet? <button className="hero-demo-link" onClick={() => { soundManager.buttonClick(); onActivateDemo(); }}>Try Demo</button>
          </motion.p>
        )}
      </section>

      <div className="stats-row">
        {[
          { val: `${effectiveAPY.toFixed(1)}%`, lbl: "APY" },
          { val: points.toLocaleString(), lbl: "Points" },
          { val: `+${currentTierBoost.toFixed(1)}%`, lbl: "Boost" },
          { val: currentTierName === "None" ? "-" : currentTierName, lbl: "Tier" },
        ].map((s) => (
          <motion.div key={s.lbl} className="stat-chip" whileTap={{ scale: 0.97 }}>
            <span className="stat-val">{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
          </motion.div>
        ))}
      </div>

      <div className="action-cards">
        <motion.button className="action-card" onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }} whileTap={{ scale: 0.97 }}>
          <span className="action-icon"><Dices size={22} /></span>
          <div className="action-info"><div className="action-title">Play Ludo</div><div className="action-sub">Free rooms & tournaments</div></div>
          <ArrowIcon />
        </motion.button>
        <motion.button className="action-card" onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }} whileTap={{ scale: 0.97 }}>
          <span className="action-icon"><Sword size={22} /></span>
          <div className="action-info"><div className="action-title">Tournaments</div><div className="action-sub">Compete & earn points</div></div>
          <ArrowIcon />
        </motion.button>
      </div>
    </motion.div>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
