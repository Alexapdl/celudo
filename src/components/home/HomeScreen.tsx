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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function HomeScreen({
  points,
  effectiveAPY,
  currentTierName,
  currentTierBoost,
  tournaments,
  isConnected,
  onNavigatePlay,
  onNavigateStaking,
  onJoinTournament,
  onActivateDemo,
}: HomeScreenProps) {
  return (
    <motion.div
      className="container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section className="hero-compact" variants={itemVariants}>
        <div className="hero-badge">
          <span className="badge-dot"></span> Live on Celo
        </div>
        <h1 className="hero-title">
          <span className="glitch-word" data-text="Play">Play</span>{" "}
          <span className="glitch-word" data-text="Ludo," style={{ animationDelay: ".15s" }}>Ludo,</span>
          <br />
          <span className="glitch-word" data-text="Boost" style={{ animationDelay: ".3s" }}>Boost</span>{" "}
          <span className="glitch-word" data-text="Your" style={{ animationDelay: ".45s" }}>Your</span>{" "}
          <span className="glitch-word neon-gold" data-text="Yield" style={{ animationDelay: ".6s" }}>Yield</span>
        </h1>
        <p className="hero-sub">
          Stake tokens for yield. Play Ludo for free. Earn points from sponsored tournaments to boost your APY up to +5%.
        </p>
        <div className="hero-btns">
          <motion.button
            className="btn btn-primary"
            onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
          >
            <span>🎲</span> Play Now
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            onClick={() => { soundManager.buttonClick(); onNavigateStaking(); }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
          >
            <span>💰</span> Start Staking
          </motion.button>
        </div>
        {!isConnected && (
          <motion.p
            className="hero-demo-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            No wallet?{" "}
            <button
              className="hero-demo-link"
              onClick={() => { soundManager.buttonClick(); onActivateDemo(); }}
            >
              Try Demo Mode →
            </button>
          </motion.p>
        )}
      </motion.section>

      <motion.section className="stats-row" variants={itemVariants}>
        {[
          { icon: "📈", val: `${effectiveAPY.toFixed(1)}%`, lbl: "Effective APY" },
          { icon: "⭐", val: points.toLocaleString(), lbl: "Your Points" },
          { icon: "🚀", val: `+${currentTierBoost.toFixed(1)}%`, lbl: "APY Boost" },
          { icon: "🏆", val: currentTierName === "None" ? "—" : currentTierName, lbl: "Tier" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="stat-card"
            whileHover={{ scale: 1.06, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-val">{stat.val}</div>
            <div className="stat-lbl">{stat.lbl}</div>
          </motion.div>
        ))}
      </motion.section>

      <motion.section className="info-section" variants={itemVariants}>
        <h2 className="sec-title">How It Works</h2>
        <div className="steps-row">
          {[
            { num: "1", ico: "💰", title: "Stake Tokens", desc: "Deposit cUSD, USDT or CELO. Earn yield automatically via Aave V3." },
            { num: "2", ico: "🎲", title: "Play Ludo Free", desc: "Join free rooms or sponsored tournaments. 2, 3 or 4 players." },
            { num: "3", ico: "⭐", title: "Earn Points", desc: "Win tournaments to earn points. Even participating gives you points." },
            { num: "4", ico: "🚀", title: "Boost APY", desc: "Redeem points to level up your tier. Higher tier = higher APY boost." },
          ].map((step, i) => (
            <motion.div
              key={i}
              className="step step-visible"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              whileHover={{ y: -8, scale: 1.04 }}
            >
              <div className="step-num">{step.num}</div>
              <div className="step-ico">{step.ico}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="info-section" variants={itemVariants}>
        <div className="sec-header-row">
          <h2 className="sec-title">🔥 Active Tournaments</h2>
          <motion.button
            className="btn btn-sm"
            onClick={() => { soundManager.buttonClick(); onNavigatePlay(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View All →
          </motion.button>
        </div>
        <div className="tournament-preview">
          {tournaments.slice(0, 3).map((t) => (
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
      </motion.section>
    </motion.div>
  );
}
