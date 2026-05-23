"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Aurora from "./Aurora";
import Sparkles from "./Sparkles";
import Marquee, { LiveMatchCard, RollingDice } from "./Marquee";
import GooeyText from "./GooeyText";
import PixelButton from "./PixelButton";
import FloatingDice from "./FloatingDice";
import PixelCanvas from "./PixelCanvas";

const LIVE_MATCHES = [
  {
    players: [
      { name: "0xA3f...Kira", color: "#35d07f", emoji: "🟢" },
      { name: "0xD72...Nova", color: "#ff5555", emoji: "🔴" },
      { name: "0x9B1...Zeus", color: "#4fc3f7", emoji: "🔵" },
      { name: "0xF4e...Luna", color: "#ffd700", emoji: "🟡" },
    ],
    mode: "4-Player Classic",
    stakes: "🏆 +100 pts",
  },
  {
    players: [
      { name: "0x5C3...Ace", color: "#35d07f", emoji: "🟢" },
      { name: "0x8E2...Rex", color: "#ff5555", emoji: "🔴" },
    ],
    mode: "1v1 Blitz",
    stakes: "💰 0.5 cUSD",
  },
  {
    players: [
      { name: "0x1A7...Mika", color: "#35d07f", emoji: "🟢" },
      { name: "0xB34...Yuki", color: "#ff5555", emoji: "🔴" },
      { name: "0x6F9...Dara", color: "#b388ff", emoji: "🟣" },
    ],
    mode: "3-Player Speed",
    stakes: "⭐ +50 pts",
  },
  {
    players: [
      { name: "0x2D8...Finn", color: "#35d07f", emoji: "🟢" },
      { name: "0xC45...Haze", color: "#ffd700", emoji: "🟡" },
      { name: "0x7A1...Echo", color: "#4fc3f7", emoji: "🔵" },
      { name: "0xE93...Tao", color: "#ff5555", emoji: "🔴" },
    ],
    mode: "Grand Classic",
    stakes: "👑 +200 pts",
  },
  {
    players: [
      { name: "0x4F6...Nyx", color: "#ff5555", emoji: "🔴" },
      { name: "0x0B7...Sol", color: "#35d07f", emoji: "🟢" },
    ],
    mode: "1v1 Cash Bet",
    stakes: "💰 1.0 cUSD",
  },
  {
    players: [
      { name: "0x3E2...Kai", color: "#4fc3f7", emoji: "🔵" },
      { name: "0xD19...Zara", color: "#b388ff", emoji: "🟣" },
      { name: "0x8C4...Blaze", color: "#35d07f", emoji: "🟢" },
      { name: "0xA56...Rune", color: "#ffd700", emoji: "🟡" },
    ],
    mode: "Weekly Showdown",
    stakes: "🏆 +500 pts",
  },
];

