"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LudoGame, Player, GameCallbacks } from "@/app/ludoEngine";
import { soundManager } from "@/lib/sound";
import type { RecentGame } from "./useUserState";

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number;
  rollButtonText: string;
  rollButtonDisabled: boolean;
  gameTimerText: string;
  gameLog: string[];
  gamePtsEarned: number;
  isGameOver: boolean;
  gameOverWon: boolean;
  gameOverPoints: number;
}

export function useGameController(
  currentView: "home" | "play" | "staking" | "profile" | "game",
  activePlayerCount: number,
  gameMode: "free" | "tournament",
  activeGameId: string | null,
  effectiveAddress: string | null,
  points: number,
  gamesPlayed: number,
  wins: number,
  setPoints: (val: number | ((prev: number) => number)) => void,
  setGamesPlayed: (val: number | ((prev: number) => number)) => void,
  setWins: (val: number | ((prev: number) => number)) => void,
  setActiveGameId: (val: string | null) => void,
  setActiveOnChainGameId: (val: number | null) => void,
  addRecentGame: (game: RecentGame) => void,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<LudoGame | null>(null);

  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [rollButtonText, setRollButtonText] = useState<string>("🎲 Roll Dice");
  const [rollButtonDisabled, setRollButtonDisabled] = useState<boolean>(false);
  const [gameTimerText, setGameTimerText] = useState<string>("⏱ 0:00");
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [gamePtsEarned, setGamePtsEarned] = useState<number>(0);

  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [gameOverWon, setGameOverWon] = useState<boolean>(false);
  const [gameOverPoints, setGameOverPoints] = useState<number>(0);

  const handleRollDice = useCallback(() => {
    if (gameRef.current) gameRef.current.roll();
  }, []);

  const handleLeaveGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
  }, []);

  const resetGameState = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.stop();
      gameRef.current = null;
    }
    setGamePlayers([]);
    setCurrentPlayerIndex(0);
    setDiceValue(1);
    setRollButtonText("🎲 Roll Dice");
    setRollButtonDisabled(false);
    setGameTimerText("⏱ 0:00");
    setGameLog([]);
    setGamePtsEarned(0);
    setIsGameOverModalOpen(false);
  }, []);

  const closeGameOverModal = useCallback(() => {
    setIsGameOverModalOpen(false);
  }, []);

  // Instantiate canvas game engine
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

        setPoints((prev: number) => prev + totalPts);
        setGamesPlayed((prev: number) => prev + 1);
        if (isHuman) setWins((prev: number) => prev + 1);

        const newGameRecord: RecentGame = {
          mode,
          players: pCount,
          won: isHuman,
          points: totalPts,
          date: new Date(),
        };
        addRecentGame(newGameRecord);
        setGamePtsEarned(totalPts);

        setGameOverWon(isHuman);
        setGameOverPoints(totalPts);
        setIsGameOverModalOpen(true);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, activePlayerCount, gameMode]);

  return {
    canvasRef,
    gameRef,
    gamePlayers,
    currentPlayerIndex,
    diceValue,
    rollButtonText,
    rollButtonDisabled,
    gameTimerText,
    gameLog,
    gamePtsEarned,
    isGameOverModalOpen,
    gameOverWon,
    gameOverPoints,
    handleRollDice,
    handleLeaveGame,
    resetGameState,
    closeGameOverModal,
  };
}
