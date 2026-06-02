"use client";

import { motion } from "framer-motion";
import { soundManager } from "@/lib/sound";

interface StakingScreenProps {
  effectiveAPY: number;
  baseAPY: number;
  currentTierBoost: number;
  currentTierName: string;
  stakedBalance: number;
  earnedYield: number;
  stakeAmount: string;
  unstakeAmount: string;
  onSetStakeAmount: (val: string) => void;
  onSetUnstakeAmount: (val: string) => void;
  onStake: () => void;
  onUnstake: () => void;
}

export default function StakingScreen({
  effectiveAPY,
  baseAPY,
  currentTierBoost,
  currentTierName,
  stakedBalance,
  earnedYield,
  stakeAmount,
  unstakeAmount,
  onSetStakeAmount,
  onSetUnstakeAmount,
  onStake,
  onUnstake,
}: StakingScreenProps) {
  const tiers = [
    { name: "🥉 Bronze", min: 100, boost: 0.5, perk: "Basic dice skin" },
    { name: "🥈 Silver", min: 500, boost: 1.0, perk: "Priority matchmaking" },
    { name: "🥇 Gold", min: 2000, boost: 2.0, perk: "Exclusive emotes + tournament priority" },
    { name: "💎 Diamond", min: 10000, boost: 3.0, perk: "NFT airdrops + private rooms" },
    { name: "👑 Legend", min: 50000, boost: 5.0, perk: "Revenue sharing + governance" },
  ];

  return (
    <div className="container">
      <motion.h2
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Staking Dashboard
      </motion.h2>

      <motion.div
        className="staking-overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stake-card-big">
          <div className="stake-apy-display">
            <div className="apy-label">Your Effective APY</div>
            <motion.div
              className="apy-value"
              key={effectiveAPY}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {effectiveAPY.toFixed(1)}%
            </motion.div>
            <div className="apy-breakdown">
              <span className="apy-base">Base: {baseAPY.toFixed(1)}%</span>
              <span className="apy-plus">+</span>
              <span className="apy-boost-val">Boost: +{currentTierBoost.toFixed(1)}%</span>
            </div>
          </div>
          <div className="stake-balance">
            <div className="balance-row">
              <span>Staked Balance</span>
              <strong>{stakedBalance.toFixed(2)} cUSD</strong>
            </div>
            <div className="balance-row">
              <span>Earned Yield</span>
              <strong>{earnedYield.toFixed(2)} cUSD</strong>
            </div>
            <div className="balance-row">
              <span>Your Tier</span>
              <strong>{currentTierName}</strong>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="stake-actions-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div className="stake-action-card" whileHover={{ y: -4 }}>
          <h3>💰 Stake</h3>
          <div className="input-group">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => onSetStakeAmount(e.target.value)}
              placeholder="Amount (cUSD)"
              min="0"
              step="0.01"
            />
            <motion.button
              className="btn btn-primary"
              onClick={() => { soundManager.buttonClick(); onStake(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Stake
            </motion.button>
          </div>
        </motion.div>
        <motion.div className="stake-action-card " whileHover={{ y: -4 }}>
          <h3>📤 Unstake</h3>
          <div className="input-group">
            <input
              type="number"
              value={unstakeAmount}
              onChange={(e) => onSetUnstakeAmount(e.target.value)}
              placeholder="Amount (cUSD)"
              min="0"
              step="0.01"
            />
            <motion.button
              className="btn btn-secondary"
              onClick={() => { soundManager.buttonClick(); onUnstake(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Unstake
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <motion.section
        className="info-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="sec-title">Tier & APY Boost</h2>
        <p className="sec-sub">Earn points from Ludo games and tournaments to unlock higher APY boosts</p>
        <div className="tier-table-wrap">
          <table className="tier-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Points Required</th>
                <th>APY Boost</th>
                <th>Perks</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, i) => (
                <motion.tr
                  key={tier.name}
                  className={tier.name.includes("Gold") ? "tier-highlight" : ""}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <td>{tier.name}</td>
                  <td>{tier.min}</td>
                  <td className="boost-cell">+{tier.boost.toFixed(1)}%</td>
                  <td>{tier.perk}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
