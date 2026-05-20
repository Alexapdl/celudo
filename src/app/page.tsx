"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import BackgroundCanvas from "./components/BackgroundCanvas";
import CustomCursor from "./components/CustomCursor";
import { LudoGame, Player, C, GameCallbacks } from "./ludoEngine";

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

export default function Home() {
  // Views navigation
  const [currentView, setCurrentView] = useState<"home" | "play" | "staking" | "profile" | "game">("home");
  const [playTab, setPlayTab] = useState<"free" | "tournament" | "cashbet">("free");

  // Wallet and Staking State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [stakedBalance, setStakedBalance] = useState<number>(0);
  const [earnedYield, setEarnedYield] = useState<number>(0);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(DEFAULT_TOURNAMENTS);

  // Staking input fields
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");

  // Cash Bet state
  const [cashBetAmount, setCashBetAmount] = useState<string>("0.1");
  const [cashBetMode, setCashBetMode] = useState<"solo" | "duo" | "4player">("solo");
  const [cashBetLoading, setCashBetLoading] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeOnChainGameId, setActiveOnChainGameId] = useState<number | null>(null);
  const [activeBetAmount, setActiveBetAmount] = useState<string>("0");
  const [activeBetMode, setActiveBetMode] = useState<string>("free");

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

  // Sync user profile from Supabase
  const fetchUserProfile = async (addr: string) => {
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
  };

  // Sync staked_balance to DB
  const syncStakedBalance = async (addr: string, balance: number) => {
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: addr, staked_balance: balance }),
      });
    } catch { /* offline / not configured */ }
  };

  // Calculate Staking Tier & Boost
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

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Nav helper
  const navigate = (view: "home" | "play" | "staking" | "profile" | "game") => {
    if (view !== "game" && gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // Connect Wallet Handler
  const handleConnectWallet = async () => {
    if (isConnected) {
      setIsConnected(false);
      setWalletAddress(null);
      showToast("Wallet disconnected", "info");
      return;
    }

    // Try MetaMask/MiniPay
    if (typeof window !== "undefined" && (window as any).ethereum !== undefined) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        const addr = accounts[0];
        setWalletAddress(addr);
        setIsConnected(true);
        showToast("Wallet connected!", "success");
        fetchUserProfile(addr);

        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xa4ec" }],
          });
        } catch (switchErr) {
          // Chain not added, try to add Celo
          try {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xa4ec",
                  chainName: "Celo Mainnet",
                  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
                  rpcUrls: ["https://forno.celo.org"],
                  blockExplorerUrls: ["https://celoscan.io"],
                },
              ],
            });
          } catch (addErr) {
            console.log("Could not add Celo Mainnet chain");
          }
        }
        return;
      } catch (err) {
        console.log("Wallet connection error, fallback to demo mode");
      }
    }

    // Demo Mode fallback
    const mockAddr = "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    setWalletAddress(mockAddr);
    setIsConnected(true);
    showToast("Connected (Demo Mode)", "success");
    // Try to load from Supabase; set demo defaults only if that fails
    try {
      const res = await fetch(`/api/user?wallet=${mockAddr}`);
      if (res.ok) {
        const user = await res.json();
        setPoints(user.points ?? 350);
        setStakedBalance(parseFloat(user.staked_balance ?? "125.5"));
        setEarnedYield(parseFloat(user.earned_yield ?? "2.34"));
        setGamesPlayed(user.games_played ?? 12);
        setWins(user.wins ?? 5);
        return;
      }
    } catch { /* offline */ }
    setPoints(350);
    setStakedBalance(125.50);
    setEarnedYield(2.34);
    setGamesPlayed(12);
    setWins(5);
    setRecentGames([
      { mode: "free", players: 2, won: true, points: 15, date: new Date(Date.now() - 3600000) },
      { mode: "tournament", players: 4, won: false, points: 20, date: new Date(Date.now() - 7200000) }
    ]);
  };

  // Cash Bet: join lobby → approve ERC-20 → depositBet → launch game
  const joinCashBetRoom = async () => {
    if (!isConnected || !walletAddress) {
      showToast("Connect your wallet first!", "error");
      return;
    }
    setCashBetLoading(true);
    const numPlayers = cashBetMode === "solo" ? 2 : 4;
    const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS;
    const tokenAddress = process.env.NEXT_PUBLIC_USDM_ADDRESS ?? "0x765DE816845861e75A25fCA122bb6898B8B1282a";

    try {
      // Step 1: Register game in backend
      showToast("Creating lobby…", "info");
      const gameRes = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
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
      setActiveBetAmount(cashBetAmount);
      setActiveBetMode(cashBetMode);

      if (escrowAddress && (window as any).ethereum) {
        const { BrowserProvider, parseUnits, Contract } = await import("ethers");
        const provider = new BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        // Step 2: ERC-20 approve
        showToast("Approving token spend…", "info");
        const erc20Abi = [
          "function approve(address spender, uint256 amount) returns (bool)",
        ];
        const token = new Contract(tokenAddress, erc20Abi, signer);
        const approveTx = await token.approve(escrowAddress, parseUnits(cashBetAmount, 18));
        await approveTx.wait();

        // Step 3: depositBet
        showToast("Depositing bet…", "info");
        const escrowAbi = ["function depositBet(uint256 gameId) external"];
        const escrow = new Contract(escrowAddress, escrowAbi, signer);
        const depositTx = await escrow.depositBet(game.on_chain_game_id);
        await depositTx.wait();
      }

      // Step 4: Mark joined in backend + launch
      await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: game.id, wallet: walletAddress }),
      });

      showToast("Bet placed! Launching game…", "success");
      startGame(numPlayers, "free");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      showToast(msg, "error");
    } finally {
      setCashBetLoading(false);
    }
  };

  // Start Ludo Game
  const startGame = (playerCount: number, mode: "free" | "tournament") => {
    if (!isConnected) {
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
  };

  const joinTournament = (id: number) => {
    const t = tournaments.find((x) => x.id === id);
    if (!t) return;
    const pCount = t.players.startsWith("2") ? 2 : 4;
    startGame(pCount, "tournament");
  };

  // Roll Dice trigger
  const handleRollDice = () => {
    if (gameRef.current) {
      gameRef.current.roll();
    }
  };

  // Leave active game
  const handleLeaveGame = () => {
    if (gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
    navigate("play");
  };

  // Staking functions
  const handleStake = () => {
    if (!isConnected) {
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
    if (walletAddress) syncStakedBalance(walletAddress, newBalance);
  };

  const handleUnstake = () => {
    if (!isConnected) {
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
    if (walletAddress) syncStakedBalance(walletAddress, newBalance);
  };

  // auto connect wallet on MiniPay
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum !== undefined) {
      const eth = (window as any).ethereum;
      if (eth.isMiniPay) {
        handleConnectWallet();
      }
    }
  }, []);

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
    return () => {
      observer.disconnect();
    };
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

        // Settle via backend (updates Supabase stats + triggers on-chain payout for cash bets)
        const gId = activeGameId;
        const addr = walletAddress;
        if (gId && addr) {
          const winnersArr = isHuman ? [addr] : [];
          fetch("/api/game/settle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_id: gId, winners: winnersArr }),
          }).catch(() => { /* best-effort */ });
        } else if (addr) {
          // Free game: just sync points to DB
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

        // Reset active game refs
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
  }, [currentView, activePlayerCount, gameMode]);

  // Compute points progress details
  const nextTierIndex = TIERS.findIndex((t) => t.name === currentTier.name) + 1;
  const nextTier = nextTierIndex < TIERS.length ? TIERS[nextTierIndex] : null;
  const progressPercent = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  return (
    <>
      <BackgroundCanvas />
      <CustomCursor />

      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <a href="#" className="logo" onClick={() => navigate("home")}>
            <Image src="/celudo_logo.png" alt="Celudo" className="logo-img" width={32} height={32} />
            <span className="logo-text">Celudo</span>
          </a>
          <nav className="header-nav">
            <a
              href="#"
              className={`nav-item ${currentView === "home" ? "active" : ""}`}
              onClick={() => navigate("home")}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-label">Home</span>
            </a>
            <a
              href="#"
              className={`nav-item ${currentView === "play" || currentView === "game" ? "active" : ""}`}
              onClick={() => navigate("play")}
            >
              <span className="nav-icon">🎲</span>
              <span className="nav-label">Play</span>
            </a>
            <a
              href="#"
              className={`nav-item ${currentView === "staking" ? "active" : ""}`}
              onClick={() => navigate("staking")}
            >
              <span className="nav-icon">💰</span>
              <span className="nav-label">Stake</span>
            </a>
            <a
              href="#"
              className={`nav-item ${currentView === "profile" ? "active" : ""}`}
              onClick={() => navigate("profile")}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">Profile</span>
            </a>
          </nav>
          <button className={`wallet-btn ${isConnected ? "connected" : ""}`} onClick={handleConnectWallet}>
            <span className="wallet-icon">{isConnected ? "✅" : "🔗"}</span>
            <span className="wallet-text">
              {isConnected && walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect Wallet"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* HOME VIEW */}
        <div className={`view ${currentView === "home" ? "active" : ""}`} id="view-home">
          <div className="container">
            <section className="hero-compact">
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
                <button className="btn btn-primary" onClick={() => navigate("play")}>
                  <span>🎲</span> Play Now
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("staking")}>
                  <span>💰</span> Start Staking
                </button>
              </div>
            </section>

            <section className="stats-row">
              <div className="stat-card">
                <span className="stat-icon">📈</span>
                <div className="stat-val">{effectiveAPY.toFixed(1)}%</div>
                <div className="stat-lbl">Effective APY</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⭐</span>
                <div className="stat-val">{points.toLocaleString()}</div>
                <div className="stat-lbl">Your Points</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🚀</span>
                <div className="stat-val">+{currentTier.boost.toFixed(1)}%</div>
                <div className="stat-lbl">APY Boost</div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🏆</span>
                <div className="stat-val">{currentTier.name === "None" ? "—" : currentTier.name}</div>
                <div className="stat-lbl">Tier</div>
              </div>
            </section>

            {/* How It Works */}
            <section className="info-section">
              <h2 className="sec-title">How It Works</h2>
              <div className="steps-row">
                <div className="step">
                  <div className="step-num">1</div>
                  <div className="step-ico">💰</div>
                  <h3>Stake Tokens</h3>
                  <p>Deposit cUSD, USDT or CELO. Earn yield automatically via Aave V3.</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div className="step-ico">🎲</div>
                  <h3>Play Ludo Free</h3>
                  <p>Join free rooms or sponsored tournaments. 2, 3 or 4 players.</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div className="step-ico">⭐</div>
                  <h3>Earn Points</h3>
                  <p>Win tournaments to earn points. Even participating gives you points.</p>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-num">4</div>
                  <div className="step-ico">🚀</div>
                  <h3>Boost APY</h3>
                  <p>Redeem points to level up your tier. Higher tier = higher APY boost.</p>
                </div>
              </div>
            </section>

            {/* Active Tournaments Preview */}
            <section className="info-section">
              <div className="sec-header-row">
                <h2 className="sec-title">🔥 Active Tournaments</h2>
                <button className="btn btn-sm" onClick={() => navigate("play")}>
                  View All →
                </button>
              </div>
              <div className="tournament-preview">
                {tournaments.slice(0, 3).map((t) => (
                  <div className="room-card" key={t.id} onClick={() => joinTournament(t.id)}>
                    <div className="room-badge tournament">TOURNAMENT</div>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{t.icon}</div>
                    <h3>{t.name}</h3>
                    <div className="room-sponsor">Sponsored by {t.sponsor}</div>
                    <div className="room-prize">🏆 {t.prize}</div>
                    <p>{t.players} • {t.joined}/{t.maxPlayers} joined</p>
                    <div className="room-reward">
                      <span>⭐</span> Win up to +{t.reward} points → Boost your APY
                    </div>
                    <button className="btn btn-primary btn-block">Join Free</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* PLAY VIEW (Lobby) */}
        <div className={`view ${currentView === "play" ? "active" : ""}`} id="view-play">
          <div className="container">
            <h2 className="page-title">Choose Your Room</h2>
            <div className="room-tabs">
              <button
                className={`room-tab ${playTab === "free" ? "active" : ""}`}
                onClick={() => setPlayTab("free")}
              >
                🎲 Free Rooms
              </button>
              <button
                className={`room-tab ${playTab === "tournament" ? "active" : ""}`}
                onClick={() => setPlayTab("tournament")}
              >
                🏆 Tournaments
              </button>
              <button
                className={`room-tab ${playTab === "cashbet" ? "active" : ""}`}
                onClick={() => setPlayTab("cashbet")}
              >
                💸 Cash Bet
              </button>
            </div>

            {/* Free Rooms */}
            <div className={`room-panel ${playTab === "free" ? "active" : ""}`} id="panel-free">
              <div className="room-grid">
                <div className="room-card" onClick={() => startGame(2, "free")}>
                  <div className="room-badge free">FREE</div>
                  <div className="room-players">👤👤</div>
                  <h3>1v1 Quick Match</h3>
                  <p>Fast-paced 2-player duel</p>
                  <div className="room-reward">
                    <span>⭐</span> +5 pts per game, +10 if you win
                  </div>
                  <button className="btn btn-primary btn-block">Play Now</button>
                </div>
                <div className="room-card" onClick={() => startGame(3, "free")}>
                  <div className="room-badge free">FREE</div>
                  <div className="room-players">👤👤👤</div>
                  <h3>3-Player Battle</h3>
                  <p>Strategic 3-way showdown</p>
                  <div className="room-reward">
                    <span>⭐</span> +8 pts per game, +15 if you win
                  </div>
                  <button className="btn btn-primary btn-block">Play Now</button>
                </div>
                <div className="room-card" onClick={() => startGame(4, "free")}>
                  <div className="room-badge free">FREE</div>
                  <div className="room-players">👤👤👤👤</div>
                  <h3>4-Player Classic</h3>
                  <p>Full board classic Ludo</p>
                  <div className="room-reward">
                    <span>⭐</span> +10 pts per game, +25 if you win
                  </div>
                  <button className="btn btn-primary btn-block">Play Now</button>
                </div>
              </div>
            </div>

            {/* Tournament Rooms */}
            <div className={`room-panel ${playTab === "tournament" ? "active" : ""}`} id="panel-tournament">
              <div className="room-grid">
                {tournaments.map((t) => (
                  <div className="room-card" key={t.id} onClick={() => joinTournament(t.id)}>
                    <div className="room-badge tournament">TOURNAMENT</div>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{t.icon}</div>
                    <h3>{t.name}</h3>
                    <div className="room-sponsor">Sponsored by {t.sponsor}</div>
                    <div className="room-prize">🏆 {t.prize}</div>
                    <p>{t.players} • {t.joined}/{t.maxPlayers} joined</p>
                    <div className="room-reward">
                      <span>⭐</span> Win up to +{t.reward} points → Boost your APY
                    </div>
                    <button className="btn btn-primary btn-block">Join Free</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash Bet Rooms */}
            <div className={`room-panel ${playTab === "cashbet" ? "active" : ""}`} id="panel-cashbet">
              <div className="cashbet-card">
                <div className="cashbet-header">
                  <span className="cashbet-icon">💸</span>
                  <h3>Cash Bet Room</h3>
                  <p>Put USDm on the line. Winner takes the pool minus a 5% treasury fee. Powered by on-chain escrow.</p>
                </div>

                <div className="cashbet-section">
                  <label className="cashbet-label">Choose Mode</label>
                  <div className="cashbet-mode-grid">
                    {([
                      { key: "solo", label: "1v1 Solo", icon: "👤👤", players: "2 players", desc: "Winner takes all" },
                      { key: "duo", label: "2v2 Duo", icon: "👥👥", players: "4 players", desc: "Team split reward" },
                      { key: "4player", label: "4-Player FFA", icon: "👤👤👤👤", players: "4 players", desc: "Sole winner takes all" },
                    ] as const).map(({ key, label, icon, players, desc }) => (
                      <div
                        key={key}
                        className={`cashbet-mode-card ${cashBetMode === key ? "selected" : ""}`}
                        onClick={() => setCashBetMode(key)}
                      >
                        <div className="cbm-icon">{icon}</div>
                        <div className="cbm-name">{label}</div>
                        <div className="cbm-players">{players}</div>
                        <div className="cbm-desc">{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cashbet-section">
                  <label className="cashbet-label">Bet Amount (USDm per player)</label>
                  <div className="cashbet-amounts">
                    {["0.1", "0.5", "1.0", "5.0"].map((amt) => (
                      <button
                        key={amt}
                        className={`cashbet-amt-btn ${cashBetAmount === amt ? "selected" : ""}`}
                        onClick={() => setCashBetAmount(amt)}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="cashbet-summary">
                  <div className="cbs-row">
                    <span>Your bet</span>
                    <strong>${cashBetAmount} USDm</strong>
                  </div>
                  <div className="cbs-row">
                    <span>Total pool</span>
                    <strong>${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4)).toFixed(2)} USDm</strong>
                  </div>
                  <div className="cbs-row muted">
                    <span>Treasury fee (5%)</span>
                    <span>-${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : 4) * 0.05).toFixed(3)} USDm</span>
                  </div>
                  <div className="cbs-row highlight">
                    <span>Max payout</span>
                    <strong className="neon-green">${(parseFloat(cashBetAmount) * (cashBetMode === "solo" ? 2 : cashBetMode === "duo" ? 2 : 4) * 0.95).toFixed(3)} USDm</strong>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-block cashbet-play-btn"
                  onClick={joinCashBetRoom}
                  disabled={cashBetLoading || !isConnected}
                >
                  {cashBetLoading ? "⏳ Processing..." : isConnected ? `🎲 Place Bet & Play` : "Connect Wallet First"}
                </button>
                <p className="cashbet-note">Funds held by on-chain escrow. Admin wallet settles winner automatically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* GAME VIEW */}
        {currentView === "game" && (
          <div className="view active" id="view-game">
            <div className="game-layout">
              {/* Left: Player Cards */}
              <div className="game-sidebar">
                {gamePlayers.map((player, idx) => {
                  const details = C[idx];
                  const isActive = idx === currentPlayerIndex;
                  const statusText = player.done
                    ? "🏆 WIN"
                    : player.pos === -1
                    ? "🏠 Base"
                    : player.pos >= 52
                    ? "🏠 Home Run"
                    : `Step ${player.pos}`;

                  return (
                    <div
                      key={idx}
                      className={`player-card ${isActive ? "active" : ""}`}
                      style={{ borderColor: details.bg }}
                    >
                      <div className="pc-avatar" style={{ backgroundColor: details.bg }}>
                        {idx === 0 ? "👤" : "🤖"}
                      </div>
                      <div className="pc-info">
                        <div className="pc-name" style={{ color: details.light }}>
                          {idx === 0 ? "You" : details.name}
                        </div>
                        <div className="pc-role">{statusText}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Center: Board + Controls */}
              <div className="game-center">
                <div className="game-top-bar">
                  <button className="btn btn-sm btn-ghost" onClick={handleLeaveGame}>
                    ← Leave
                  </button>
                  <div className="game-info">
                    <span className={`game-mode-badge ${gameMode === "free" ? "free-badge" : "tournament-badge"}`}>
                      {gameMode === "free" ? "FREE ROOM" : "TOURNAMENT"}
                    </span>
                    <span className="game-timer">{gameTimerText}</span>
                  </div>
                  <div className="game-points-display">
                    ⭐ <span>{gamePtsEarned}</span> pts
                  </div>
                </div>

                <div className="game-board-wrap">
                  <canvas ref={canvasRef} id="ludo-canvas" width="600" height="600"></canvas>
                </div>

                <div className="game-bottom">
                  <div className="dice-area">
                    <div className="dice-display">
                      {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][diceValue - 1] || "🎲"}
                    </div>
                    <button
                      className="btn btn-primary btn-dice"
                      id="roll-btn"
                      onClick={handleRollDice}
                      disabled={rollButtonDisabled || currentPlayerIndex !== 0}
                    >
                      {rollButtonText}
                    </button>
                  </div>
                  <div
                    className="turn-indicator"
                    style={{
                      borderColor: C[currentPlayerIndex]?.bg,
                      color: C[currentPlayerIndex]?.bg,
                    }}
                  >
                    {currentPlayerIndex === 0 ? "🎲 Your Turn!" : `${C[currentPlayerIndex]?.name || ""}'s Turn...`}
                  </div>
                  <div className="game-log">
                    {gameLog.map((log, idx) => (
                      <p key={idx}>{log}</p>
                    ))}
                    {gameLog.length === 0 && <p className="text-muted text-center py-2">Game initialized. Good luck!</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAKING VIEW */}
        <div className={`view ${currentView === "staking" ? "active" : ""}`} id="view-staking">
          <div className="container">
            <h2 className="page-title">Staking Dashboard</h2>
            <div className="staking-overview">
              <div className="stake-card-big">
                <div className="stake-apy-display">
                  <div className="apy-label">Your Effective APY</div>
                  <div className="apy-value">{effectiveAPY.toFixed(1)}%</div>
                  <div className="apy-breakdown">
                    <span className="apy-base">Base: 5.0%</span>
                    <span className="apy-plus">+</span>
                    <span className="apy-boost-val">Boost: +{currentTier.boost.toFixed(1)}%</span>
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
                    <strong>{currentTier.name}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="stake-actions-grid">
              <div className="stake-action-card">
                <h3>💰 Stake</h3>
                <div className="input-group">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Amount (cUSD)"
                    min="0"
                    step="0.01"
                  />
                  <button className="btn btn-primary" onClick={handleStake}>
                    Stake
                  </button>
                </div>
              </div>
              <div className="stake-action-card">
                <h3>📤 Unstake</h3>
                <div className="input-group">
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="Amount (cUSD)"
                    min="0"
                    step="0.01"
                  />
                  <button className="btn btn-secondary" onClick={handleUnstake}>
                    Unstake
                  </button>
                </div>
              </div>
            </div>

            {/* Tier Table */}
            <section className="info-section">
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
                    <tr>
                      <td>🥉 Bronze</td>
                      <td>100</td>
                      <td className="boost-cell">+0.5%</td>
                      <td>Basic dice skin</td>
                    </tr>
                    <tr>
                      <td>🥈 Silver</td>
                      <td>500</td>
                      <td className="boost-cell">+1.0%</td>
                      <td>Priority matchmaking</td>
                    </tr>
                    <tr className="tier-highlight">
                      <td>🥇 Gold</td>
                      <td>2,000</td>
                      <td className="boost-cell">+2.0%</td>
                      <td>Exclusive emotes + tournament priority</td>
                    </tr>
                    <tr>
                      <td>💎 Diamond</td>
                      <td>10,000</td>
                      <td className="boost-cell">+3.0%</td>
                      <td>NFT airdrops + private rooms</td>
                    </tr>
                    <tr>
                      <td>👑 Legend</td>
                      <td>50,000</td>
                      <td className="boost-cell">+5.0%</td>
                      <td>Revenue sharing + governance</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* PROFILE VIEW */}
        <div className={`view ${currentView === "profile" ? "active" : ""}`} id="view-profile">
          <div className="container">
            <h2 className="page-title">Profile</h2>
            <div className="profile-header-card">
              <div className="profile-avatar">🎮</div>
              <div className="profile-info">
                <div className="profile-addr">{isConnected && walletAddress ? walletAddress : "Not Connected"}</div>
                <div className="profile-tier-badge">{currentTier.name === "None" ? "No Tier" : currentTier.name}</div>
              </div>
            </div>
            <div className="profile-stats-grid">
              <div className="pstat">
                <div className="pstat-val">{gamesPlayed}</div>
                <div className="pstat-lbl">Games Played</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">{wins}</div>
                <div className="pstat-lbl">Wins</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">{points.toLocaleString()}</div>
                <div className="pstat-lbl">Total Points</div>
              </div>
              <div className="pstat">
                <div className="pstat-val">
                  {gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0}%
                </div>
                <div className="pstat-lbl">Win Rate</div>
              </div>
            </div>
            <section className="info-section">
              <h2 className="sec-title">Points Progress</h2>
              <div className="tier-progress">
                <div className="tier-bar-wrap">
                  <div className="tier-bar-label">
                    <span>
                      {currentTier.name} ({points} pts)
                    </span>
                    <span>
                      {nextTier ? nextTier.name : "👑 Legend"} ({nextTier ? nextTier.min : 50000} pts)
                    </span>
                  </div>
                  <div className="tier-bar">
                    <div className="tier-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text2)", marginTop: "8px" }}>
                  {nextTier
                    ? `${nextTier.min - points} more points to reach ${nextTier.name} (+${nextTier.boost.toFixed(1)}% APY boost)`
                    : "Maximum tier reached! 🎉"}
                </p>
              </div>
            </section>
            <section className="info-section">
              <h2 className="sec-title">Recent Games</h2>
              <div className="recent-games">
                {recentGames.map((game, idx) => (
                  <div className="game-entry" key={idx}>
                    <span>
                      {game.mode === "tournament" ? "🏆" : "🎲"} {game.players}-Player {game.mode}
                    </span>
                    <span className={game.won ? "game-result-win" : "game-result-loss"}>
                      {game.won ? "WIN" : "LOSS"} — +{game.points} pts
                    </span>
                  </div>
                ))}
                {recentGames.length === 0 && (
                  <p className="text-muted">No games played yet. Go play some Ludo!</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.msg}
          </div>
        ))}
      </div>

      {/* Game Over Modal */}
      {isGameOverModalOpen && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-icon">{gameOverWon ? "🏆" : "😢"}</div>
            <h2>{gameOverWon ? "Victory!" : "Game Over"}</h2>
            <p>{gameOverWon ? "Congratulations! You won the game!" : "Better luck next time!"}</p>
            <div className="modal-reward">⭐ +{gameOverPoints} Points Earned</div>
            <div className="modal-btns">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsGameOverModalOpen(false);
                  navigate("play");
                }}
              >
                Play Again
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsGameOverModalOpen(false);
                  navigate("home");
                }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
