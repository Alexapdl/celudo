"use client";

import { motion } from "framer-motion";

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
  href?: string;
}

export default function PixelButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  href,
}: PixelButtonProps) {
  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: "0.7rem" },
    md: { padding: "12px 24px", fontSize: "0.82rem" },
    lg: { padding: "16px 32px", fontSize: "0.95rem" },
    xl: { padding: "20px 44px", fontSize: "1.1rem" },
  };

  const variantStyles = {
    primary: {
      background: "linear-gradient(180deg, #69f0ae, #00c853)",
      color: "#0a2e1a",
      boxShadow: "0 4px 0 #007e33, 0 6px 14px rgba(0, 200, 83, 0.3)",
      hoverShadow: "0 6px 0 #007e33, 0 8px 18px rgba(0, 200, 83, 0.4)",
    },
    secondary: {
      background: "linear-gradient(180deg, #90caf9, #42a5f5)",
      color: "#0d2137",
      boxShadow: "0 4px 0 #1565c0, 0 6px 14px rgba(66, 165, 245, 0.3)",
      hoverShadow: "0 6px 0 #1565c0, 0 8px 18px rgba(66, 165, 245, 0.4)",
    },
    gold: {
      background: "linear-gradient(180deg, #fff176, #f9a825)",
      color: "#4a3000",
      boxShadow: "0 5px 0 #c17900, 0 7px 18px rgba(249, 168, 37, 0.4)",
      hoverShadow: "0 7px 0 #c17900, 0 10px 22px rgba(249, 168, 37, 0.5)",
    },
    danger: {
      background: "linear-gradient(180deg, #ff8a80, #ff5252)",
      color: "#3a0000",
      boxShadow: "0 4px 0 #c62828, 0 6px 14px rgba(255, 82, 82, 0.3)",
      hoverShadow: "0 6px 0 #c62828, 0 8px 18px rgba(255, 82, 82, 0.4)",
    },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={`pixel-btn ${className}`}
      style={{
        ...s,
        background: v.background,
        color: v.color,
        boxShadow: v.boxShadow,
        fontFamily: "var(--pixel)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        border: "2px solid rgba(0,0,0,0.15)",
        borderRadius: "var(--r, 12px)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 800,
        position: "relative" as const,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      whileHover={!disabled ? { y: -3, boxShadow: v.hoverShadow } : {}}
      whileTap={!disabled ? { y: 2, boxShadow: "0 1px 0 rgba(0,0,0,0.3)" } : {}}
    >
      {children}
    </Component>
  );
}