function SectionInView({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  return (
    <>
      <style jsx>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes dice-roll {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(8deg); }
          50% { transform: rotate(-8deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
        .live-match-card {
          flex-shrink: 0;
          width: 280px;
          padding: 16px;
          background: rgba(40, 30, 60, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
        }
        .live-match-card:hover {
          border-color: rgba(53, 208, 127, 0.4);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(53, 208, 127, 0.15), 0 0 0 1px rgba(53, 208, 127, 0.1);
        }
        .live-match-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(53, 208, 127, 0.6), transparent);
        }
        .live-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #35d07f;
          display: inline-block;
          animation: pulse-live 1.5s ease-in-out infinite;
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px rgba(53, 208, 127, 0.8); }
          50% { opacity: 0.5; box-shadow: 0 0 8px rgba(53, 208, 127, 0.3); }
        }
        .floating-die-item {
          position: absolute;
          pointer-events: none;
          filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.3));
          user-select: none;
          z-index: 1;
        }
        .bento-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto auto;
          gap: 16px;
          padding: 0 16px;
          max-width: 900px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
        }
        .bento-card {
          background: rgba(40, 30, 60, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .bento-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .bento-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
        }
        .bento-card.green::before { background: linear-gradient(90deg, transparent, #35d07f, transparent); }
        .bento-card.gold::before { background: linear-gradient(90deg, transparent, #ffd700, transparent); }
        .bento-card.purple::before { background: linear-gradient(90deg, transparent, #b388ff, transparent); }
        .bento-card.blue::before { background: linear-gradient(90deg, transparent, #4fc3f7, transparent); }
        .bento-card.red::before { background: linear-gradient(90deg, transparent, #ff5555, transparent); }
        .bento-card.wide { grid-column: span 2; }
        .bento-card.tall { grid-row: span 2; }
        @media (max-width: 640px) {
          .bento-card.wide { grid-column: span 1; }
          .bento-card.tall { grid-row: span 1; }
        }
        .tournament-card {
          background: rgba(40, 30, 60, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          text-align: center;
          transition: all 0.3s;
        }
        .tournament-card:hover {
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.15), inset 0 0 30px rgba(255, 215, 0, 0.05);
          transform: translateY(-6px);
        }
        .tournament-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--pixel);
        }
        .badge-gold {
          background: rgba(255, 215, 0, 0.15);
          color: var(--gold);
          border: 1px solid rgba(255, 215, 0, 0.3);
        }
        .badge-green {
          background: rgba(53, 208, 127, 0.15);
          color: var(--green);
          border: 1px solid rgba(53, 208, 127, 0.3);
        }
        .badge-purple {
          background: rgba(179, 136, 255, 0.15);
          color: var(--purple);
          border: 1px solid rgba(179, 136, 255, 0.3);
        }
      `}</style>

      <div className="landing-page" style={{ cursor: "auto" }}>
      {/* ===== HERO SECTION ===== */}
      <section className="relative" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: "60px" }}>
        <Aurora />
        <Sparkles count={60} className="z-10" />
        <FloatingDice count={8} />

        <div className="relative z-20 container text-center" style={{ paddingTop: "80px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="hero-badge" style={{ marginBottom: "24px" }}>
              <span className="badge-dot"></span> Live on Celo
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="hero-title" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.3, marginBottom: "20px" }}>
              <span className="glitch-word" data-text="Play">Play</span>{" "}
              <span className="glitch-word neon-gold" data-text="Ludo" style={{ animationDelay: ".15s" }}>Ludo</span>
              <br />
              <span className="glitch-word" data-text="Boost" style={{ animationDelay: ".3s" }}>Boost</span>{" "}
              <span className="glitch-word" data-text="Your" style={{ animationDelay: ".45s" }}>Your</span>{" "}
              <span className="glitch-word neon-gold" data-text="Yield" style={{ animationDelay: ".6s" }}>Yield</span>
            </h1>
          </motion.div>

          <motion.p
            className="hero-sub"
            style={{ maxWidth: "520px", margin: "0 auto 28px" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            The first <strong style={{ color: "var(--green)" }}>Play-to-Boost</strong> platform on Celo.
            Stake tokens, play Ludo, and rocket your{" "}
            <GooeyText texts={["APY", "yield", "rewards", "earnings"]} className="neon-gold" interval={2500} />{" "}
            up to <strong style={{ color: "var(--gold)" }}>+5%</strong>.
          </motion.p>

          <motion.div
            className="hero-btns"
            style={{ gap: "16px" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <PixelButton variant="gold" size="xl" onClick={() => window.location.href = "/app"}>
              🎲 PLAY NOW
            </PixelButton>
            <PixelButton variant="secondary" size="lg" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              LEARN MORE
            </PixelButton>
          </motion.div>

          <motion.div
            className="stats-row"
            style={{ marginTop: "48px" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {[
              { icon: "📈", val: "10.0%", lbl: "Max APY" },
              { icon: "🎮", val: "100K+", lbl: "Games Played" },
              { icon: "🏆", val: "4 Modes", lbl: "Game Types" },
              { icon: "💎", val: "5 Tiers", lbl: "Rankings" },
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
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent z-30" />
      </section>

      {/* ===== LIVE MATCHES MARQUEE ===== */}
      <section className="relative py-20 overflow-hidden">
        <div className="container text-center" style={{ marginBottom: "32px" }}>
          <h2 className="sec-title" style={{ fontSize: "1.1rem" }}>
            <span className="live-indicator" /> Live Matches
          </h2>
          <p className="sec-sub">Real-time games happening right now</p>
        </div>

        <Marquee speed={35} className="mb-6">
          {LIVE_MATCHES.map((m, i) => (
            <LiveMatchCard key={i} players={m.players} mode={m.mode} stakes={m.stakes} />
          ))}
        </Marquee>

        <Marquee speed={28} direction="right">
          {LIVE_MATCHES.slice().reverse().map((m, i) => (
            <LiveMatchCard key={`r${i}`} players={m.players} mode={m.mode} stakes={m.stakes} />
          ))}
        </Marquee>
      </section>

      {/* ===== FEATURES BENTO GRID ===== */}
      <section id="features" className="relative py-20">
        <div className="container text-center" style={{ marginBottom: "40px" }}>
          <h2 className="sec-title" style={{ fontSize: "1.1rem" }}>
            Why Players Love Celudo
          </h2>
          <p className="sec-sub">More than a game — it&apos;s a yield engine</p>
        </div>

        <div className="bento-grid">
          <div className="bento-card wide green">
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "3rem", lineHeight: 1 }}>🎲</div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.85rem", color: "var(--green)", marginBottom: "8px" }}>
                  PLAY WITH FRIENDS
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                  2, 3, or 4 player free rooms. Jump in instantly with wallet connect. 
                  No setup, no waiting — just pure Ludo gameplay.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <RollingDice size={36} />
                <RollingDice size={36} />
              </div>
            </div>
          </div>

          <div className="bento-card gold tall">
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🏆</div>
            <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.78rem", color: "var(--gold)", marginBottom: "8px" }}>
              RANKED MODE
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.6, marginBottom: "16px" }}>
              Compete in sponsored tournaments. Earn points for every game. Climb leaderboards and unlock APY boosts.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {["🥉 Bronze +0.5%", "🥈 Silver +1.0%", "🥇 Gold +2.0%", "💎 Diamond +3.0%", "👑 Legend +5.0%"].map((tier, i) => (
                <div key={i} style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  background: "rgba(255, 215, 0, 0.06)",
                  border: "1px solid rgba(255, 215, 0, 0.12)",
                  fontSize: "0.72rem",
                  color: "var(--text)",
                  fontFamily: i === 4 ? "var(--pixel)" : "var(--font)",
                }}>
                  {tier}
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card purple">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💰</div>
            <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.75rem", color: "var(--purple)", marginBottom: "6px" }}>
              STAKE & EARN
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
              Deposit cUSD, USDT, or CELO. Yield auto-compounds through Aave V3 on Celo.
            </p>
          </div>

          <div className="bento-card blue">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔊</div>
            <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.75rem", color: "var(--blue)", marginBottom: "6px" }}>
              VOICE EMOTES
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
              Celebrate captures, react to dice rolls, and trash-talk with retro sound effects.
            </p>
          </div>

          <div className="bento-card wide red">
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "2.5rem" }}>⚡</div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.8rem", color: "var(--red)", marginBottom: "6px" }}>
                  CASH BETS — REAL STAKES
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  Put cUSD on the line. Escrowed on-chain. Winner takes all. 
                  Smart contracts guarantee fair play.
                </p>
              </div>
              <div style={{
                padding: "10px 16px",
                borderRadius: "12px",
                background: "rgba(255, 85, 85, 0.1)",
                border: "1px solid rgba(255, 85, 85, 0.2)",
                fontFamily: "var(--pixel)",
                fontSize: "0.7rem",
                color: "var(--red)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "1.2rem", marginBottom: "2px" }}>⚔️</div>
                1v1 — 4 Player
              </div>
            </div>
          </div>

          <div className="bento-card green">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📱</div>
            <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.75rem", color: "var(--green)", marginBottom: "6px" }}>
              MINIPAY NATIVE
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
              Built for MiniPay on Celo. Instant wallet connect, gasless transactions.
            </p>
          </div>

          <div className="bento-card gold">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎁</div>
            <h3 style={{ fontFamily: "var(--pixel)", fontSize: "0.75rem", color: "var(--gold)", marginBottom: "6px" }}>
              DAILY REWARDS
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
              Login daily, play games, and earn bonus points. Streaks multiply your rewards.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-20">
        <div className="container text-center" style={{ marginBottom: "40px" }}>
          <h2 className="sec-title" style={{ fontSize: "1.1rem" }}>
            🕹️ How It Works
          </h2>
          <p className="sec-sub">Three steps to boosted yield</p>
        </div>

        <div className="container">
          <div className="steps-row" style={{ justifyContent: "center" }}>
            {[
              { num: "01", ico: "💰", title: "Stake", desc: "Deposit cUSD, USDT, or CELO. Yield auto-compounds via Aave V3." },
              { num: "02", ico: "🎲", title: "Play", desc: "Jump into free Ludo rooms or enter sponsored tournaments." },
              { num: "03", ico: "🚀", title: "Boost", desc: "Earn points → level up tiers → unlock up to +5% APY boost." },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="step step-visible"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.04 }}
              >
                <div className="step-num">{step.num}</div>
                <div className="step-ico">{step.ico}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RETRO TOURNAMENT SECTION ===== */}
      <section className="relative py-20 overflow-hidden">
        <PixelCanvas
          gap={8}
          speed={0.2}
          colors={["#35d07f", "#ffd700", "#b388ff", "#4fc3f7"]}
          className="opacity-30"
        />

        <div className="container relative z-10" style={{ marginBottom: "40px" }}>
          <h2 className="sec-title" style={{ fontSize: "1.1rem", textAlign: "center" }}>
            🏆 Tournaments
          </h2>
          <p className="sec-sub" style={{ textAlign: "center" }}>
            Compete. Win. Boost your yield.
          </p>
        </div>

        <div className="container relative z-10">
          <div className="tournament-preview">
            {[
              { icon: "🏆", name: "Weekly Showdown", sponsor: "Celo Foundation", prize: "500 Points", players: "4-Player", max: 32, joined: 24, badge: "gold" },
              { icon: "⚡", name: "Speed Blitz", sponsor: "Aave Community", prize: "200 Points", players: "2-Player", max: 16, joined: 11, badge: "green" },
              { icon: "👑", name: "Grand Classic", sponsor: "MiniPay Partners", prize: "1000 Points", players: "4-Player", max: 64, joined: 47, badge: "purple" },
              { icon: "🌟", name: "Newcomer Cup", sponsor: "Celudo Team", prize: "100 Points", players: "2-Player", max: 8, joined: 5, badge: "green" },
            ].map((t, i) => (
              <motion.div
                key={i}
                className="tournament-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                <span className={`tournament-badge badge-${t.badge}`}>
                  {t.players}
                </span>
                <div style={{ fontSize: "2.5rem", margin: "12px 0 8px" }}>{t.icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>{t.name}</h3>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "8px" }}>
                  Sponsored by {t.sponsor}
                </div>
                <div style={{ fontFamily: "var(--pixel)", fontSize: "0.95rem", color: "var(--gold)", marginBottom: "12px" }}>
                  🏆 {t.prize}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "14px" }}>
                  {t.joined}/{t.max} joined
                </div>
                <div style={{
                  height: "4px",
                  borderRadius: "2px",
                  background: "rgba(255, 255, 255, 0.1)",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${(t.joined / t.max) * 100}%`,
                    borderRadius: "2px",
                    background: "linear-gradient(90deg, var(--green), var(--gold))",
                  }} />
                </div>
                <PixelButton variant={t.badge === "gold" ? "gold" : "primary"} size="sm">
                  Join Free
                </PixelButton>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-32 overflow-hidden">
        <Aurora />
        <Sparkles count={30} className="z-10" />

        <div className="container relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 style={{
              fontFamily: "var(--pixel)",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              lineHeight: 1.5,
              marginBottom: "16px",
              color: "var(--gold)",
              textShadow: "0 0 20px rgba(255, 215, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)",
            }}>
              Ready to{" "}
              <GooeyText
                texts={["Roll?", "Play?", "Win?", "Boost?"]}
                className="neon-gold"
                interval={2000}
              />
            </h2>
            <p style={{
              color: "var(--muted)",
              fontSize: "1rem",
              maxWidth: "480px",
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}>
              Join thousands of players earning yield while having fun. 
              No minimums, no lockups — just play and profit.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <PixelButton variant="gold" size="xl" onClick={() => window.location.href = "/app"}>
                🎲 START PLAYING
              </PixelButton>
              <PixelButton variant="secondary" size="lg" onClick={() => window.location.href = "/app"}>
                💰 START STAKING
              </PixelButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-20" style={{
        borderTop: "1px solid var(--border)",
        padding: "40px 0",
      }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.4rem" }}>🎲</span>
            <span style={{ fontFamily: "var(--pixel)", fontSize: "0.85rem", color: "var(--gold)" }}>
              CELUDO
            </span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            {["Twitter", "Discord", "Docs", "GitHub"].map((link) => (
              <a key={link} href="#" style={{ color: "var(--muted)", fontSize: "0.82rem", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                {link}
              </a>
            ))}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.7rem", opacity: 0.6 }}>
            Built on Celo · Play-to-Boost · v1.0
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}