"use client";

import { motion } from "framer-motion";
import { TrendingUp, Wallet } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface StakingScreenProps {
  effectiveAPY: number; baseAPY: number; currentTierBoost: number; currentTierName: string;
  stakedBalance: number; earnedYield: number;
  stakeAmount: string; unstakeAmount: string;
  onSetStakeAmount: (v: string) => void; onSetUnstakeAmount: (v: string) => void;
  onStake: () => void; onUnstake: () => void;
}

const tiers = [
  { name: "Bronze", min: 100, boost: 0.5, perk: "Basic dice" },
  { name: "Silver", min: 500, boost: 1.0, perk: "Priority queue" },
  { name: "Gold", min: 2000, boost: 2.0, perk: "Tournament priority" },
  { name: "Diamond", min: 10000, boost: 3.0, perk: "NFT airdrops" },
  { name: "Legend", min: 50000, boost: 5.0, perk: "Revenue share" },
];

export default function StakingScreen({ effectiveAPY, baseAPY, currentTierBoost, currentTierName, stakedBalance, earnedYield, stakeAmount, unstakeAmount, onSetStakeAmount, onSetUnstakeAmount, onStake, onUnstake }: StakingScreenProps) {
  return (
    <div className="container">
      <h2 className="page-title">Staking</h2>

      <div className="staking-overview">
        <div className="stake-card-big">
          <div className="stake-apy">
            <div className="apy-label">Effective APY</div>
            <motion.div className="apy-value" key={effectiveAPY} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              {effectiveAPY.toFixed(1)}%
            </motion.div>
            <div className="apy-breakdown">Base {baseAPY.toFixed(1)}% + Boost +{currentTierBoost.toFixed(1)}%</div>
          </div>
          <div className="stake-balance">
            <div className="balance-row"><span>Staked</span><strong>{stakedBalance.toFixed(2)} cUSD</strong></div>
            <div className="balance-row"><span>Earned</span><strong>{earnedYield.toFixed(2)} cUSD</strong></div>
            <div className="balance-row"><span>Tier</span><strong style={{ color: "var(--gold-bright)" }}>{currentTierName}</strong></div>
          </div>
        </div>
      </div>

      <div className="stake-actions-grid">
        <div className="stake-action-card">
          <h3><TrendingUp size={14} style={{ display: "inline", marginRight: 6 }} />Stake</h3>
          <div className="input-group">
            <input type="number" value={stakeAmount} onChange={(e) => onSetStakeAmount(e.target.value)} placeholder="Amount (cUSD)" min="0" step="0.01" />
            <button className="btn btn-primary" onClick={() => { soundManager.buttonClick(); onStake(); }}>Stake</button>
          </div>
        </div>
        <div className="stake-action-card">
          <h3><Wallet size={14} style={{ display: "inline", marginRight: 6 }} />Unstake</h3>
          <div className="input-group">
            <input type="number" value={unstakeAmount} onChange={(e) => onSetUnstakeAmount(e.target.value)} placeholder="Amount (cUSD)" min="0" step="0.01" />
            <button className="btn btn-secondary" onClick={() => { soundManager.buttonClick(); onUnstake(); }}>Unstake</button>
          </div>
        </div>
      </div>

      <section>
        <h3 className="section-title">Tier Boost</h3>
        <p className="section-sub">Earn points from games to unlock higher APY boosts</p>
        <div className="tier-table-wrap">
          <table className="tier-table">
            <thead><tr><th>Tier</th><th>Points</th><th>Boost</th><th>Perk</th></tr></thead>
            <tbody>
              {tiers.map((t, i) => (
                <motion.tr key={t.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <td>{t.name}</td><td>{t.min}</td>
                  <td className="boost-cell">+{t.boost.toFixed(1)}%</td><td>{t.perk}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
