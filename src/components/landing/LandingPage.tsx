"use client";

import { motion } from "framer-motion";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { GlassCard, GlassCardTop } from "@/components/ui/glass-card";
import Marquee, { LiveMatchCard, RollingDice } from "./Marquee";
import GooeyText from "./GooeyText";
import PixelButton from "./PixelButton";

const FEATURE_CARDS = [
  {
    color: "green" as const, icon: "🎲", title: "PLAY WITH FRIENDS", wide: true,
    desc: "2, 3, or 4 player free rooms. Jump in instantly with wallet connect. No setup, no waiting — just pure Ludo gameplay.",
    extra: (<> <div className="flex gap-2"><RollingDice size={40} /><RollingDice size={40} /></div></>)
  },
  {
    color: "gold" as const, icon: "🏆", title: "RANKED MODE",
    desc: "Compete in sponsored tournaments. Earn points for every game. Climb leaderboards and unlock APY boosts.",
    list: ["🥉 Bronze +0.5%", "🥈 Silver +1.0%", "🥇 Gold +2.0%", "💎 Diamond +3.0%", "👑 Legend +5.0%"]
  },
  { color: "green" as const, icon: "💰", title: "STAKE & EARN", desc: "Deposit cUSD, USDT, or CELO. Yield auto-compounds through Aave V3 on Celo." },
  { color: "blue" as const, icon: "🔊", title: "VOICE EMOTES", desc: "Celebrate captures, react to dice rolls, and trash-talk with retro sound effects." },
  { color: "purple" as const, icon: "📱", title: "MINIPAY NATIVE", desc: "Built for MiniPay on Celo. Instant wallet connect, gasless transactions." },
  { color: "gold" as const, icon: "🎁", title: "DAILY REWARDS", desc: "Login daily, play games, and earn bonus points. Streaks multiply your rewards." },
  {
    color: "red" as const, icon: "⚡", title: "CASH BETS — REAL STAKES", wide: true,
    desc: "Put cUSD on the line. Escrowed on-chain. Winner takes all. Smart contracts guarantee fair play.",
    extra: (<div className="px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/[0.12] text-sm text-red-400 text-center"><div className="text-xl mb-1">⚔️</div>1v1 — 4 Player</div>)
  },
];

const TOURNAMENTS = [
  { icon: "🏆", name: "Weekly Showdown", sponsor: "Celo Foundation", prize: "500 Points", players: "4-Player", max: 32, joined: 24, color: "gold" as const },
  { icon: "⚡", name: "Speed Blitz", sponsor: "Aave Community", prize: "200 Points", players: "2-Player", max: 16, joined: 11, color: "green" as const },
  { icon: "👑", name: "Grand Classic", sponsor: "MiniPay Partners", prize: "1000 Points", players: "4-Player", max: 64, joined: 47, color: "purple" as const },
  { icon: "🌟", name: "Newcomer Cup", sponsor: "Celudo Team", prize: "100 Points", players: "2-Player", max: 8, joined: 5, color: "blue" as const },
];

