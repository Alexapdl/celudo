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
import CustomCursor from "@/app/components/CustomCursor";

const LIVE_MATCHES = [
  {
    players: [
      { name: "0xA3f...Kira", color: "#40c020", emoji: "🟢" },
      { name: "0xD72...Nova", color: "#c06020", emoji: "🔴" },
      { name: "0x9B1...Zeus", color: "#0040a0", emoji: "🔵" },
      { name: "0xF4e...Luna", color: "#ffc020", emoji: "🟡" },
    ],
    mode: "4-Player Classic",
    stakes: "🏆 +100 pts",
  },
  {
    players: [
      { name: "0x5C3...Ace", color: "#40c020", emoji: "🟢" },
      { name: "0x8E2...Rex", color: "#c06020", emoji: "🔴" },
    ],
    mode: "1v1 Blitz",
    stakes: "💰 0.5 cUSD",
  },
  {
    players: [
      { name: "0x1A7...Mika", color: "#40c020", emoji: "🟢" },
      { name: "0xB34...Yuki", color: "#c06020", emoji: "🔴" },
      { name: "0x6F9...Dara", color: "#6040a0", emoji: "🟣" },
    ],
    mode: "3-Player Speed",
    stakes: "⭐ +50 pts",
  },
  {
    players: [
      { name: "0x2D8...Finn", color: "#40c020", emoji: "🟢" },
      { name: "0xC45...Haze", color: "#ffc020", emoji: "🟡" },
      { name: "0x7A1...Echo", color: "#0040a0", emoji: "🔵" },
      { name: "0xE93...Tao", color: "#c06020", emoji: "🔴" },
    ],
    mode: "Grand Classic",
    stakes: "👑 +200 pts",
  },
  {
    players: [
      { name: "0x4F6...Nyx", color: "#c06020", emoji: "🔴" },
      { name: "0x0B7...Sol", color: "#40c020", emoji: "🟢" },
    ],
    mode: "1v1 Cash Bet",
    stakes: "💰 1.0 cUSD",
  },
  {
    players: [
      { name: "0x3E2...Kai", color: "#0040a0", emoji: "🔵" },
      { name: "0xD19...Zara", color: "#6040a0", emoji: "🟣" },
      { name: "0x8C4...Blaze", color: "#40c020", emoji: "🟢" },
      { name: "0xA56...Rune", color: "#ffc020", emoji: "🟡" },
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
      <CustomCursor />
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
          background: #ffffff;
          border: 3px solid #2c1810;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          box-shadow: 4px 4px 0 rgba(0,0,0,0.15);
          image-rendering: pixelated;
        }
        .live-match-card:hover {
          transform: translateY(-4px);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
        }
        .live-match-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--green);
        }
        .live-match-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 0 #602000, 0 10px 16px rgba(0,0,0,0.15);
        }
        .live-match-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: repeating-linear-gradient(90deg, var(--brown), var(--brown) 10px, #905020 10px, #905020 12px);
        }
        .live-indicator {
          width: 8px;
          height: 8px;
          background: #40c020;
          border-radius: 2px;
          display: inline-block;
          animation: pulse-live 1.5s ease-in-out infinite;
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        .floating-die-item {
          position: absolute;
          pointer-events: none;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
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
          background: #ffffff;
          border: 3px solid #2c1810;
          border-radius: 2px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          box-shadow: 4px 4px 0 rgba(0,0,0,0.15);
          image-rendering: pixelated;
        }
        .bento-card:hover {
          transform: translateY(-4px);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
        }
        .bento-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
        }
        .bento-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 0 #602000, 0 10px 16px rgba(0,0,0,0.15);
        }
        .bento-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
        }
        .bento-card.green::before { background: #40c020; }
        .bento-card.gold::before { background: #ffc020; }
        .bento-card.purple::before { background: #6040a0; }
        .bento-card.blue::before { background: #0040a0; }
        .bento-card.red::before { background: #c06020; }
        .bento-card.wide { grid-column: span 2; }
        .bento-card.tall { grid-row: span 2; }
        @media (max-width: 640px) {
          .bento-card.wide { grid-column: span 1; }
          .bento-card.tall { grid-row: span 1; }
        }
        .tournament-card {
          background: #ffffff;
          border: 3px solid #2c1810;
          border-radius: 2px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          text-align: center;
          transition: all 0.3s;
          box-shadow: 4px 4px 0 rgba(0,0,0,0.15);
          image-rendering: pixelated;
        }
        .tournament-card:hover {
          border-color: var(--gold);
          box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
          transform: translateY(-6px);
        }
        .tournament-card:hover {
          border-color: var(--gold);
          box-shadow: 0 6px 0 #a06000, 0 10px 16px rgba(0,0,0,0.15);
          transform: translateY(-6px);
        }
        .tournament-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--pixel);
        }
        .badge-gold {
          background: rgba(249, 168, 37, 0.1);
          color: var(--gold);
          border: 2px solid rgba(249, 168, 37, 0.3);
        }
        .badge-green {
          background: rgba(67, 176, 71, 0.1);
          color: var(--green);
          border: 2px solid rgba(67, 176, 71, 0.3);
        }
        .badge-purple {
          background: rgba(142, 68, 173, 0.1);
          color: var(--purple);
          border: 2px solid rgba(142, 68, 173, 0.3);
        }

        .mario-footer {
          image-rendering: pixelated;
        }

        .footer-grass {
          height: 16px;
          background: linear-gradient(180deg, #40c020 0%, #40c020 33%, #2d8c14 33%, #2d8c14 66%, #1b6e22 66%, #1b6e22 100%);
          image-rendering: pixelated;
        }

        .footer-ground {
          background:
            repeating-linear-gradient(
              90deg,
              #804000 0px, #804000 4px,
              #602000 4px, #602000 8px
            ),
            repeating-linear-gradient(
              0deg,
              #602000 0px, #602000 4px,
              #804000 4px, #804000 8px
            ),
            #703000;
          image-rendering: pixelated;
          border-top: 2px solid #2d8c14;
        }

        /* ===== MARIO INTERACTIVE HERO SCENE ===== */
        .hero-scene {
          image-rendering: pixelated;
          overflow: visible;
        }

        /* Green Pipes */
        .hero-pipe {
          position: absolute;
          bottom: 48px;
          width: 48px;
          cursor: pointer;
          z-index: 5;
        }
        .hero-pipe-left { left: 8px; }
        .hero-pipe-right { right: 8px; }

        .pipe-lip {
          width: 60px;
          height: 14px;
          background: #40c020;
          border: 2px solid #1b6e22;
          border-bottom: none;
          border-radius: 2px 2px 0 0;
          margin-left: -6px;
        }
        .pipe-lip::after {
          content: '';
          display: block;
          width: 52px;
          height: 4px;
          background: #60e040;
          margin: 3px auto 0;
          border-radius: 1px;
        }

        .pipe-body {
          width: 48px;
          height: 64px;
          background: linear-gradient(180deg, #40c020 0%, #2d8c14 50%, #1b6e22 100%);
          border: 3px solid #1b6e22;
          border-top: none;
          border-radius: 0 0 2px 2px;
          position: relative;
          overflow: hidden;
        }

        .pipe-shine {
          position: absolute;
          left: 6px;
          top: 4px;
          width: 10px;
          height: 50px;
          background: rgba(255,255,255,0.15);
        }

        .pipe-coin {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.4rem;
          z-index: 6;
          pointer-events: none;
          filter: drop-shadow(0 2px 0 rgba(0,0,0,0.2));
        }

        /* ? Block Clouds */
        .hero-cloud-block {
          position: absolute;
          width: 44px;
          height: 44px;
          background: linear-gradient(180deg, #ffc020 0%, #e0a010 100%);
          border: 3px solid #2c1810;
          border-radius: 2px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
          image-rendering: pixelated;
        }

        .cloud-block-text {
          font-family: var(--pixel);
          font-size: 1.3rem;
          color: #2c1810;
          font-weight: 900;
          z-index: 2;
        }

        .cloud-block-shine {
          position: absolute;
          top: 2px;
          left: 3px;
          width: 14px;
          height: 6px;
          background: rgba(255,255,255,0.3);
        }

        .hero-cloud-1 { top: 16px; left: 28%; }
        .hero-cloud-2 { top: 50px; right: 22%; }
        .hero-cloud-3 { top: 24px; left: 52%; }

        /* Hills */
        .hero-hills {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 48px;
          overflow: hidden;
          image-rendering: pixelated;
        }

        .hero-hill {
          position: absolute;
          bottom: 0;
          image-rendering: pixelated;
        }

        .hero-hill-1 {
          left: -10px;
          width: 200px;
          height: 48px;
          background: linear-gradient(180deg, #40c020 0%, #2d8c14 40%, #1b6e22 100%);
          clip-path: polygon(0% 100%, 5% 50%, 15% 30%, 30% 20%, 45% 35%, 60% 55%, 75% 65%, 90% 75%, 100% 90%, 100% 100%);
        }

        .hero-hill-2 {
          right: 20px;
          width: 260px;
          height: 40px;
          background: linear-gradient(180deg, #2d8c14 0%, #1b6e22 100%);
          clip-path: polygon(0% 80%, 10% 60%, 25% 40%, 40% 55%, 55% 70%, 70% 55%, 85% 65%, 100% 85%, 100% 100%, 0% 100%);
        }

        .hero-hill-3 {
          left: 40%;
          width: 180px;
          height: 32px;
          bottom: 10px;
          background: #0d5a14;
          clip-path: polygon(0% 100%, 15% 60%, 35% 30%, 55% 50%, 75% 70%, 90% 85%, 100% 100%);
        }

        .hero-bush {
          position: absolute;
          bottom: 36px;
          image-rendering: pixelated;
        }

        .hero-bush-1 {
          left: 18%;
          width: 64px;
          height: 20px;
          background: #40c020;
          border: 2px solid #1b6e22;
          border-radius: 2px;
        }
        .hero-bush-1::after {
          content: '';
          position: absolute;
          top: -8px;
          left: 8px;
          width: 30px;
          height: 14px;
          background: #40c020;
          border: 2px solid #1b6e22;
          border-radius: 8px 8px 0 0;
          border-bottom: none;
        }

        .hero-bush-2 {
          right: 12%;
          width: 50px;
          height: 16px;
          background: #2d8c14;
          border: 2px solid #1b6e22;
          border-radius: 2px;
        }
        .hero-bush-2::after {
          content: '';
          position: absolute;
          top: -6px;
          left: 6px;
          width: 24px;
          height: 12px;
          background: #2d8c14;
          border: 2px solid #1b6e22;
          border-radius: 6px 6px 0 0;
          border-bottom: none;
        }

        @media (max-width: 500px) {
          .hero-scene { height: 150px; }
          .hero-pipe { width: 36px; }
          .pipe-lip { width: 46px; height: 10px; margin-left: -5px; }
          .pipe-lip::after { width: 40px; height: 3px; }
          .pipe-body { width: 36px; height: 48px; }
          .pipe-shine { width: 8px; height: 36px; }
          .hero-cloud-block { width: 36px; height: 36px; }
          .cloud-block-text { font-size: 1.1rem; }
          .hero-hills { height: 36px; }
          .hero-hill-1 { width: 140px; height: 36px; }
          .hero-hill-2 { width: 180px; height: 30px; }
          .hero-hill-3 { width: 130px; height: 24px; }
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

          {/* ===== MARIO INTERACTIVE SCENE ===== */}
          <div className="hero-scene" style={{ position: "relative", height: "200px", maxWidth: "600px", margin: "0 auto 24px" }}>
            {/* Left Pipe */}
            <motion.div
              className="hero-pipe hero-pipe-left"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.05, y: -6 }}
            >
              <div className="pipe-lip"></div>
              <div className="pipe-body">
                <div className="pipe-shine"></div>
              </div>
            </motion.div>

            {/* Floating ? Blocks */}
            <motion.div
              className="hero-cloud-block hero-cloud-1"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.15, y: -16 }}
              whileTap={{ scale: 0.9, y: 4 }}
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              title="Click to learn more!"
            >
              <span className="cloud-block-text">?</span>
              <div className="cloud-block-shine"></div>
            </motion.div>

            <motion.div
              className="hero-cloud-block hero-cloud-2"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              whileHover={{ scale: 1.15, y: -14 }}
              whileTap={{ scale: 0.9, y: 4 }}
              onClick={() => window.location.href = "/app"}
              title="Click to play!"
            >
              <span className="cloud-block-text">?</span>
              <div className="cloud-block-shine"></div>
            </motion.div>

            <motion.div
              className="hero-cloud-block hero-cloud-3"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              whileHover={{ scale: 1.15, y: -15 }}
              whileTap={{ scale: 0.9, y: 4 }}
            >
              <span className="cloud-block-text">★</span>
              <div className="cloud-block-shine"></div>
            </motion.div>

            {/* Right Pipe */}
            <motion.div
              className="hero-pipe hero-pipe-right"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="pipe-lip"></div>
              <div className="pipe-body">
                <div className="pipe-shine"></div>
              </div>
              {/* Coin popping out */}
              <motion.div
                className="pipe-coin"
                animate={{ y: [-40, -70], opacity: [1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              >
                🪙
              </motion.div>
            </motion.div>

            {/* Pixel hills at bottom */}
            <div className="hero-hills">
              <div className="hero-hill hero-hill-1"></div>
              <div className="hero-hill hero-hill-2"></div>
              <div className="hero-hill hero-hill-3"></div>
              <div className="hero-bush hero-bush-1"></div>
              <div className="hero-bush hero-bush-2"></div>
            </div>
          </div>

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
                  background: "rgba(249, 168, 37, 0.06)",
                  border: "1px solid rgba(249, 168, 37, 0.12)",
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
                background: "rgba(229, 37, 33, 0.08)",
                border: "1px solid rgba(229, 37, 33, 0.15)",
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
          colors={["#40c020", "#ffc020", "#c06020", "#0040a0"]}
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
                  background: "rgba(139, 90, 43, 0.1)",
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
              textShadow: "3px 3px 0 rgba(0,0,0,0.08)",
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
      <footer className="relative z-20 mario-footer">
        <div className="footer-grass"></div>
        <div className="footer-ground">
          <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "24px", paddingBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>⭐</span>
              <span style={{ fontFamily: "var(--pixel)", fontSize: "0.85rem", color: "#ffc020", textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
                CELUDO
              </span>
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
              {["Twitter", "Discord", "Docs", "GitHub"].map((link) => (
                <a key={link} href="#" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffc020")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                >
                  {link}
                </a>
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>
              Built on Celo · Play-to-Boost · v1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}