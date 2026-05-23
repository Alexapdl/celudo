"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GooeyTextProps {
  texts: string[];
  interval?: number;
  className?: string;
}

export default function GooeyText({ texts, interval = 3000, className = "" }: GooeyTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMorphing, setIsMorphing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsMorphing(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsMorphing(false);
      }, 400);
    }, interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.15, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block"
        >
          {texts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}