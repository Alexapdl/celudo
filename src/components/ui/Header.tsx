"use client";

import WalletButton from "./WalletButton";
import { motion } from "framer-motion";

interface HeaderProps {
  currentView: "home" | "play" | "staking" | "profile" | "game";
  onNavigate: (view: "home" | "play" | "staking" | "profile") => void;
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
}

const tabs: { view: "home" | "play" | "staking" | "profile"; label: string }[] = [
  { view: "play", label: "Play" },
  { view: "staking", label: "Stake" },
  { view: "profile", label: "Profile" },
];

export default function Header({
  currentView,
  onNavigate,
  onWalletConnect,
  onWalletDisconnect,
}: HeaderProps) {
  const activeTab = currentView === "game" ? "play" : currentView;

  return (
    <header className="app-header">
      <div className="header-inner">
        <motion.button
          className="logo"
          onClick={() => onNavigate("home")}
          whileTap={{ scale: 0.95 }}
        >
          <span className="logo-text">CELUDO</span>
        </motion.button>

        <nav className="header-nav">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.view;
            return (
              <motion.button
                key={tab.view}
                className={`nav-pill ${isActive ? "active" : ""}`}
                onClick={() => onNavigate(tab.view)}
                whileTap={{ scale: 0.92 }}
              >
                {tab.label}
              </motion.button>
            );
          })}
        </nav>

        <WalletButton onConnect={onWalletConnect} onDisconnect={onWalletDisconnect} />
      </div>
    </header>
  );
}
