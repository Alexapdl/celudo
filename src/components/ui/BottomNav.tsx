"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Anchor, Dices, Coins, User, Volume2, VolumeX } from "lucide-react";
import { soundManager } from "@/lib/sound";

interface BottomNavProps {
  currentView: "home" | "play" | "staking" | "profile" | "game";
  onNavigate: (view: "home" | "play" | "staking" | "profile") => void;
}

const tabs: { view: "home" | "play" | "staking" | "profile"; label: string; Icon: typeof Anchor }[] = [
  { view: "home", label: "Home", Icon: Anchor },
  { view: "play", label: "Play", Icon: Dices },
  { view: "staking", label: "Stake", Icon: Coins },
  { view: "profile", label: "Profile", Icon: User },
];

export default function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const active = currentView === "game" ? "play" : currentView;
  const [soundOn, setSoundOn] = useState(() => soundManager.isEnabled());

  const toggleSound = useCallback(() => {
    if (soundOn) {
      soundManager.stopBGM();
      soundManager.toggle();
      setSoundOn(false);
    } else {
      soundManager.toggle();
      soundManager.startBGM();
      setSoundOn(true);
    }
  }, [soundOn]);

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
      {tabs.map((tab) => {
        const isActive = active === tab.view;
        return (
          <motion.button
            key={tab.view}
            className={`bn-tab ${isActive ? "active" : ""}`}
            onClick={() => onNavigate(tab.view)}
            whileTap={{ scale: 0.9 }}
          >
            <span className="bn-icon"><tab.Icon size={20} /></span>
            <span className="bn-label">{tab.label}</span>
          </motion.button>
        );
      })}
      <motion.button
        className={`bn-tab bn-sound ${soundOn ? "" : "muted"}`}
        onClick={toggleSound}
        whileTap={{ scale: 0.9 }}
      >
        <span className="bn-icon">{soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}</span>
        <span className="bn-label">{soundOn ? "On" : "Off"}</span>
      </motion.button>
      </div>
    </nav>
  );
}
