"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";

export interface RecentGame {
  mode: string;
  players: number;
  won: boolean;
  points: number;
  date: Date;
}

export const TIERS = [
  { name: "None", min: 0, boost: 0 },
  { name: "🥉 Bronze", min: 100, boost: 0.5 },
  { name: "🥈 Silver", min: 500, boost: 1.0 },
  { name: "🥇 Gold", min: 2000, boost: 2.0 },
  { name: "💎 Diamond", min: 10000, boost: 3.0 },
  { name: "👑 Legend", min: 50000, boost: 5.0 },
];

export const BASE_APY = 5.0;

function generateDemoAddr() {
  return "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

export function getTierData(pts: number) {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (pts >= t.min) current = t;
  }
  return current;
}

export function useUserState(showToast: (msg: string, type?: "success" | "error" | "info") => void) {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();

  const [demoMode, setDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string>(generateDemoAddr());

  const [points, setPoints] = useState<number>(0);
  const [stakedBalance, setStakedBalance] = useState<number>(0);
  const [earnedYield, setEarnedYield] = useState<number>(0);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");

  const effectiveConnected = wagmiConnected || demoMode;
  const effectiveAddress = wagmiConnected && wagmiAddress ? wagmiAddress : demoMode ? demoAddress : null;

  const currentTier = getTierData(points);
  const effectiveAPY = BASE_APY + currentTier.boost;

  const nextTierIndex = TIERS.findIndex((t) => t.name === currentTier.name) + 1;
  const nextTier = nextTierIndex < TIERS.length ? TIERS[nextTierIndex] : null;
  const progressPercent = nextTier
    ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  const fetchUserProfile = useCallback(async (addr: string) => {
    try {
      const res = await fetch(`/api/user?wallet=${encodeURIComponent(addr)}`);
      if (!res.ok) return;
      const user = await res.json();
      setPoints(user.points ?? 0);
      setStakedBalance(parseFloat(user.staked_balance ?? "0"));
      setEarnedYield(parseFloat(user.earned_yield ?? "0"));
      setGamesPlayed(user.games_played ?? 0);
      setWins(user.wins ?? 0);
    } catch {
      // Supabase not configured — leave defaults
    }
  }, []);

  const syncStakedBalance = useCallback(async (addr: string, balance: number) => {
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: addr, staked_balance: balance }),
      });
    } catch { /* offline / not configured */ }
  }, []);

  const handleWalletConnect = useCallback((addr: string) => {
    showToast("Wallet connected!", "success");
    fetchUserProfile(addr);
    if (demoMode) setDemoMode(false);
  }, [showToast, fetchUserProfile, demoMode]);

  const handleWalletDisconnect = useCallback(() => {
    showToast("Wallet disconnected", "info");
    setDemoMode(false);
  }, [showToast]);

  const activateDemoMode = useCallback(() => {
    const addr = generateDemoAddr();
    setDemoAddress(addr);
    setDemoMode(true);
    showToast("Demo mode activated!", "success");
    fetchUserProfile(addr).catch(() => {
      setPoints(350);
      setStakedBalance(125.50);
      setEarnedYield(2.34);
      setGamesPlayed(12);
      setWins(5);
      setRecentGames([
        { mode: "free", players: 2, won: true, points: 15, date: new Date(Date.now() - 3600000) },
        { mode: "tournament", players: 4, won: false, points: 20, date: new Date(Date.now() - 7200000) }
      ]);
    });
  }, [showToast, fetchUserProfile]);

  const handleStake = useCallback(() => {
    if (!effectiveConnected) {
      showToast("Connect wallet first!", "error");
      return;
    }
    const amt = parseFloat(stakeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    const newBalance = stakedBalance + amt;
    setStakedBalance(newBalance);
    setStakeAmount("");
    showToast(`Staked ${amt.toFixed(2)} cUSD successfully!`, "success");
    if (effectiveAddress) syncStakedBalance(effectiveAddress, newBalance);
  }, [effectiveConnected, stakeAmount, stakedBalance, effectiveAddress, showToast, syncStakedBalance]);

  const handleUnstake = useCallback(() => {
    if (!effectiveConnected) {
      showToast("Connect wallet first!", "error");
      return;
    }
    const amt = parseFloat(unstakeAmount);
    if (isNaN(amt) || amt <= 0 || amt > stakedBalance) {
      showToast("Invalid amount", "error");
      return;
    }
    const newBalance = stakedBalance - amt;
    setStakedBalance(newBalance);
    setUnstakeAmount("");
    showToast(`Unstaked ${amt.toFixed(2)} cUSD`, "info");
    if (effectiveAddress) syncStakedBalance(effectiveAddress, newBalance);
  }, [effectiveConnected, unstakeAmount, stakedBalance, effectiveAddress, showToast, syncStakedBalance]);

  return {
    // wallet state
    demoMode,
    setDemoMode,
    effectiveConnected,
    effectiveAddress,
    handleWalletConnect,
    handleWalletDisconnect,
    activateDemoMode,

    // user data
    points,
    setPoints,
    stakedBalance,
    earnedYield,
    gamesPlayed,
    setGamesPlayed,
    wins,
    setWins,
    recentGames,
    setRecentGames,

    // tier data
    currentTier,
    effectiveAPY,
    nextTier,
    progressPercent,

    // staking
    stakeAmount,
    setStakeAmount,
    unstakeAmount,
    setUnstakeAmount,
    handleStake,
    handleUnstake,

    // profile sync
    fetchUserProfile,
  };
}
