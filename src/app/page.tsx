"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import { useUserState, BASE_APY } from "@/hooks/useUserState";
import { useGameController } from "@/hooks/useGameController";
import BackgroundCanvas from "./components/BackgroundCanvas";
import Header from "@/components/ui/Header";
import BottomNav from "@/components/ui/BottomNav";
import ToastContainer from "@/components/ui/ToastContainer";
import HomeScreen from "@/components/home/HomeScreen";
import LobbyScreen from "@/components/lobby/LobbyScreen";
import GameScreen from "@/components/game/GameScreen";
import VictoryModal from "@/components/game/VictoryModal";
import StakingScreen from "@/components/staking/StakingScreen";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { useSound } from "@/lib/sound";
import { soundManager } from "@/lib/sound";
import type { RecentGame } from "@/hooks/useUserState";

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

const DEFAULT_TOURNAMENTS: Tournament[] = [
  { id: 1, name: "Weekly Showdown", sponsor: "Celo Foundation", prize: "500 Points", players: "4-Player", maxPlayers: 32, joined: 24, reward: 100, icon: "🏆" },
  { id: 2, name: "Speed Blitz", sponsor: "Aave Community", prize: "200 Points", players: "2-Player", maxPlayers: 16, joined: 11, reward: 50, icon: "⚡" },
  { id: 3, name: "Grand Classic", sponsor: "MiniPay Partners", prize: "1000 Points", players: "4-Player", maxPlayers: 64, joined: 47, reward: 200, icon: "👑" },
  { id: 4, name: "Newcomer Cup", sponsor: "Celudo Team", prize: "100 Points", players: "2-Player", maxPlayers: 8, joined: 5, reward: 30, icon: "🌟" }
];

type View = "home" | "play" | "staking" | "profile" | "game";

