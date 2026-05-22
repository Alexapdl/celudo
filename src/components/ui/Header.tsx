"use client";

import Image from "next/image";
import WalletButton from "./WalletButton";
import { motion } from "framer-motion";

interface HeaderProps {
  currentView: "home" | "play" | "staking" | "profile" | "game";
  onNavigate: (view: "home" | "play" | "staking" | "profile") => void;
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
}

export default function Header({
  currentView,
  onNavigate,
  onWalletConnect,
  onWalletDisconnect,
}: HeaderProps) {
  const navItems: { view: "home" | "play" | "staking" | "profile"; icon: string; label: string }[] = [
    { view: "home", icon: "🏠", label: "Home" },
    { view: "play", icon: "🎲", label: "Play" },
    { view: "staking", icon: "💰", label: "Stake" },
    { view: "profile", icon: "👤", label: "Profile" },
  ];

  return (
    <header className="app-header">
      <div className="header-inner">
        <motion.a
          href="#"
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image src="/celudo_logo.png" alt="Celudo" className="logo-img" width={32} height={32} />
          <span className="logo-text">Celudo</span>
        </motion.a>
        <nav className="header-nav">
          {navItems.map((item) => (
            <motion.a
              key={item.view}
              href="#"
              className={`nav-item ${currentView === item.view || (item.view === "play" && currentView === "game") ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.view);
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </motion.a>
          ))}
        </nav>
        <WalletButton onConnect={onWalletConnect} onDisconnect={onWalletDisconnect} />
      </div>
    </header>
  );
}
