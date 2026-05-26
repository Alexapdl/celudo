"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { LudoGame, Player, GameCallbacks } from "../ludoEngine";
import BackgroundCanvas from "../components/BackgroundCanvas";
import Header from "@/components/ui/Header";
import ToastContainer from "@/components/ui/ToastContainer";
import HomeScreen from "@/components/home/HomeScreen";
import LobbyScreen from "@/components/lobby/LobbyScreen";
import GameScreen from "@/components/game/GameScreen";
import VictoryModal from "@/components/game/VictoryModal";
import StakingScreen from "@/components/staking/StakingScreen";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { soundManager, useSound } from "@/lib/sound";

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

interface RecentGame {
  mode: string;
  players: number;
  won: boolean;
  points: number;
  date: Date;
}

interface Toast {
  id: string;
  msg: string;
  type: "success" | "error" | "info";
}

const TIERS = [
  { name: "None", min: 0, boost: 0 },
  { name: "🥉 Bronze", min: 100, boost: 0.5 },
  { name: "🥈 Silver", min: 500, boost: 1.0 },
  { name: "🥇 Gold", min: 2000, boost: 2.0 },
  { name: "💎 Diamond", min: 10000, boost: 3.0 },
  { name: "👑 Legend", min: 50000, boost: 5.0 },
];

const DEFAULT_TOURNAMENTS: Tournament[] = [
  { id: 1, name: "Weekly Showdown", sponsor: "Celo Foundation", prize: "500 Points", players: "4-Player", maxPlayers: 32, joined: 24, reward: 100, icon: "🏆" },
  { id: 2, name: "Speed Blitz", sponsor: "Aave Community", prize: "200 Points", players: "2-Player", maxPlayers: 16, joined: 11, reward: 50, icon: "⚡" },
  { id: 3, name: "Grand Classic", sponsor: "MiniPay Partners", prize: "1000 Points", players: "4-Player", maxPlayers: 64, joined: 47, reward: 200, icon: "👑" },
  { id: 4, name: "Newcomer Cup", sponsor: "Celudo Team", prize: "100 Points", players: "2-Player", maxPlayers: 8, joined: 5, reward: 30, icon: "🌟" }
];