export default function LandingPage() {
  return (
    <>
      <style jsx>{`
        @keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .live-match-card {
          flex-shrink: 0; width: 280px; padding: 18px 16px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; backdrop-filter: blur(12px); transition: 0.3s;
        }
        .live-match-card:hover { border-color: rgba(69,209,133,0.25); transform: translateY(-2px); }
        .live-indicator { width: 7px; height: 7px; border-radius: 50%; background: var(--green); display: inline-block; animation: pulse-live 1.5s ease-in-out infinite; }
        @keyframes pulse-live { 0%,100%{opacity:1}50%{opacity:.3} }

        .glass-section { padding: 100px 24px; position: relative; }
        .glass-section-title {
          font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 14px;
          background: linear-gradient(to bottom, #fff, rgba(255,255,255,0.7));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          letter-spacing: -0.3px;
        }
        .glass-section-sub {
          text-align: center; color: rgba(255,255,255,0.35); font-size: 1.05rem;
          margin-bottom: 56px; max-width: 520px; margin-left: auto; margin-right: auto; line-height: 1.6;
        }

        .glass-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 960px; margin: 0 auto; }
        @media (max-width: 700px) { .glass-grid { grid-template-columns: 1fr; } }
        .glass-grid .col-span-2 { grid-column: span 2; }
        @media (max-width: 700px) { .glass-grid .col-span-2 { grid-column: span 1; } }

        .glass-tournament-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; max-width: 960px; margin: 0 auto; }

        .glass-list-item {
          padding: 11px 16px; border-radius: 10px; font-size: 0.8rem;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75); transition: 0.2s;
        }
        .glass-list-item:hover { border-color: rgba(69,209,133,0.15); background: rgba(69,209,133,0.03); }

        .tournament-progress { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; margin-bottom: 16px; }
        .tournament-progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--green), var(--gold)); }

        .steps-row { display: flex; gap: 16px; max-width: 800px; margin: 0 auto; }
        @media (max-width: 700px) { .steps-row { flex-direction: column; } }
      `}</style>

      <div className="landing-page" style={{ cursor: "auto" }}>

      {/* HERO */}
      <HeroGeometric
        badge="Live on Celo"
        title1="Play Ludo"
        title2="Boost Your Yield"
        subtitle="The first Play-to-Boost platform on Celo. Stake tokens, play Ludo, and rocket your APY up to +5%."
      />

      {/* FEATURES */}
      <section className="glass-section">
        <h2 className="glass-section-title">Why Players Love Celudo</h2>
        <p className="glass-section-sub">More than a game — it&apos;s a yield engine</p>
        <div className="glass-grid">
          {FEATURE_CARDS.map((card, i) => (
            <GlassCard key={i} className={`${card.wide ? "col-span-2" : ""} p-7`} delay={i * 0.08}>
              <GlassCardTop color={card.color} />
              <div className={`flex ${card.wide ? "items-center gap-5 flex-wrap" : "flex-col"}`}>
                <div className={`${card.wide ? "" : "mb-4"}`}>
                  <span className={`${card.wide ? "text-4xl" : "text-3xl"} block ${card.wide ? "" : "mb-3"}`}>{card.icon}</span>
                  <h3 className={`${card.wide ? "text-[0.9rem]" : "text-[0.82rem]"} font-bold mb-2`} style={{ color: card.color === "green" ? "#4ade80" : card.color === "gold" ? "#fcd34d" : card.color === "blue" ? "#7dd3fc" : card.color === "purple" ? "#c4b5fd" : "#f87171" }}>
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/35 leading-relaxed">{card.desc}</p>
                </div>
                {card.extra && <div className={card.wide ? "" : "mt-auto"}>{card.extra}</div>}
                {card.list && (
                  <div className="flex flex-col gap-2 mt-3">
                    {card.list.map((item, j) => <div key={j} className="glass-list-item">{item}</div>)}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="glass-section">
        <h2 className="glass-section-title">How It Works</h2>
        <p className="glass-section-sub">Three steps to boosted yield</p>
        <div className="steps-row">
          {[{ num: "01", ico: "💰", title: "Stake", desc: "Deposit cUSD, USDT, or CELO. Yield auto-compounds via Aave V3 on Celo." }, { num: "02", ico: "🎲", title: "Play", desc: "Jump into free Ludo rooms or enter sponsored tournaments." }, { num: "03", ico: "🚀", title: "Boost", desc: "Earn points → level up tiers → unlock up to +5% APY boost." }].map((step, i) => (
            <GlassCard key={i} className="flex-1 p-7 text-center" delay={i * 0.12}>
              <div className="text-xs font-bold mb-3" style={{ color: "#4ade80" }}>{step.num}</div>
              <div className="text-3xl mb-4">{step.ico}</div>
              <h3 className="font-bold text-base mb-3">{step.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{step.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* TOURNAMENTS */}
      <section className="glass-section">
        <h2 className="glass-section-title">Tournaments</h2>
        <p className="glass-section-sub">Compete. Win. Boost your yield.</p>
        <div className="glass-tournament-grid">
          {TOURNAMENTS.map((t, i) => (
            <GlassCard key={i} className="p-6 text-center" delay={i * 0.1}>
              <GlassCardTop color={t.color} />
              <div className="text-4xl mb-3 mt-3">{t.icon}</div>
              <h3 className="font-bold text-base mb-2">{t.name}</h3>
              <p className="text-xs text-white/35 mb-3">Sponsored by {t.sponsor}</p>
              <div className="text-xl font-bold mb-4" style={{ color: "#fcd34d" }}>🏆 {t.prize}</div>
              <p className="text-xs text-white/30 mb-4">{t.joined}/{t.max} joined</p>
              <div className="tournament-progress mb-4">
                <div className="tournament-progress-fill" style={{ width: `${(t.joined / t.max) * 100}%` }} />
              </div>
              <PixelButton variant="primary" size="sm">Join Free</PixelButton>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.04] via-transparent to-amber-300/[0.04] blur-3xl" />
        <div className="container relative z-10 text-center" style={{ maxWidth: 700 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Ready to{" "}</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-amber-300">
                <GooeyText texts={["Roll?", "Play?", "Win?", "Boost?"]} interval={2000} />
              </span>
            </h2>
            <p className="text-white/35 text-lg max-w-md mx-auto mb-10 leading-relaxed">
              Join thousands earning yield while having fun. No minimums, no lockups.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <PixelButton variant="primary" size="xl" onClick={() => window.location.href = "/app"}>START PLAYING</PixelButton>
              <PixelButton variant="secondary" size="lg" onClick={() => window.location.href = "/app"}>START STAKING</PixelButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] py-12">
        <div className="container flex flex-col items-center gap-5" style={{ maxWidth: 500 }}>
          <span className="text-lg font-bold" style={{ color: "#4ade80" }}>CELUDO</span>
          <div className="flex gap-8">
            {["Twitter", "Discord", "Docs", "GitHub"].map((link) => (
              <a key={link} href="#" className="text-sm text-white/25 hover:text-green-400 transition-colors">{link}</a>
            ))}
          </div>
          <p className="text-xs text-white/15">Built on Celo · Play-to-Boost · v1.0</p>
        </div>
      </footer>
    </div>
    </>
  );
}