export default function Home() {
  useSound();

  const bgmStarted = useRef(false);
  useEffect(() => {
    if (!bgmStarted.current) {
      bgmStarted.current = true;
      const timer = setTimeout(() => soundManager.startBGM(), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const { toasts, showToast } = useToast();
  const user = useUserState(showToast);

  const [currentView, setCurrentView] = useState<View>("home");
  const [viewKey, setViewKey] = useState(0);

  const [cashBetAmount, setCashBetAmount] = useState<string>("0.1");
  const [cashBetMode, setCashBetMode] = useState<"solo" | "duo" | "4player">("solo");
  const [cashBetLoading, setCashBetLoading] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [, setActiveOnChainGameId] = useState<number | null>(null);

  const [activePlayerCount, setActivePlayerCount] = useState<number>(4);
  const [gameMode, setGameMode] = useState<"free" | "tournament">("free");

  const [tournaments] = useState<Tournament[]>(DEFAULT_TOURNAMENTS);

  const addRecentGame = useCallback((game: RecentGame) => {
    user.setRecentGames((prev) => [game, ...prev].slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const game = useGameController(
    currentView,
    activePlayerCount,
    gameMode,
    activeGameId,
    user.effectiveAddress,
    user.points,
    user.gamesPlayed,
    user.wins,
    user.setPoints,
    user.setGamesPlayed,
    user.setWins,
    setActiveGameId,
    setActiveOnChainGameId,
    addRecentGame,
  );

  const navigate = useCallback((view: View) => {
    if (view !== "game") {
      game.resetGameState();
    }
    setCurrentView(view);
    setViewKey((k) => k + 1);
    window.scrollTo(0, 0);
  }, [game]);

  const startGame = useCallback((playerCount: number, mode: "free" | "tournament") => {
    if (!user.effectiveConnected) {
      showToast("Please connect your wallet first!", "error");
      return;
    }
    setActivePlayerCount(playerCount);
    setGameMode(mode);
    navigate("game");
  }, [user.effectiveConnected, showToast, navigate]);

  const joinTournament = useCallback((id: number) => {
    const t = tournaments.find((x) => x.id === id);
    if (!t) return;
    const pCount = t.players.startsWith("2") ? 2 : 4;
    startGame(pCount, "tournament");
  }, [tournaments, startGame]);

  const joinCashBetRoom = useCallback(async () => {
    if (!user.effectiveConnected || !user.effectiveAddress) {
      showToast("Connect your wallet first!", "error");
      return;
    }
    if (user.demoMode) {
      showToast("Cash bet requires a real wallet. Connect MetaMask or MiniPay!", "error");
      return;
    }
    setCashBetLoading(true);
    const numPlayers = cashBetMode === "solo" ? 2 : 4;
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS;
    const tokenAddress = process.env.NEXT_PUBLIC_USDM_ADDRESS ?? "0x765DE816845861e75A25fCA122bb6898B8B1282a";

    try {
      showToast("Creating lobby…", "info");
      const gameRes = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: user.effectiveAddress,
          mode: cashBetMode,
          bet_amount: cashBetAmount,
          token_address: tokenAddress,
          num_players: numPlayers,
        }),
      });
      if (!gameRes.ok) throw new Error((await gameRes.json()).error ?? "Lobby creation failed");
      const g = await gameRes.json();
      setActiveGameId(g.id);
      setActiveOnChainGameId(g.on_chain_game_id);

      const winEth = typeof window !== "undefined" ? (window as unknown as { ethereum?: unknown }).ethereum : undefined;
      if (escrowAddress && winEth) {
        const { BrowserProvider, parseUnits, Contract } = await import("ethers");
        const provider = new BrowserProvider(winEth as never);
        const signer = await provider.getSigner();

        showToast("Approving token spend…", "info");
        const erc20Abi = ["function approve(address spender, uint256 amount) returns (bool)"];
        const token = new Contract(tokenAddress, erc20Abi, signer);
        const approveTx = await token.approve(escrowAddress, parseUnits(cashBetAmount, 18));
        await approveTx.wait();

        showToast("Depositing bet…", "info");
        const escrowAbi = ["function depositBet(uint256 gameId) external"];
        const escrow = new Contract(escrowAddress, escrowAbi, signer);
        const depositTx = await escrow.depositBet(g.on_chain_game_id);
        await depositTx.wait();
      }

      await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: g.id, wallet: user.effectiveAddress }),
      });

      showToast("Bet placed! Launching game…", "success");
      startGame(numPlayers, "free");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      showToast(msg, "error");
    } finally {
      setCashBetLoading(false);
    }
  }, [user.effectiveConnected, user.effectiveAddress, user.demoMode, cashBetMode, cashBetAmount, showToast, startGame]);

  useEffect(() => {
    if (currentView !== "home") return;
    const steps = document.querySelectorAll(".step");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Array.from(steps).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add("step-visible");
          }, idx * 150);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    steps.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case "home":
        return (
          <div className="view" key={`home-${viewKey}`}><HomeScreen
            points={user.points}
            effectiveAPY={user.effectiveAPY}
            currentTierName={user.currentTier.name}
            currentTierBoost={user.currentTier.boost}
            tournaments={tournaments}
            isConnected={user.effectiveConnected}
            onNavigatePlay={() => navigate("play")}
            onJoinTournament={joinTournament}
            onActivateDemo={user.activateDemoMode}
          /></div>
        );
      case "play":
        return (
          <div className="view" key={`play-${viewKey}`}><LobbyScreen
            isConnected={user.effectiveConnected}
            cashBetAmount={cashBetAmount}
            cashBetMode={cashBetMode}
            cashBetLoading={cashBetLoading}
            tournaments={tournaments}
            onStartGame={startGame}
            onJoinTournament={joinTournament}
            onJoinCashBetRoom={joinCashBetRoom}
            onSetCashBetAmount={setCashBetAmount}
            onSetCashBetMode={setCashBetMode}
          /></div>
        );
      case "game":
        return (
          <div key={`game-${viewKey}`} style={{ height: "100%" }}>
          <GameScreen
            canvasRef={game.canvasRef}
            gamePlayers={game.gamePlayers}
            currentPlayerIndex={game.currentPlayerIndex}
            diceValue={game.diceValue}
            isRolling={game.rollButtonDisabled && game.rollButtonText === "Rolling..."}
            rollButtonDisabled={game.rollButtonDisabled}
            gameTimerText={game.gameTimerText}
            gameLog={game.gameLog}
            gameMode={gameMode}
            gamePtsEarned={game.gamePtsEarned}
            onRollDice={game.handleRollDice}
            onLeaveGame={() => navigate("play")}
          /></div>
        );
      case "staking":
        return (
          <div className="view" key={`staking-${viewKey}`}><StakingScreen
            effectiveAPY={user.effectiveAPY}
            baseAPY={BASE_APY}
            currentTierBoost={user.currentTier.boost}
            currentTierName={user.currentTier.name}
            stakedBalance={user.stakedBalance}
            earnedYield={user.earnedYield}
            stakeAmount={user.stakeAmount}
            unstakeAmount={user.unstakeAmount}
            onSetStakeAmount={user.setStakeAmount}
            onSetUnstakeAmount={user.setUnstakeAmount}
            onStake={user.handleStake}
            onUnstake={user.handleUnstake}
          /></div>
        );
      case "profile":
        return (
          <div className="view" key={`profile-${viewKey}`}><ProfileScreen
            isConnected={user.effectiveConnected}
            walletAddress={user.effectiveAddress}
            currentTierName={user.currentTier.name}
            gamesPlayed={user.gamesPlayed}
            wins={user.wins}
            points={user.points}
            progressPercent={user.progressPercent}
            nextTierName={user.nextTier?.name ?? null}
            nextTierMin={user.nextTier?.min ?? 50000}
            pointsToNext={user.nextTier ? user.nextTier.min - user.points : null}
            recentGames={user.recentGames}
          /></div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <BackgroundCanvas />

      <Header
        onLogoClick={() => navigate("home")}
        onWalletConnect={user.handleWalletConnect}
        onWalletDisconnect={user.handleWalletDisconnect}
      />

      {user.demoMode && (
        <div className="demo-banner">
          <span>🎮 Demo Mode — no real transactions</span>
          <button onClick={() => user.setDemoMode(false)}>Exit Demo</button>
        </div>
      )}

      <main className={`app-main${user.demoMode ? " demo-active" : ""}`}>
        {renderView()}
      </main>

      <ToastContainer toasts={toasts} />

      {currentView !== "game" && (
        <BottomNav currentView={currentView} onNavigate={(v) => navigate(v)} />
      )}

      <VictoryModal
        isOpen={game.isGameOverModalOpen}
        won={game.gameOverWon}
        points={game.gameOverPoints}
        onPlayAgain={() => {
          game.closeGameOverModal();
          navigate("play");
        }}
        onGoHome={() => {
          game.closeGameOverModal();
          navigate("home");
        }}
      />
    </>
  );
}