function generateDemoAddr() {
  return "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

export default function Home() {
  useSound();

  // Wagmi wallet state
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();

  // Views navigation
  const [currentView, setCurrentView] = useState<"home" | "play" | "staking" | "profile" | "game">("home");

  // Demo mode fallback when no wallet extension
  const [demoMode, setDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string>(generateDemoAddr());

  // Effective wallet state (wagmi or demo)
  const effectiveConnected = wagmiConnected || demoMode;
  const effectiveAddress = wagmiConnected && wagmiAddress ? wagmiAddress : demoMode ? demoAddress : null;

  // Wallet and Staking State
  const [points, setPoints] = useState<number>(0);
  const [stakedBalance, setStakedBalance] = useState<number>(0);
  const [earnedYield, setEarnedYield] = useState<number>(0);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [tournaments] = useState<Tournament[]>(DEFAULT_TOURNAMENTS);

  // Staking input fields
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");

  // Cash Bet state
  const [cashBetAmount, setCashBetAmount] = useState<string>("0.1");
  const [cashBetMode, setCashBetMode] = useState<"solo" | "duo" | "4player">("solo");
  const [cashBetLoading, setCashBetLoading] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeOnChainGameId, setActiveOnChainGameId] = useState<number | null>(null);

  // Game setup configurations
  const [activePlayerCount, setActivePlayerCount] = useState<number>(4);
  const [gameMode, setGameMode] = useState<"free" | "tournament">("free");

  // Active Ludo Engine States
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [rollButtonText, setRollButtonText] = useState<string>("🎲 Roll Dice");
  const [rollButtonDisabled, setRollButtonDisabled] = useState<boolean>(false);
  const [gameTimerText, setGameTimerText] = useState<string>("⏱ 0:00");
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [gamePtsEarned, setGamePtsEarned] = useState<number>(0);

  // Game Over Modal State
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [gameOverWon, setGameOverWon] = useState<boolean>(false);
  const [gameOverPoints, setGameOverPoints] = useState<number>(0);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<LudoGame | null>(null);

  // Calculate tier data
  const getTierData = (pts: number) => {
    let current = TIERS[0];
    for (const t of TIERS) {
      if (pts >= t.min) current = t;
    }
    return current;
  };

  const currentTier = getTierData(points);
  const baseAPY = 5.0;
  const effectiveAPY = baseAPY + currentTier.boost;

  const nextTierIndex = TIERS.findIndex((t) => t.name === currentTier.name) + 1;
  const nextTier = nextTierIndex < TIERS.length ? TIERS[nextTierIndex] : null;
  const progressPercent = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    soundManager.toastSound(type);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Nav helper
  const navigate = useCallback((view: "home" | "play" | "staking" | "profile" | "game") => {
    if (view !== "game" && gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  }, []);

  // Sync user profile from Supabase
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

  // Sync staked_balance to DB
  const syncStakedBalance = useCallback(async (addr: string, balance: number) => {
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: addr, staked_balance: balance }),
      });
    } catch { /* offline / not configured */ }
  }, []);

  // Wallet connect handler from wagmi
  const handleWalletConnect = useCallback((addr: string) => {
    showToast("Wallet connected!", "success");
    fetchUserProfile(addr);
    if (demoMode) setDemoMode(false);
  }, [showToast, fetchUserProfile, demoMode]);

  // Wallet disconnect handler
  const handleWalletDisconnect = useCallback(() => {
    showToast("Wallet disconnected", "info");
    setDemoMode(false);
  }, [showToast]);

  // Demo mode activation
  const activateDemoMode = useCallback(() => {
    const addr = generateDemoAddr();
    setDemoAddress(addr);
    setDemoMode(true);
    showToast("Demo mode activated!", "success");
    // Try to load from Supabase; set demo defaults only if that fails
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

  // Start Ludo Game
  const startGame = useCallback((playerCount: number, mode: "free" | "tournament") => {
    if (!effectiveConnected) {
      showToast("Please connect your wallet first!", "error");
      return;
    }
    setActivePlayerCount(playerCount);
    setGameMode(mode);
    setGameLog([]);
    setDiceValue(1);
    setGameTimerText("⏱ 0:00");
    setRollButtonText("🎲 Roll Dice");
    setRollButtonDisabled(false);
    navigate("game");
  }, [effectiveConnected, showToast, navigate]);

  const joinTournament = useCallback((id: number) => {
    const t = tournaments.find((x) => x.id === id);
    if (!t) return;
    const pCount = t.players.startsWith("2") ? 2 : 4;
    startGame(pCount, "tournament");
  }, [tournaments, startGame]);

  // Roll Dice trigger
  const handleRollDice = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.roll();
    }
  }, []);

  // Leave active game
  const handleLeaveGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
    navigate("play");
  }, [navigate]);

  // Cash Bet: join lobby → approve ERC-20 → depositBet → launch game
  const joinCashBetRoom = useCallback(async () => {
    if (!effectiveConnected || !effectiveAddress) {
      showToast("Connect your wallet first!", "error");
      return;
    }
    if (demoMode) {
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
          wallet: effectiveAddress,
          mode: cashBetMode,
          bet_amount: cashBetAmount,
          token_address: tokenAddress,
          num_players: numPlayers,
        }),
      });
      if (!gameRes.ok) throw new Error((await gameRes.json()).error ?? "Lobby creation failed");
      const game = await gameRes.json();
      setActiveGameId(game.id);
      setActiveOnChainGameId(game.on_chain_game_id);

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
        const depositTx = await escrow.depositBet(game.on_chain_game_id);
        await depositTx.wait();
      }

      await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: game.id, wallet: effectiveAddress }),
      });

      showToast("Bet placed! Launching game…", "success");
      startGame(numPlayers, "free");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      showToast(msg, "error");
    } finally {
      setCashBetLoading(false);
    }
  }, [effectiveConnected, effectiveAddress, demoMode, cashBetMode, cashBetAmount, showToast, startGame]);

  // Staking functions
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

  // IntersectionObserver for step animations in Home view
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

  // Instantiate Game Canvas Engine
  useEffect(() => {
    if (currentView !== "game" || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const callbacks: GameCallbacks = {
      onUpdateUI: (players, curIndex) => {
        setGamePlayers([...players]);
        setCurrentPlayerIndex(curIndex);
      },
      onLog: (msg) => {
        setGameLog((prev) => [msg, ...prev].slice(0, 12));
        if (msg.includes("captures")) soundManager.capture();
        else if (msg.includes("enters")) soundManager.tokenMove();
        else if (msg.includes("home stretch")) soundManager.tokenMove();
      },
      onTimerUpdate: (timerText) => {
        setGameTimerText(timerText);
      },
      onDiceRollStart: () => {
        setRollButtonDisabled(true);
        setRollButtonText("Rolling...");
      },
      onDiceRollEnd: (val) => {
        setDiceValue(val);
      },
      onRollButtonState: (text, disabled) => {
        setRollButtonText(text);
        setRollButtonDisabled(disabled);
      },
      onGameOver: (winnerIdx, isHuman) => {
        const pCount = activePlayerCount;
        const mode = gameMode;
        const pointsBase = mode === "tournament" ? 20 : (pCount === 2 ? 5 : pCount === 3 ? 8 : 10);
        const pointsWin = isHuman ? (mode === "tournament" ? 100 : (pCount === 2 ? 10 : pCount === 3 ? 15 : 25)) : 0;
        const totalPts = pointsBase + pointsWin;

        setPoints((prev) => prev + totalPts);
        setGamesPlayed((prev) => prev + 1);
        if (isHuman) setWins((prev) => prev + 1);

        const newGameRecord: RecentGame = {
          mode,
          players: pCount,
          won: isHuman,
          points: totalPts,
          date: new Date(),
        };
        setRecentGames((prev) => [newGameRecord, ...prev].slice(0, 10));
        setGamePtsEarned(totalPts);

        setGameOverWon(isHuman);
        setGameOverPoints(totalPts);
        setIsGameOverModalOpen(true);

        // Settle via backend
        const gId = activeGameId;
        const addr = effectiveAddress;
        if (gId && addr) {
          const winnersArr = isHuman ? [addr] : [];
          fetch("/api/game/settle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_id: gId, winners: winnersArr }),
          }).catch(() => { /* best-effort */ });
        } else if (addr) {
          fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wallet: addr,
              points: (points ?? 0) + totalPts,
              games_played: (gamesPlayed ?? 0) + 1,
              wins: (wins ?? 0) + (isHuman ? 1 : 0),
            }),
          }).catch(() => { /* best-effort */ });
        }

        setActiveGameId(null);
        setActiveOnChainGameId(null);
      },
    };

    const game = new LudoGame(canvas, activePlayerCount, callbacks);
    gameRef.current = game;

    return () => {
      game.stop();
      gameRef.current = null;
    };
  }, [currentView, activePlayerCount, gameMode, activeGameId, effectiveAddress, points, gamesPlayed, wins]);

  return (
    <>
      <BackgroundCanvas />

      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view !== "play" && gameRef.current) {
            gameRef.current.stop();
            gameRef.current = null;
          }
          setCurrentView(view);
          window.scrollTo(0, 0);
        }}
        onWalletConnect={handleWalletConnect}
        onWalletDisconnect={handleWalletDisconnect}
      />

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="demo-banner">
          <span>🎮 Demo Mode — no real transactions</span>
          <button onClick={() => setDemoMode(false)}>Exit Demo</button>
        </div>
      )}

      <main className="app-main">
        {/* HOME VIEW */}
        <div className={`view ${currentView === "home" ? "active" : ""}`} id="view-home">
          <HomeScreen
            points={points}
            effectiveAPY={effectiveAPY}
            currentTierName={currentTier.name}
            currentTierBoost={currentTier.boost}
            tournaments={tournaments}
            isConnected={effectiveConnected}
            onNavigatePlay={() => navigate("play")}
            onNavigateStaking={() => navigate("staking")}
            onJoinTournament={joinTournament}
            onActivateDemo={activateDemoMode}
          />
        </div>

        {/* PLAY VIEW (Lobby) */}
        <div className={`view ${currentView === "play" ? "active" : ""}`} id="view-play">
          <LobbyScreen
            isConnected={effectiveConnected}
            cashBetAmount={cashBetAmount}
            cashBetMode={cashBetMode}
            cashBetLoading={cashBetLoading}
            tournaments={tournaments}
            onStartGame={startGame}
            onJoinTournament={joinTournament}
            onJoinCashBetRoom={joinCashBetRoom}
            onSetCashBetAmount={setCashBetAmount}
            onSetCashBetMode={setCashBetMode}
          />
        </div>

        {/* GAME VIEW */}
        {currentView === "game" && (
          <GameScreen
            canvasRef={canvasRef}
            gamePlayers={gamePlayers}
            currentPlayerIndex={currentPlayerIndex}
            diceValue={diceValue}
            isRolling={rollButtonDisabled && rollButtonText === "Rolling..."}
            rollButtonDisabled={rollButtonDisabled}
            gameTimerText={gameTimerText}
            gameLog={gameLog}
            gameMode={gameMode}
            gamePtsEarned={gamePtsEarned}
            onRollDice={handleRollDice}
            onLeaveGame={handleLeaveGame}
          />
        )}

        {/* STAKING VIEW */}
        <div className={`view ${currentView === "staking" ? "active" : ""}`} id="view-staking">
          <StakingScreen
            effectiveAPY={effectiveAPY}
            baseAPY={baseAPY}
            currentTierBoost={currentTier.boost}
            currentTierName={currentTier.name}
            stakedBalance={stakedBalance}
            earnedYield={earnedYield}
            stakeAmount={stakeAmount}
            unstakeAmount={unstakeAmount}
            onSetStakeAmount={setStakeAmount}
            onSetUnstakeAmount={setUnstakeAmount}
            onStake={handleStake}
            onUnstake={handleUnstake}
          />
        </div>

        {/* PROFILE VIEW */}
        <div className={`view ${currentView === "profile" ? "active" : ""}`} id="view-profile">
          <ProfileScreen
            isConnected={effectiveConnected}
            walletAddress={effectiveAddress}
            currentTierName={currentTier.name}
            gamesPlayed={gamesPlayed}
            wins={wins}
            points={points}
            progressPercent={progressPercent}
            nextTierName={nextTier?.name ?? null}
            nextTierMin={nextTier?.min ?? 50000}
            pointsToNext={nextTier ? nextTier.min - points : null}
            recentGames={recentGames}
          />
        </div>
      </main>

      <ToastContainer toasts={toasts} />

      <VictoryModal
        isOpen={isGameOverModalOpen}
        won={gameOverWon}
        points={gameOverPoints}
        onPlayAgain={() => {
          setIsGameOverModalOpen(false);
          navigate("play");
        }}
        onGoHome={() => {
          setIsGameOverModalOpen(false);
          navigate("home");
        }}
      />
    </>
  );
}
