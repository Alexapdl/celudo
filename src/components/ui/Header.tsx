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
  const navItems: { view: "home" | "play" | "staking" | "profile"; label: string; color: string; dark: string }[] = [
    { view: "home", label: "HOME", color: "#40c020", dark: "#1b6e22" },
    { view: "play", label: "PLAY", color: "#ffc020", dark: "#a06000" },
    { view: "staking", label: "STAKE", color: "#c06020", dark: "#803010" },
    { view: "profile", label: "PROFILE", color: "#0040a0", dark: "#003080" },
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
          <Image src="/logo.png" alt="Celudo" className="logo-img" width={32} height={32} />
          <span className="logo-text">CELUDO</span>
        </motion.a>
        <nav className="header-nav">
          {navItems.map((item) => {
            const isActive = currentView === item.view || (item.view === "play" && currentView === "game");
            return (
              <motion.a
                key={item.view}
                href="#"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.view);
                }}
                whileHover={!isActive ? { scale: 1.06, y: -2 } : {}}
                whileTap={{ scale: 0.94, y: 2 }}
                style={isActive ? {
                  background: item.color,
                  color: "#2c1810",
                  borderColor: item.dark,
                  boxShadow: `0 3px 0 ${item.dark}`,
                } : {}}
              >
                <span className="nav-label">{item.label}</span>
              </motion.a>
            );
          })}
        </nav>
        <WalletButton onConnect={onWalletConnect} onDisconnect={onWalletDisconnect} />
      </div>
    </header>
  );
}
