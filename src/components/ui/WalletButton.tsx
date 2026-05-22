"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { celo } from "wagmi/chains";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { soundManager } from "@/lib/sound";

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const { address, isConnected, status } = useAccount();
  const { connectors, connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-switch to Celo if on wrong chain
  useEffect(() => {
    if (isConnected && chainId !== celo.id) {
      switchChain?.({ chainId: celo.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Notify parent on connect/disconnect
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address);
    }
    if (!isConnected && onDisconnect) {
      onDisconnect();
    }
  }, [isConnected, address, onConnect, onDisconnect]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // MiniPay auto-connect
  useEffect(() => {
    const timer = setTimeout(() => {
      const miniPay = connectors.find((c) => c.name.toLowerCase().includes("minipay") || c.id === "miniPay");
      if (miniPay && !isConnected && status !== "connecting") {
        connect({ connector: miniPay });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [connectors, connect, isConnected, status]);

  const handleConnect = () => {
    soundManager.buttonClick();
    const injected = connectors.find((c) => c.id === "injected" || c.type === "injected");
    if (injected) {
      connect({ connector: injected });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const handleDisconnect = () => {
    soundManager.buttonClick();
    disconnect();
    setShowDropdown(false);
  };

  if (!isConnected || !address) {
    return (
      <motion.button
        className="wallet-btn"
        onClick={handleConnect}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95, y: 2 }}
        disabled={status === "connecting"}
      >
        <span className="wallet-icon">{status === "connecting" ? "⏳" : "🔗"}</span>
        <span className="wallet-text">
          {status === "connecting" ? "Connecting..." : "Connect Wallet"}
        </span>
      </motion.button>
    );
  }

  return (
    <div className="wallet-wrapper" ref={dropdownRef}>
      <motion.button
        className="wallet-btn connected"
        onClick={() => setShowDropdown(!showDropdown)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="wallet-icon">✅</span>
        <span className="wallet-text">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="wallet-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="wallet-dropdown-item">
              <span className="wallet-dropdown-label">Network</span>
              <span className="wallet-dropdown-value">
                {chainId === celo.id ? "✅ Celo Mainnet" : "⚠️ Wrong Network"}
              </span>
            </div>
            <div className="wallet-dropdown-divider" />
            <button className="wallet-dropdown-btn" onClick={handleDisconnect}>
              <span>🔌</span> Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {connectError && (
        <motion.div
          className="wallet-error-toast"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {connectError.message}
        </motion.div>
      )}
    </div>
  );
}
