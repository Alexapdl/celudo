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

  useEffect(() => {
    if (isConnected && chainId !== celo.id) {
      switchChain?.({ chainId: celo.id });
    }
  }, [isConnected, chainId, switchChain]);

  useEffect(() => {
    if (isConnected && address && onConnect) onConnect(address);
    if (!isConnected && onDisconnect) onDisconnect();
  }, [isConnected, address, onConnect, onDisconnect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const injectedConnectors = connectors.filter(
    (c) => c.id === "injected" || c.type === "injected" || c.id.includes("injected") || c.id.includes("rabby") || c.id.includes("metaMask")
  );
  const hasMultiple = injectedConnectors.length > 1;

  const handleConnect = () => {
    soundManager.buttonClick();
    if (hasMultiple) {
      setShowDropdown(true);
      return;
    }
    const c = injectedConnectors[0] || connectors[0];
    if (c) connect({ connector: c });
  };

  const handleConnectWallet = (connector: typeof connectors[number]) => {
    soundManager.buttonClick();
    connect({ connector });
    setShowDropdown(false);
  };

  const handleDisconnect = () => {
    soundManager.buttonClick();
    disconnect();
    setShowDropdown(false);
  };

  if (!isConnected || !address) {
    return (
      <div className="wallet-wrapper" ref={dropdownRef}>
        <motion.button
          className="wallet-btn"
          onClick={handleConnect}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={status === "connecting"}
        >
          <span className="wallet-text">
            {status === "connecting" ? "CONNECTING..." : "CONNECT"}
          </span>
        </motion.button>

        <AnimatePresence>
          {showDropdown && hasMultiple && (
            <motion.div
              className="wallet-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="wallet-dropdown-item">
                <span className="wallet-dropdown-label">SELECT WALLET</span>
              </div>
              <div className="wallet-dropdown-divider" />
              {injectedConnectors.map((c) => (
                <button
                  key={c.id}
                  className="wallet-dropdown-btn"
                  onClick={() => handleConnectWallet(c)}
                  style={{ color: "var(--green)", borderColor: "rgba(69,209,133,0.2)", background: "rgba(69,209,133,0.06)", marginBottom: "4px" }}
                >
                  {c.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {connectError && (
          <motion.div className="wallet-error-toast" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            {connectError.message}
          </motion.div>
        )}
      </div>
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
              <span className="wallet-dropdown-label">NETWORK</span>
              <span className="wallet-dropdown-value">
                {chainId === celo.id ? "CELO MAINNET" : "WRONG NETWORK"}
              </span>
            </div>
            <div className="wallet-dropdown-divider" />
            <button className="wallet-dropdown-btn" onClick={handleDisconnect}>
              DISCONNECT
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
