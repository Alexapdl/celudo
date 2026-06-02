"use client";

import WalletButton from "./WalletButton";
import { motion } from "framer-motion";

interface HeaderProps {
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
  onLogoClick: () => void;
}

export default function Header({ onWalletConnect, onWalletDisconnect, onLogoClick }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <motion.button className="logo" onClick={onLogoClick} whileTap={{ scale: 0.95 }}>
          <span className="logo-text">CELUDO</span>
        </motion.button>
        <WalletButton onConnect={onWalletConnect} onDisconnect={onWalletDisconnect} />
      </div>
    </header>
  );
}
