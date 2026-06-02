"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { motion, AnimatePresence } from "framer-motion";

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConnected && address && onConnect) onConnect(address);
  }, [isConnected, address, onConnect]);

  const handleConnect = useCallback(async () => {
    try { connect({ connector: injected() }); } catch { /* user rejected */ }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setOpen(false);
    if (onDisconnect) onDisconnect();
  }, [disconnect, onDisconnect]);

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <div className="wallet-wrapper">
      {isConnected ? (
        <button className="wallet-btn connected" onClick={() => setOpen(!open)}>
          {shortAddr}
        </button>
      ) : (
        <button className="wallet-btn" onClick={handleConnect}>Connect</button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="wallet-dropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="wallet-dropdown-item">
              <span className="wallet-dropdown-label">Address</span>
              <span className="wallet-dropdown-value">{shortAddr}</span>
            </div>
            <div className="wallet-dropdown-divider" />
            <button className="wallet-dropdown-btn" onClick={handleDisconnect}>Disconnect</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
